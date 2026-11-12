import { supabase } from '../lib/supabaseClient';
import api from './client';

export const normalizeRoom = (r) => {
  if (!r) return r;
  let amenities = [];
  if (Array.isArray(r.amenities)) {
    amenities = r.amenities;
  } else if (typeof r.amenities === 'string') {
    try {
      const p = JSON.parse(r.amenities);
      amenities = Array.isArray(p) ? p : [p];
    } catch {
      amenities = r.amenities.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }

  let imageUrls = [];
  if (Array.isArray(r.image_urls)) {
    imageUrls = r.image_urls;
  } else if (typeof r.image_urls === 'string') {
    try {
      const p = JSON.parse(r.image_urls);
      imageUrls = Array.isArray(p) ? p : [p];
    } catch {
      imageUrls = [r.image_urls];
    }
  } else if (r.image_url) {
    imageUrls = [r.image_url];
  }

  const isBookable = r.is_room_bookable !== undefined
    ? Boolean(r.is_room_bookable)
    : (r.status === 'available' && (r.is_active === undefined || Boolean(r.is_active)));

  return {
    ...r,
    amenities,
    image_urls: imageUrls,
    image_url: imageUrls[0] || r.image_url || '',
    is_room_bookable: isBookable,
  };
};

export const roomsApi = {
  getAvailableRooms: async (params = {}) => {
    try {
      let query = supabase.from('rooms').select('*').eq('is_active', true);
      if (params.room_type) query = query.eq('room_type', params.room_type);
      if (params.max_price) query = query.lte('price_per_night', params.max_price);
      if (params.capacity) query = query.gte('capacity', params.capacity);

      const { data: rooms, error } = await query.order('room_number');
      if (error) throw error;

      if (params.check_in && params.check_out) {
        const { data: booked } = await supabase
          .from('reservations')
          .select('room_id')
          .in('status', ['confirmed', 'checked_in'])
          .lt('check_in_date', params.check_out)
          .gt('check_out_date', params.check_in);

        const bookedIds = new Set((booked || []).map((r) => r.room_id));
        const filtered = (rooms || []).filter((r) => !bookedIds.has(r.id));
        return {
          success: true,
          data: filtered.map(normalizeRoom),
        };
      }

      return { success: true, data: (rooms || []).map(normalizeRoom) };
    } catch (err) {
      console.warn('Supabase rooms fallback to API:', err);
      const res = await api.get('/rooms/available', { params });
      return {
        ...res,
        data: Array.isArray(res?.data) ? res.data.map(normalizeRoom) : res?.data,
      };
    }
  },

  getAllRooms: async (params = {}) => {
    try {
      let query = supabase.from('rooms').select('*');
      if (!params.include_inactive) {
        query = query.eq('is_active', true);
      }
      const { data, error } = await query.order('room_number');
      if (error) throw error;
      return { success: true, data: (data || []).map(normalizeRoom) };
    } catch (err) {
      const res = await api.get('/rooms/', { params });
      return {
        ...res,
        data: Array.isArray(res?.data) ? res.data.map(normalizeRoom) : res?.data,
      };
    }
  },

  getRoomById: async (id) => {
    try {
      const { data, error } = await supabase.from('rooms').select('*').eq('id', id).single();
      if (error) throw error;
      return { success: true, data: normalizeRoom(data) };
    } catch (err) {
      const res = await api.get(`/rooms/${id}`);
      return {
        ...res,
        data: normalizeRoom(res?.data),
      };
    }
  },

  createRoom: async (roomData) => {
    try {
      const { data, error } = await supabase.from('rooms').insert(roomData).select().single();
      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      return api.post('/rooms/', roomData);
    }
  },

  updateRoom: async (id, roomData) => {
    try {
      const { data, error } = await supabase.from('rooms').update(roomData).eq('id', id).select().single();
      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      return api.put(`/rooms/${id}`, roomData);
    }
  },

  updateRoomStatus: async (id, status) => {
    try {
      const { data, error } = await supabase.from('rooms').update({ status }).eq('id', id).select().single();
      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      return api.patch(`/rooms/${id}/status`, { status });
    }
  },

  deleteRoom: async (id) => {
    try {
      const { error } = await supabase.from('rooms').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (err) {
      return api.delete(`/rooms/${id}`);
    }
  },
};
