import { supabase } from '../lib/supabaseClient';
import api from './client';

export const extrasApi = {
  getAllExtras: async () => {
    try {
      const { data, error } = await supabase
        .from('extra_services')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (err) {
      return api.get('/extras/');
    }
  },

  addExtraToReservation: async (reservationId, data) => {
    try {
      const payload = {
        reservation_id: reservationId,
        extra_service_id: data.extra_service_id,
        quantity: data.quantity || 1,
        unit_price: data.unit_price,
        subtotal: (data.quantity || 1) * data.unit_price,
        notes: data.notes || '',
      };
      const { data: res, error } = await supabase
        .from('reservation_extras')
        .insert(payload)
        .select('*, extra_service:extra_services(*)')
        .single();
      if (error) throw error;
      return { success: true, data: res };
    } catch (err) {
      return api.post(`/extras/reservation/${reservationId}`, data);
    }
  },

  removeExtraFromReservation: async (reservationId, extraId) => {
    try {
      const { error } = await supabase.from('reservation_extras').delete().eq('id', extraId);
      if (error) throw error;
      return { success: true };
    } catch (err) {
      return api.delete(`/extras/reservation/${reservationId}/${extraId}`);
    }
  },

  getReservationExtras: async (reservationId) => {
    try {
      const { data, error } = await supabase
        .from('reservation_extras')
        .select('*, extra_service:extra_services(*)')
        .eq('reservation_id', reservationId);
      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (err) {
      return api.get(`/extras/reservation/${reservationId}`);
    }
  },
};
