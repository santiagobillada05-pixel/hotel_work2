import { supabase } from '../lib/supabaseClient';
import api from './client';

export const reportsApi = {
  getSummary: async () => {
    try {
      const [
        { data: rooms },
        { data: reservations },
        { data: users },
        { data: payments },
      ] = await Promise.all([
        supabase.from('rooms').select('*'),
        supabase.from('reservations').select('*'),
        supabase.from('users').select('*'),
        supabase.from('payments').select('*'),
      ]);

      const allRooms = rooms || [];
      const allRes = reservations || [];
      const allUsers = users || [];
      const allPayments = payments || [];

      const totalRooms = allRooms.length;
      const occupiedRooms = allRooms.filter((r) => r.status === 'occupied').length;
      const availableRooms = allRooms.filter((r) => r.status === 'available').length;
      const maintenanceRooms = allRooms.filter((r) => r.status === 'maintenance' || r.status === 'cleaning').length;

      const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

      const completedPayments = allPayments.filter((p) => p.status === 'completed');
      const totalRevenue = completedPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

      const activeRes = allRes.filter((r) => r.status === 'confirmed' || r.status === 'checked_in');
      const pendingBalance = allRes
        .filter((r) => r.status === 'pending' || r.status === 'confirmed' || r.status === 'checked_in')
        .reduce((sum, r) => sum + (Number(r.final_total || r.total_amount) || 0), 0);

      const guestUsers = allUsers.filter((u) => u.role === 'guest' || !u.role);

      return {
        success: true,
        data: {
          kpis: {
            total_rooms: totalRooms,
            occupied_rooms: occupiedRooms,
            available_rooms: availableRooms,
            occupancy_rate: occupancyRate,
            total_revenue: totalRevenue,
            pending_balance: Math.max(0, pendingBalance - totalRevenue),
            total_reservations: allRes.length,
            active_reservations: activeRes.length,
            total_registered_guests: guestUsers.length,
          },
          room_status_breakdown: [
            { name: 'Disponibles', value: availableRooms, color: '#10B981' },
            { name: 'Ocupadas', value: occupiedRooms, color: '#3B82F6' },
            { name: 'En Limpieza / Mantenimiento', value: maintenanceRooms, color: '#F59E0B' },
          ],
        },
      };
    } catch (err) {
      console.warn('getSummary fallback:', err);
      return api.get('/reports/summary');
    }
  },

  getRevenueReport: async () => {
    try {
      const { data: payments } = await supabase
        .from('payments')
        .select('*')
        .eq('status', 'completed');

      const byMethod = {};
      for (const p of payments || []) {
        const m = p.payment_method || 'transfer';
        if (!byMethod[m]) {
          byMethod[m] = { method: m, total_amount: 0, transaction_count: 0 };
        }
        byMethod[m].total_amount += Number(p.amount) || 0;
        byMethod[m].transaction_count += 1;
      }

      return {
        success: true,
        data: Object.values(byMethod),
      };
    } catch (err) {
      return api.get('/reports/revenue');
    }
  },

  getRecaudacion: async (period = 'week') => {
    try {
      const { data: payments, error } = await supabase
        .from('payments')
        .select('*, reservation:reservations(*, room:rooms(*), user:users(*))')
        .eq('status', 'completed')
        .order('paid_at', { ascending: false });

      if (error) throw error;

      const now = new Date();
      // Week
      const dayOfWeek = (now.getDay() + 6) % 7;
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - dayOfWeek);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      // Month
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

      // Year
      const yearStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
      const yearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);

      const all = payments || [];

      const calcTotal = (start, end) => {
        const inRange = all.filter((p) => {
          const t = new Date(p.paid_at || p.created_at);
          return t >= start && t <= end;
        });
        const amount = inRange.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        return {
          amount,
          count: inRange.length,
          start: start.toISOString(),
          end: end.toISOString(),
        };
      };

      const weekTotals = calcTotal(weekStart, weekEnd);
      const monthTotals = calcTotal(monthStart, monthEnd);
      const yearTotals = calcTotal(yearStart, yearEnd);

      // Target filter range
      let rangeStart = weekStart;
      let rangeEnd = weekEnd;
      if (period === 'month') {
        rangeStart = monthStart;
        rangeEnd = monthEnd;
      } else if (period === 'year') {
        rangeStart = yearStart;
        rangeEnd = yearEnd;
      }

      const filteredPayments = all
        .filter((p) => {
          const t = new Date(p.paid_at || p.created_at);
          return t >= rangeStart && t <= rangeEnd;
        })
        .map((p) => {
          const user = p.reservation?.user;
          const room = p.reservation?.room;
          const guestName = user
            ? `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email
            : 'Huésped';
          const roomNumber = room?.room_number ? `Hab. ${room.room_number}` : `Habitación #${p.reservation?.room_id || 'N/A'}`;
          return {
            id: p.id,
            paid_at: p.paid_at || p.created_at || new Date().toISOString(),
            guest_name: guestName,
            room_number: roomNumber,
            payment_method: p.payment_method || 'transfer',
            concept: p.payment_type === 'full_payment' ? 'Alojamiento & Servicios' : (p.notes || 'Estadía'),
            amount: Number(p.amount) || 0,
          };
        });

      return {
        success: true,
        data: {
          totals: {
            week: weekTotals,
            month: monthTotals,
            year: yearTotals,
          },
          payments: filteredPayments,
        },
      };
    } catch (err) {
      console.warn('getRecaudacion fallback:', err);
      const now = new Date();
      return {
        success: true,
        data: {
          totals: {
            week: { amount: 0, count: 0, start: now.toISOString(), end: now.toISOString() },
            month: { amount: 0, count: 0, start: now.toISOString(), end: now.toISOString() },
            year: { amount: 0, count: 0, start: now.toISOString(), end: now.toISOString() },
          },
          payments: [],
        },
      };
    }
  },
};
