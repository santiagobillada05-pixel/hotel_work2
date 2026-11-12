import { supabase } from '../lib/supabaseClient';
import api from './client';

export const reportsApi = {
  getSummary: async () => {
    try {
      const [{ count: totalRooms }, { count: availableRooms }, { count: totalReservations }, { data: payments }] = await Promise.all([
        supabase.from('rooms').select('*', { count: 'exact', head: true }),
        supabase.from('rooms').select('*', { count: 'exact', head: true }).eq('status', 'available'),
        supabase.from('reservations').select('*', { count: 'exact', head: true }),
        supabase.from('payments').select('amount').eq('status', 'completed'),
      ]);

      const totalRevenue = (payments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

      return {
        success: true,
        data: {
          total_rooms: totalRooms || 0,
          available_rooms: availableRooms || 0,
          occupied_rooms: (totalRooms || 0) - (availableRooms || 0),
          total_reservations: totalReservations || 0,
          total_revenue: totalRevenue,
        },
      };
    } catch (err) {
      return api.get('/reports/summary');
    }
  },

  getRevenueReport: async () => {
    try {
      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .eq('status', 'completed')
        .order('paid_at', { ascending: false });

      return {
        success: true,
        data: payments || [],
      };
    } catch (err) {
      return api.get('/reports/revenue');
    }
  },

  getRecaudacion: async (period = 'month') => {
    try {
      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .eq('status', 'completed');

      const total = (payments || []).reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
      return {
        success: true,
        data: {
          period,
          total_amount: total,
          currency: 'COP',
        },
      };
    } catch (err) {
      return api.get(`/reports/recaudacion?period=${period}`);
    }
  },
};
