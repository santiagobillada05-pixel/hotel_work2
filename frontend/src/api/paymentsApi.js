import { supabase } from '../lib/supabaseClient';
import api from './client';

export const paymentsApi = {
  confirmPayment: async (paymentId, data = {}) => {
    try {
      const payload = {
        status: 'completed',
        payment_method: data.payment_method || 'transfer',
        notes: data.notes || '',
        paid_at: new Date().toISOString(),
      };
      const { data: res, error } = await supabase
        .from('payments')
        .update(payload)
        .eq('id', paymentId)
        .select()
        .single();
      if (error) throw error;
      return { success: true, data: res };
    } catch (err) {
      return api.patch(`/payments/${paymentId}/confirm`, data);
    }
  },

  getPaymentsForReservation: async (reservationId) => {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('reservation_id', reservationId);
      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (err) {
      return api.get(`/payments/reservation/${reservationId}`);
    }
  },
};
