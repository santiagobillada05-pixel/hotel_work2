import { supabase } from '../lib/supabaseClient';
import api from './client';

export const checkoutsApi = {
  getCheckouts: async (params = {}) => {
    try {
      const { data, error } = await supabase
        .from('checkout_records')
        .select('*, reservation:reservations(*), room:rooms(*), staff:users(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (err) {
      return api.get('/checkouts/', { params });
    }
  },

  updateStatus: async (id, status) => {
    try {
      const { data, error } = await supabase
        .from('checkout_records')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      return api.patch(`/checkouts/${id}/status`, { status });
    }
  },

  deleteCheckout: async (id) => {
    try {
      const { error } = await supabase.from('checkout_records').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (err) {
      return api.delete(`/checkouts/${id}`);
    }
  },
};
