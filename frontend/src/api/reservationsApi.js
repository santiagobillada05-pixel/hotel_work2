import { supabase } from '../lib/supabaseClient';
import api from './client';

export const normalizeReservation = (r) => {
  if (!r) return r;
  const finalTotal = Number(r.final_total !== undefined ? r.final_total : r.total_amount || 0);
  const baseTotal = Number(r.base_total !== undefined ? r.base_total : r.room_subtotal || 0);
  const taxAmount = Number(r.tax_amount || 0);

  return {
    ...r,
    final_total: finalTotal,
    total_amount: finalTotal,
    base_total: baseTotal,
    room_subtotal: baseTotal,
    tax_amount: taxAmount,
    extras: Array.isArray(r.extras)
      ? r.extras
      : Array.isArray(r.reservation_extras)
      ? r.reservation_extras
      : [],
  };
};

export const reservationsApi = {
  createReservation: async (data) => {
    try {
      const stored = localStorage.getItem('user');
      const user = stored ? JSON.parse(stored) : null;
      if (!user) throw new Error('Debes iniciar sesión para realizar una reserva.');

      // Fetch room details
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

      // Process selected extras
      const selectedExtras = Array.isArray(data.selected_extras) ? data.selected_extras : [];
      const extrasTotal = selectedExtras.reduce((sum, item) => {
        const qty = Number(item.quantity) || 1;
        const uPrice = Number(item.price !== undefined ? item.price : item.unit_price) || 0;
        return sum + qty * uPrice;
      }, 0);

      const finalTotal = roomSubtotal + taxAmount + extrasTotal;

      const payload = {
        user_id: user.id,
        room_id: data.room_id,
        check_in_date: data.check_in_date,
        check_out_date: data.check_out_date,
        num_guests: data.num_guests || 1,
        status: 'pending',
        base_total: roomSubtotal,
        tax_amount: taxAmount,
        discount_amount: 0,
        final_total: finalTotal,
        special_requests: data.special_requests || null,
      };

      const { data: reservation, error } = await supabase
        .from('reservations')
        .insert(payload)
        .select('*, room:rooms(*), user:users(*)')
        .single();

      if (error) {
        console.error('Supabase reservation insert error:', error);
        throw error;
      }

      // Insert extras into reservation_extras if any selected
      let savedExtras = [];
      if (selectedExtras.length > 0) {
        const extraRows = selectedExtras.map((item) => {
          const qty = Number(item.quantity) || 1;
          const uPrice = Number(item.price !== undefined ? item.price : item.unit_price) || 0;
          return {
            reservation_id: reservation.id,
            extra_service_id: item.extra_service_id || item.id,
            quantity: qty,
            unit_price: uPrice,
            subtotal: qty * uPrice,
            notes: item.notes || 'Incluido al reservar',
          };
        });

        const { data: insertedEx, error: exErr } = await supabase
          .from('reservation_extras')
          .insert(extraRows)
          .select('*, extra_service:extra_services(*)');

        if (!exErr && insertedEx) {
          savedExtras = insertedEx;
        } else if (exErr) {
          console.warn('Could not insert reservation extras:', exErr);
        }
      }

      // Add user notification
      try {
        await supabase.from('notifications').insert({
          user_id: user.id,
          title: 'Reserva Registrada',
          message: `Tu reserva #${reservation.id} para la habitación ${room.room_number} fue creada exitosamente.`,
          type: 'info',
          is_read: false,
        });
      } catch (notifErr) {
        console.warn('Non-fatal notification insert error:', notifErr);
      }

      const normalized = {
        ...normalizeReservation(reservation),
        extras: savedExtras,
      };

      return { success: true, data: normalized };
    } catch (err) {
      console.error('createReservation failed:', err);
      if (err.message && (err.message.includes('iniciar sesión') || err.message.includes('Habitación'))) {
        throw err;
      }
      throw new Error(err.message || 'Error al procesar la reserva en la base de datos.');
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
      return { success: true, data: (data || []).map(normalizeReservation) };
    } catch (err) {
      console.warn('Supabase getMyReservations fallback to API:', err);
      const res = await api.get('/reservations/my');
      return {
        ...res,
        data: Array.isArray(res?.data) ? res.data.map(normalizeReservation) : res?.data,
      };
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
      return { success: true, data: (data || []).map(normalizeReservation) };
    } catch (err) {
      const res = await api.get('/reservations/', { params });
      return {
        ...res,
        data: Array.isArray(res?.data) ? res.data.map(normalizeReservation) : res?.data,
      };
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
      return { success: true, data: normalizeReservation(data) };
    } catch (err) {
      const res = await api.get(`/reservations/${id}`);
      return {
        ...res,
        data: normalizeReservation(res?.data),
      };
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
      return { success: true, data: normalizeReservation(res) };
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
      return { success: true, data: normalizeReservation(data) };
    } catch (err) {
      return api.patch(`/reservations/${id}/cancel`);
    }
  },

  checkIn: async (id) => {
    try {
      const { data: res, error } = await supabase
        .from('reservations')
        .update({ status: 'checked_in', checked_in_at: new Date().toISOString() })
        .eq('id', id)
        .select('*, room:rooms(*)')
        .single();
      if (error) throw error;
      if (res.room_id) {
        await supabase.from('rooms').update({ status: 'occupied' }).eq('id', res.room_id);
      }
      return { success: true, data: normalizeReservation(res) };
    } catch (err) {
      return api.patch(`/reservations/${id}/check-in`);
    }
  },

  checkOut: async (id) => {
    try {
      const { data: res, error } = await supabase
        .from('reservations')
        .update({ status: 'checked_out', checked_out_at: new Date().toISOString() })
        .eq('id', id)
        .select('*, room:rooms(*)')
        .single();
      if (error) throw error;
      if (res.room_id) {
        await supabase.from('rooms').update({ status: 'cleaning' }).eq('id', res.room_id);
      }
      return { success: true, data: normalizeReservation(res) };
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
      return { success: true, data: normalizeReservation(data) };
    } catch (err) {
      return api.patch(`/reservations/${id}/confirm`);
    }
  },
};
