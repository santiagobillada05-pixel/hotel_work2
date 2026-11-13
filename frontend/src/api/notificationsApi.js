import { supabase } from '../lib/supabaseClient';
import api from './client';

// Generador de notificaciones inteligentes basadas en las reservas del huésped
const generateSmartReservationNotifications = async (userId) => {
  if (!userId) return;
  try {
    const { data: reservations, error } = await supabase
      .from('reservations')
      .select('id, user_id, check_in_date, check_out_date, status, room:rooms(room_number, room_type)')
      .eq('user_id', userId)
      .in('status', ['pending', 'confirmed']);

    if (error || !reservations || reservations.length === 0) return;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const currentHour = now.getHours();

    // Obtener notificaciones existentes para evitar duplicar las de hoy
    const { data: existingNotifs } = await supabase
      .from('notifications')
      .select('title, created_at')
      .eq('user_id', userId);

    const existingTitles = new Set((existingNotifs || []).map((n) => n.title));

    for (const r of reservations) {
      if (!r.check_in_date) continue;
      const [cY, cM, cD] = r.check_in_date.split('-').map(Number);
      const checkIn = new Date(cY, cM - 1, cD);
      const daysUntilArrival = Math.round((checkIn - today) / (1000 * 60 * 60 * 24));

      // Plazo límite: 1 día antes del check-in
      const deadlineDate = new Date(checkIn);
      deadlineDate.setDate(deadlineDate.getDate() - 1);
      const daysToConfirm = Math.round((deadlineDate - today) / (1000 * 60 * 60 * 24));

      const roomLabel = r.room?.room_number ? `Habitación ${r.room.room_number}` : 'tu habitación';

      // 1. Huésped con reserva PENDIENTE
      if (r.status === 'pending') {
        if (daysToConfirm === 0) {
          // Hoy es el último día para confirmar (la entrada es mañana)
          if (currentHour >= 20) {
            // Menos de 4 horas para la medianoche
            const title = `Plazo de confirmación por vencer: Reserva #${r.id}`;
            if (!existingTitles.has(title)) {
              await supabase.from('notifications').insert({
                user_id: userId,
                title,
                message: `Su llegada a ${roomLabel} está programada para mañana (${r.check_in_date}). Le recordamos confirmar su asistencia antes de la medianoche para mantener activa su reserva.`,
                type: 'cancellation',
                is_read: false,
              });
              existingTitles.add(title);
            }
          } else {
            const title = `Último día para confirmar su reserva #${r.id}`;
            if (!existingTitles.has(title)) {
              await supabase.from('notifications').insert({
                user_id: userId,
                title,
                message: `Su llegada a ${roomLabel} está programada para mañana (${r.check_in_date}). Por favor confirme su asistencia antes de finalizar el día para garantizar su habitación.`,
                type: 'warning',
                is_read: false,
              });
              existingTitles.add(title);
            }
          }
        } else if (daysToConfirm === 1) {
          const title = `Recordatorio de confirmación: Reserva #${r.id}`;
          if (!existingTitles.has(title)) {
            await supabase.from('notifications').insert({
              user_id: userId,
              title,
              message: `Le recordamos confirmar su reserva para ${roomLabel}. Su llegada es el ${r.check_in_date} y su plazo de confirmación vence mañana.`,
              type: 'info',
              is_read: false,
            });
            existingTitles.add(title);
          }
        }
      }

      // 2. Huésped con reserva CONFIRMADA
      if (r.status === 'confirmed') {
        if (daysUntilArrival === 1) {
          const title = `Su estadía comienza mañana: Reserva #${r.id}`;
          if (!existingTitles.has(title)) {
            await supabase.from('notifications').insert({
              user_id: userId,
              title,
              message: `Todo se encuentra listo para su llegada el día de mañana (${r.check_in_date}) a ${roomLabel}. El check-in inicia a las 15:00. El pago se procesa directamente en recepción.`,
              type: 'confirmation',
              is_read: false,
            });
            existingTitles.add(title);
          }
        } else if (daysUntilArrival === 0) {
          const title = `Bienvenido a HotelWork: Reserva #${r.id}`;
          if (!existingTitles.has(title)) {
            await supabase.from('notifications').insert({
              user_id: userId,
              title,
              message: `Nos complace recibirle el día de hoy. Nuestro equipo de recepción le espera para hacerle entrega de ${roomLabel}.`,
              type: 'confirmation',
              is_read: false,
            });
            existingTitles.add(title);
          }
        }
      }
    }
  } catch (err) {
    console.warn('Smart reservation notifications generator error:', err);
  }
};

export const notificationsApi = {
  getMyNotifications: async () => {
    try {
      const stored = localStorage.getItem('user');
      const user = stored ? JSON.parse(stored) : null;
      if (user && user.id) {
        await generateSmartReservationNotifications(user.id);
      }

      let query = supabase.from('notifications').select('*').order('created_at', { ascending: false });
      if (user && user.id) {
        query = query.or(`user_id.eq.${user.id},user_id.is.null`);
      }
      const { data, error } = await query;
      if (error) throw error;
      const list = data || [];
      const unread = list.filter((n) => !n.is_read).length;
      return { 
        success: true, 
        data: {
          notifications: list,
          unread_count: unread,
        }
      };
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
