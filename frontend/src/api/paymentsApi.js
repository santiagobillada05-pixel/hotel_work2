import { supabase } from '../lib/supabaseClient';
import api from './client';

export const paymentsApi = {
  // Registrar pago en recepción (efectivo, transferencia, tarjeta de crédito o débito)
  registerOrConfirmPayment: async ({
    reservationId,
    paymentId,
    amount,
    payment_method = 'cash',
    transaction_ref,
    notes = '',
    userId = null,
  }) => {
    try {
      const payload = {
        reservation_id: reservationId,
        amount: Number(amount) || 0,
        payment_method: payment_method,
        payment_type: 'full_payment',
        status: 'completed',
        transaction_reference: transaction_ref || `RC-${Date.now().toString().slice(-6)}`,
        notes: notes || `Pago registrado en recepción vía ${payment_method}`,
        paid_at: new Date().toISOString(),
      };

      let paymentResult = null;

      if (paymentId) {
        const { data, error } = await supabase
          .from('payments')
          .update(payload)
          .eq('id', paymentId)
          .select()
          .single();
        if (!error && data) {
          paymentResult = data;
        }
      }

      if (!paymentResult) {
        // Verificar si ya existía algún pago para esta reserva
        const { data: existing } = await supabase
          .from('payments')
          .select('id')
          .eq('reservation_id', reservationId)
          .limit(1);

        if (existing && existing.length > 0) {
          const { data, error } = await supabase
            .from('payments')
            .update(payload)
            .eq('id', existing[0].id)
            .select()
            .single();
          if (error) throw error;
          paymentResult = data;
        } else {
          const { data, error } = await supabase
            .from('payments')
            .insert(payload)
            .select()
            .single();
          if (error) throw error;
          paymentResult = data;
        }
      }

      // Notificar al huésped
      try {
        let targetUserId = userId;
        if (!targetUserId && reservationId) {
          const { data: resData } = await supabase
            .from('reservations')
            .select('user_id')
            .eq('id', reservationId)
            .single();
          targetUserId = resData?.user_id;
        }

        if (targetUserId) {
          const methodLabels = {
            cash: 'Efectivo',
            transfer: 'Transferencia bancaria',
            credit_card: 'Tarjeta de crédito',
            debit_card: 'Tarjeta de débito',
          };
          const methodText = methodLabels[payment_method] || payment_method;

          await supabase.from('notifications').insert({
            user_id: targetUserId,
            title: 'Pago Confirmado en Recepción',
            message: `Tu pago de $${Number(amount).toLocaleString('es-CO')} COP por la reserva #${reservationId} fue registrado exitosamente mediante ${methodText}. ¡Tu Check-out está habilitado!`,
            type: 'payment',
            is_read: false,
          });
        }
      } catch (notifErr) {
        console.warn('Non-fatal notification insert error:', notifErr);
      }

      return { success: true, data: paymentResult };
    } catch (err) {
      console.warn('registerOrConfirmPayment fallback to API:', err);
      if (paymentId) {
        return api.patch(`/payments/${paymentId}/confirm`, {
          amount,
          payment_method,
          transaction_ref,
          notes,
        });
      }
      throw err;
    }
  },

  confirmPayment: async (paymentId, data = {}) => {
    try {
      const payload = {
        status: 'completed',
        payment_method: data.payment_method || 'transfer',
        transaction_reference: data.transaction_ref || null,
        notes: data.notes || '',
        paid_at: new Date().toISOString(),
      };
      if (data.amount) {
        payload.amount = Number(data.amount);
      }

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
