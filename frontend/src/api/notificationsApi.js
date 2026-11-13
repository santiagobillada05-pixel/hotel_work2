import { supabase } from '../lib/supabaseClient';
import api from './client';
import { getReservationDeadline } from './reservationsApi';

// Generador de notificaciones inteligentes basadas en las reservas del huésped
const generateSmartReservationNotifications = async (userId) => {
  if (!userId) return;
  try {
    const { data: reservations, error } = await supabase
      .from('reservations')
      .select('id, user_id, check_in_date, check_out_date, status, special_requests, room:rooms(room_number, room_type)')
      .eq('user_id', userId)
      .in('status', ['pending', 'confirmed']);

    if (error || !reservations || reservations.length === 0) return;

    const now = new Date();

    // Obtener notificaciones existentes para evitar duplicar las de hoy
    const { data: existingNotifs } = await supabase
      .from('notifications')
      .select('title, created_at')
      .eq('user_id', userId);

    const existingTitles = new Set((existingNotifs || []).map((n) => n.title));

    for (const r of reservations) {
      if (!r.check_in_date) continue;

      const arrivalMatch = r.special_requests?.match(/\[Llegada estimada:\s*([^\]]+)\]/i);
      const estimatedArrivalTime = arrivalMatch ? arrivalMatch[1].trim() : null;

      const deadlineInfo = getReservationDeadline(r.check_in_date, estimatedArrivalTime);
      if (!deadlineInfo) continue;

      const { checkInDateTime, deadlineDateTime, timeLabel } = deadlineInfo;
      const diffMs = deadlineDateTime.getTime() - now.getTime();
      const totalHoursRemaining = Math.floor(diffMs / (1000 * 60 * 60));

      const deadlineFormatted = deadlineDateTime.toLocaleDateString('es-CO', {
        day: 'numeric',
        month: 'long',
      });

      const checkInFormatted = checkInDateTime.toLocaleDateString('es-CO', {
        day: 'numeric',
        month: 'long',
      });

      const roomLabel = r.room?.room_number ? `Habitación ${r.room.room_number}` : 'su habitación';

      // 1. Huésped con reserva PENDIENTE
      if (r.status === 'pending') {
        if (diffMs > 0 && totalHoursRemaining < 4) {
          // Menos de 4 horas exactas para el vencimiento del plazo límite
          const title = `Plazo urgente: Menos de 4 horas para confirmar su reserva #${r.id}`;
          if (!existingTitles.has(title)) {
            await supabase.from('notifications').insert({
              user_id: userId,
              title,
              message: `Su llegada a ${roomLabel} está programada para las ${timeLabel} del ${checkInFormatted}. Le recordamos que dispone de menos de 4 horas (plazo límite: hoy a las ${timeLabel}) para confirmar su asistencia antes de que se cancele automáticamente.`,
              type: 'cancellation',
              is_read: false,
            });
            existingTitles.add(title);
          }
        } else if (diffMs > 0 && totalHoursRemaining < 24) {
          // Menos de 24 horas (mismo día de deadline, e.g. 5, 6, 12 horas restantes)
          const title = `Plazo de confirmación: ${totalHoursRemaining} horas restantes (Reserva #${r.id})`;
          if (!existingTitles.has(title)) {
            await supabase.from('notifications').insert({
              user_id: userId,
              title,
              message: `Dispone de ${totalHoursRemaining} horas para confirmar su asistencia para ${roomLabel}. Su plazo límite vence a las ${timeLabel} del ${deadlineFormatted} (24 horas antes de su llegada).`,
              type: 'warning',
              is_read: false,
            });
            existingTitles.add(title);
          }
        } else if (diffMs > 0 && totalHoursRemaining >= 24 && totalHoursRemaining <= 48) {
          const title = `Recordatorio de confirmación: Reserva #${r.id}`;
          if (!existingTitles.has(title)) {
            await supabase.from('notifications').insert({
              user_id: userId,
              title,
              message: `Le recordamos confirmar su asistencia para ${roomLabel}. Su plazo límite vence a las ${timeLabel} del ${deadlineFormatted}.`,
              type: 'info',
              is_read: false,
            });
            existingTitles.add(title);
          }
        }
      }

      // 2. Huésped con reserva CONFIRMADA
      if (r.status === 'confirmed') {
        const diffCheckInMs = checkInDateTime.getTime() - now.getTime();
        const hoursToCheckIn = Math.floor(diffCheckInMs / (1000 * 60 * 60));

        if (hoursToCheckIn > 0 && hoursToCheckIn <= 24) {
          const title = `Su estadía comienza mañana: Reserva #${r.id}`;
          if (!existingTitles.has(title)) {
            await supabase.from('notifications').insert({
              user_id: userId,
              title,
              message: `Todo se encuentra listo para su llegada a ${roomLabel} el ${checkInFormatted} a las ${timeLabel}. El pago se procesa directamente en recepción.`,
              type: 'confirmation',
              is_read: false,
            });
            existingTitles.add(title);
          }
        } else if (hoursToCheckIn <= 0 && diffCheckInMs > -24 * 60 * 60 * 1000) {
          const title = `Bienvenido a HotelWork: Reserva #${r.id}`;
          if (!existingTitles.has(title)) {
            await supabase.from('notifications').insert({
              user_id: userId,
              title,
              message: `Nos complace recibirle el día de hoy. Nuestro equipo de recepción le espera a las ${timeLabel} para hacerle entrega de ${roomLabel}.`,
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
