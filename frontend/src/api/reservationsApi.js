import { supabase } from '../lib/supabaseClient';
import api from './client';

export const parseArrivalTimeToHourMinute = (timeStr) => {
  if (!timeStr) return { hours: 15, minutes: 0, label: '15:00' };
  const str = String(timeStr).trim();

  // Caso formato 12 horas: "3:00 PM", "12:00 PM", "10:30 AM", "3:00 PM (Check-in estándar)"
  const match12 = str.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (match12) {
    let h = parseInt(match12[1], 10);
    const m = parseInt(match12[2], 10);
    const meridian = match12[3].toUpperCase();
    if (meridian === 'PM' && h < 12) h += 12;
    if (meridian === 'AM' && h === 12) h = 0;
    return { 
      hours: h, 
      minutes: m, 
      label: `${match12[1]}:${match12[2]} ${meridian}` 
    };
  }

  // Caso formato 24 horas: "15:00", "14:30"
  const match24 = str.match(/(\d{1,2}):(\d{2})/);
  if (match24) {
    const h = parseInt(match24[1], 10);
    const m = parseInt(match24[2], 10);
    const meridian = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return { 
      hours: h, 
      minutes: m, 
      label: `${h12}:${m < 10 ? '0' : ''}${m} ${meridian}` 
    };
  }

  if (str.toLowerCase().includes('madrugada')) {
    return { hours: 3, minutes: 0, label: '3:00 AM' };
  }

  return { hours: 15, minutes: 0, label: '3:00 PM' };
};

export const getLocalDateString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getFutureLocalDateString = (daysAhead = 1) => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return getLocalDateString(d);
};

export const getReservationDeadline = (checkInDateStr, arrivalTimeStr, createdAtStr = null) => {
  if (!checkInDateStr) return null;
  const parts = checkInDateStr.split('-');
  const cY = parseInt(parts[0], 10);
  const cM = parseInt(parts[1], 10);
  const cD = parseInt(parts[2], 10);
  const timeInfo = parseArrivalTimeToHourMinute(arrivalTimeStr);

  // Fecha y hora exacta de check-in / llegada
  const checkInDateTime = new Date(cY, cM - 1, cD, timeInfo.hours, timeInfo.minutes, 0, 0);

  const createdAt = createdAtStr ? new Date(createdAtStr) : new Date();

  // Plazo ideal estándar: exactamente 24 horas antes de la hora de llegada
  let deadlineDateTime = new Date(checkInDateTime.getTime() - 24 * 60 * 60 * 1000);

  // Si la reserva se efectuó con menos de 24 horas de antelación al check-in:
  if (deadlineDateTime.getTime() <= createdAt.getTime()) {
    // Si faltan más de 4 horas para el check-in, el límite es 4 horas antes del check-in
    const fourHoursBefore = new Date(checkInDateTime.getTime() - 4 * 60 * 60 * 1000);
    if (fourHoursBefore.getTime() > createdAt.getTime()) {
      deadlineDateTime = fourHoursBefore;
    } else {
      // Reserva de última hora (inminente): el límite es la misma hora de check-in
      deadlineDateTime = checkInDateTime;
    }
  }

  return {
    checkInDateTime,
    deadlineDateTime,
    timeLabel: timeInfo.label,
  };
};

export const autoCancelExpiredReservations = async (reservations = []) => {
  if (!reservations || reservations.length === 0) return reservations;
  
  const now = new Date();
  const expiredIds = [];

  for (const r of reservations) {
    if (r.status === 'pending' && r.check_in_date) {
      // Proteger reservas recién creadas: si tiene menos de 15 minutos de creada nunca cancelar
      const createdAt = r.created_at ? new Date(r.created_at) : null;
      if (createdAt && (now.getTime() - createdAt.getTime()) < 15 * 60 * 1000) {
        continue;
      }

      const deadlineInfo = getReservationDeadline(r.check_in_date, r.estimated_arrival_time, r.created_at);
      if (deadlineInfo && now.getTime() >= deadlineInfo.deadlineDateTime.getTime()) {
        expiredIds.push(r.id);
      }
    }
  }

  if (expiredIds.length > 0) {
    try {
      await supabase
        .from('reservations')
        .update({ status: 'cancelled' })
        .in('id', expiredIds);

      // Notificaciones de cancelación protocolaria
      for (const id of expiredIds) {
        const res = reservations.find((item) => item.id === id);
        if (res && res.user_id) {
          const timeInfo = parseArrivalTimeToHourMinute(res.estimated_arrival_time);
          await supabase.from('notifications').insert({
            user_id: res.user_id,
            title: `Reserva #${res.id} Cancelada por falta de confirmación`,
            message: `Su reserva #${res.id} para el ${res.check_in_date} fue cancelada automáticamente debido a que el plazo límite de confirmación (24 horas antes de su hora de llegada: ${timeInfo.label}) expiró sin confirmación de asistencia.`,
            type: 'cancellation',
            is_read: false,
          });
        }
      }
    } catch (cancelErr) {
      console.warn('Auto-cancel non-fatal error:', cancelErr);
    }

    return reservations.map((r) => {
      if (expiredIds.includes(r.id)) {
        return { ...r, status: 'cancelled' };
      }
      return r;
    });
  }

  return reservations;
};

export const normalizeReservation = (r) => {
  if (!r) return r;
  const finalTotal = Number(r.final_total !== undefined ? r.final_total : r.total_amount || 0);
  const baseTotal = Number(r.base_total !== undefined ? r.base_total : r.room_subtotal || 0);
  const taxAmount = Number(r.tax_amount || 0);

  const paymentsList = Array.isArray(r.payments) ? r.payments : [];
  const completedPayment = paymentsList.find((p) => p.status === 'completed');
  const isPaid = Boolean(completedPayment) || Boolean(r.is_paid);
  const paymentMethod = completedPayment?.payment_method || null;

  // Extraer hora estimada de llegada de special_requests
  const arrivalMatch = r.special_requests?.match(/\[Llegada estimada:\s*([^\]]+)\]/i);
  const estimatedArrivalTime = arrivalMatch ? arrivalMatch[1].trim() : null;
  const cleanRequests = r.special_requests 
    ? r.special_requests.replace(/\[Llegada estimada:[^\]]+\]\s*/gi, '').trim()
    : '';

  return {
    ...r,
    final_total: finalTotal,
    total_amount: finalTotal,
    base_total: baseTotal,
    room_subtotal: baseTotal,
    tax_amount: taxAmount,
    is_paid: isPaid,
    completed_payment: completedPayment,
    payment_method: paymentMethod,
    estimated_arrival_time: estimatedArrivalTime,
    clean_special_requests: cleanRequests,
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

      if (user.role === 'admin' || user.role === 'staff') {
        throw new Error('Las cuentas de Administrador y Personal de Recepción no pueden reservar habitaciones. Inicie sesión como huésped para realizar una reserva.');
      }

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

      let specialRequestsContent = data.special_requests || null;
      if (data.estimated_arrival_time) {
        specialRequestsContent = `[Llegada estimada: ${data.estimated_arrival_time}] ${specialRequestsContent || ''}`.trim();
      }

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
        special_requests: specialRequestsContent,
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
        .select('*, room:rooms(*), user:users(*), extras:reservation_extras(*, extra_service:extra_services(*)), payments:payments(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      const normalized = (data || []).map(normalizeReservation);
      const checked = await autoCancelExpiredReservations(normalized);
      return { success: true, data: checked };
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
        .select('*, room:rooms(*), user:users(*), extras:reservation_extras(*, extra_service:extra_services(*)), payments:payments(*)')
        .order('created_at', { ascending: false });

      if (params.status) query = query.eq('status', params.status);
      if (params.room_id) query = query.eq('room_id', params.room_id);

      const { data, error } = await query;
      if (error) throw error;
      const normalized = (data || []).map(normalizeReservation);
      const checked = await autoCancelExpiredReservations(normalized);
      return { success: true, data: checked };
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
        .select('*, room:rooms(*), user:users(*), extras:reservation_extras(*, extra_service:extra_services(*)), payments:payments(*)')
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
      const stored = localStorage.getItem('user');
      const staffUser = stored ? JSON.parse(stored) : null;

      const { data: res, error } = await supabase
        .from('reservations')
        .update({ status: 'checked_out', checked_out_at: new Date().toISOString() })
        .eq('id', id)
        .select('*, room:rooms(*), user:users(*)')
        .single();
      if (error) throw error;
      if (res.room_id) {
        await supabase.from('rooms').update({ status: 'available' }).eq('id', res.room_id);
      }

      // Registrar en checkout_records para que figure en la Lista de Pagados / Arqueo
      try {
        await supabase.from('checkout_records').insert({
          reservation_id: res.id,
          staff_id: staffUser?.id || null,
          room_id: res.room_id,
          total_charged: res.final_total || 0,
          damage_charges: 0,
          room_condition_notes: 'Check-out completado en recepción con pago verificado.',
        });
      } catch (cErr) {
        console.warn('Checkout record creation warning:', cErr);
      }

      // Notificar al huésped
      try {
        if (res.user_id) {
          await supabase.from('notifications').insert({
            user_id: res.user_id,
            title: 'Check-out Realizado',
            message: `Has completado tu salida de la Habitación ${res.room?.room_number || ''}. ¡Muchas gracias por alojarte con nosotros en HotelWork!`,
            type: 'info',
            is_read: false,
          });
        }
      } catch (nErr) {
        console.warn('Notification insert error:', nErr);
      }

      return { success: true, data: normalizeReservation(res) };
    } catch (err) {
      return api.patch(`/reservations/${id}/check-out`);
    }
  },

  updateArrivalTime: async (id, timeStr) => {
    try {
      const { data: existing, error: eErr } = await supabase
        .from('reservations')
        .select('special_requests')
        .eq('id', id)
        .single();
      if (eErr) throw eErr;

      // Validación: la hora de llegada es de registro único por reservación
      const existingMatch = existing?.special_requests?.match(/\[Llegada estimada:\s*([^\]]+)\]/i);
      if (existingMatch && existingMatch[1] && existingMatch[1].trim()) {
        throw new Error('La hora estimada de llegada ya fue registrada para esta reserva y es de carácter definitivo.');
      }

      const baseRequests = (existing?.special_requests || '')
        .replace(/\[Llegada estimada:[^\]]+\]\s*/gi, '')
        .trim();

      const newSpecialRequests = `[Llegada estimada: ${timeStr}] ${baseRequests}`.trim();

      const { data: updated, error: uErr } = await supabase
        .from('reservations')
        .update({ special_requests: newSpecialRequests })
        .eq('id', id)
        .select('*, room:rooms(*), user:users(*), payments:payments(*)')
        .single();
      if (uErr) throw uErr;

      return { success: true, data: normalizeReservation(updated) };
    } catch (err) {
      console.warn('updateArrivalTime error:', err);
      throw err;
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
