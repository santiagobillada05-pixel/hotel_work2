import { supabase } from '../lib/supabaseClient';
import api from './client';

export const reservationsApi = {
  createReservation: async (data) => {
    try {
      const stored = localStorage.getItem('user');
      const user = stored ? JSON.parse(stored) : null;
      if (!user) throw new Error('Debes iniciar sesión para realizar una reserva.');

      // Fetch room price
      const { data: room, error: rErr } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', data.room_id)
        .single();
      if (rErr || !room) throw new Error('Habitación no encontrada.');

      const checkIn = new Date(data.check_in_date);
      const checkOut = new Date(data.check_out_date);
      const diff = checkOut - checkIn;
      const nights = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));

      const price = Number(room.price_per_night) > 0 && Number(room.price_per_night) < 2000
        ? Number(room.price_per_night) * 4000
        : Number(room.price_per_night);

      const roomSubtotal = nights * price;
      const taxAmount = Math.round(roomSubtotal * 0.19);
      const totalAmount = roomSubtotal + taxAmount;

      const payload = {
        user_id: user.id,
        room_id: data.room_id,
        check_in_date: data.check_in_date,
        check_out_date: data.check_out_date,
        num_guests: data.num_guests || 1,
        status: 'pending',
        room_price_per_night: price,
        room_subtotal: roomSubtotal,
        extras_subtotal: 0,
        tax_amount: taxAmount,
        discount_amount: 0,
        total_amount: totalAmount,
        special_requests: data.special_requests || null,
      };

      const { data: reservation, error } = await supabase
        .from('reservations')
        .insert(payload)
        .select('*, room:rooms(*), user:users(*)')
        .single();

      if (error) throw error;
      return { success: true, data: reservation };
    } catch (err) {
      if (err.message && (err.message.includes('iniciar sesión') || err.message.includes('Habitación'))) throw err;
      return api.post('/reservations/', data);
    }
  },

  getMyReservations: async () => {
    try {
      const stored = localStorage.getItem('user');
      const user = stored ? JSON.parse(stored) : null;
      if (!user) return { success: true, data: [] };

      const { data, error } = await supabase
        .from('reservations')
        .select('*, room:rooms(*), user:users(*), extras:reservation_extras(*, extra_service:extra_services(*))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (err) {
      return api.get('/reservations/my');
    }
  },

  getAllReservations: async (params = {}) => {
    try {
      let query = supabase
        .from('reservations')
        .select('*, room:rooms(*), user:users(*), extras:reservation_extras(*, extra_service:extra_services(*))')
        .order('created_at', { ascending: false });

      if (params.status) query = query.eq('status', params.status);
      if (params.room_id) query = query.eq('room_id', params.room_id);

      const { data, error } = await query;
      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (err) {
      return api.get('/reservations/', { params });
    }
  },

  getReservationById: async (id) => {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('*, room:rooms(*), user:users(*), extras:reservation_extras(*, extra_service:extra_services(*))')
        .eq('id', id)
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      return api.get(`/reservations/${id}`);
    }
  },

  updateReservation: async (id, data) => {
    try {
      const { data: res, error } = await supabase
        .from('reservations')
        .update(data)
        .eq('id', id)
        .select('*, room:rooms(*), user:users(*)')
        .single();
      if (error) throw error;
      return { success: true, data: res };
    } catch (err) {
      return api.put(`/reservations/${id}`, data);
    }
  },

  cancelReservation: async (id) => {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .select('*, room:rooms(*)')
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      return api.patch(`/reservations/${id}/cancel`);
    }
  },

  checkIn: async (id) => {
    try {
      const { data: res, error } = await supabase
        .from('reservations')
        .update({ status: 'checked_in' })
        .eq('id', id)
        .select('*, room:rooms(*)')
        .single();
      if (error) throw error;
      if (res.room_id) {
        await supabase.from('rooms').update({ status: 'occupied' }).eq('id', res.room_id);
      }
      return { success: true, data: res };
    } catch (err) {
      return api.patch(`/reservations/${id}/check-in`);
    }
  },

  checkOut: async (id) => {
    try {
      const { data: res, error } = await supabase
        .from('reservations')
        .update({ status: 'checked_out' })
        .eq('id', id)
        .select('*, room:rooms(*)')
        .single();
      if (error) throw error;
      if (res.room_id) {
        await supabase.from('rooms').update({ status: 'cleaning' }).eq('id', res.room_id);
      }
      return { success: true, data: res };
    } catch (err) {
      return api.patch(`/reservations/${id}/check-out`);
    }
  },

  confirmReservation: async (id) => {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .update({ status: 'confirmed' })
        .eq('id', id)
        .select('*, room:rooms(*)')
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      return api.patch(`/reservations/${id}/confirm`);
    }
  },
};
