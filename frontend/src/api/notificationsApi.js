import { supabase } from '../lib/supabaseClient';
import api from './client';

export const notificationsApi = {
  getMyNotifications: async () => {
    try {
      const stored = localStorage.getItem('user');
      const user = stored ? JSON.parse(stored) : null;
      let query = supabase.from('notifications').select('*').order('created_at', { ascending: false });
      if (user && user.id) {
        query = query.or(`user_id.eq.${user.id},user_id.is.null`);
      }
      const { data, error } = await query;
      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (err) {
      return api.get('/notifications/');
    }
  },

  markAsRead: async (id) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      return api.patch(`/notifications/${id}/read`);
    }
  },

  markAllAsRead: async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .neq('id', 0)
        .select();
      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (err) {
      return api.patch('/notifications/read-all');
    }
  },
};
