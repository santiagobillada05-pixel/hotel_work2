import { supabase } from '../lib/supabaseClient';
import api from './client';

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
        return {
          success: true,
          data: (rooms || []).filter((r) => !bookedIds.has(r.id)),
        };
      }

      return { success: true, data: rooms || [] };
    } catch (err) {
      console.warn('Supabase rooms fallback to API:', err);
      return api.get('/rooms/available', { params });
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
      return { success: true, data: data || [] };
    } catch (err) {
      return api.get('/rooms/', { params });
    }
  },

  getRoomById: async (id) => {
    try {
      const { data, error } = await supabase.from('rooms').select('*').eq('id', id).single();
      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      return api.get(`/rooms/${id}`);
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
