import React, { useState, useEffect } from 'react';
import { reservationsApi } from '../../api/reservationsApi';
import { paymentsApi } from '../../api/paymentsApi';
import { 
  ClipboardList, 
  LogIn, 
  LogOut, 
  CreditCard, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  RefreshCw,
  Receipt
} from 'lucide-react';
import ReservationReceiptModal from '../../components/reservations/ReservationReceiptModal';

export default function CheckInOutPage() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [paymentModalData, setPaymentModalData] = useState(null);
  const [paymentModalPaymentId, setPaymentModalPaymentId] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Payment modal state
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentCurrency, setPaymentCurrency] = useState('COP');
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  const currencies = {
    COP: { symbol: '$', name: 'COP (Peso Colombiano)' }
  };

  const isLegacyUSD = (amount) => Number(amount) > 0 && Number(amount) < 2000;

  const fetchReservations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await reservationsApi.getAllReservations({ per_page: 50 });
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setReservations(list);
    } catch (err) {
      setError(err.message || 'Error al cargar reservas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  const handleCheckIn = async (id) => {
    setActionLoading(id);
    try {
      await reservationsApi.checkIn(id);
      await fetchReservations();
      alert('Registro de entrada realizado exitosamente');
    } catch (err) {
      alert(err.message || 'Error al registrar entrada');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCheckOut = async (id) => {
    setActionLoading(id);
    try {
      await reservationsApi.checkOut(id);
      await fetchReservations();
      alert('Check-out realizado exitosamente. La habitación ahora está disponible automáticamente y pasó a la Lista de Pagados.');
    } catch (err) {
      alert(err.message || 'Error al realizar Check-out');
    } finally {
      setActionLoading(null);
    }
  };

  const handleOpenPaymentModal = (res, paymentId) => {
    if (res.status === 'cancelled') {
      alert('No se puede registrar pago para una reserva cancelada');
      return;
    }
    setPaymentModalData(res);
    setPaymentModalPaymentId(paymentId || res.payments?.[0]?.id || null);
    setPaymentCurrency('COP');
    setPaymentMethod('cash');
    const roomCop = isLegacyUSD(res.final_total) ? res.final_total * 4000 : Number(res.final_total || 0);
    const extrasCop = Number(res.extras_total || 0);
    const grandCop = roomCop + extrasCop;
    setPaymentAmount(new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(grandCop));
    setPaymentRef(`EFECTIVO-REC-${Date.now().toString().slice(-4)}`);
  };

  const handleMethodChange = (newMethod) => {
    setPaymentMethod(newMethod);
    const prefixMap = {
      cash: 'EFECTIVO-REC',
      transfer: 'TRF-BANCO',
      credit_card: 'TC-POS',
      debit_card: 'TD-POS',
    };
    const prefix = prefixMap[newMethod] || 'TXN';
    setPaymentRef(`${prefix}-${Date.now().toString().slice(-4)}`);
  };

  const handleAmountChange = (e) => {
    const val = e.target.value;
    const numericVal = val.replace(/\D/g, '');
    if (!numericVal) {
      setPaymentAmount('');
      return;
    }
    setPaymentAmount(new Intl.NumberFormat('es-CO').format(parseInt(numericVal, 10)));
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setPaymentSubmitting(true);
    try {
      let parsedAmount = paymentAmount;
      if (typeof parsedAmount === 'string') {
        parsedAmount = parseFloat(parsedAmount.replace(/\./g, '').replace(/,/g, ''));
      }
      
      await paymentsApi.registerOrConfirmPayment({
        reservationId: paymentModalData.id,
        paymentId: paymentModalPaymentId,
        amount: parsedAmount,
        payment_method: paymentMethod,
        transaction_ref: paymentRef,
        notes: `Pago verificado en recepción vía ${paymentMethod}`,
        userId: paymentModalData.user_id,
      });

      setPaymentModalData(null);
      setPaymentModalPaymentId(null);
      await fetchReservations();
      alert('¡Pago registrado exitosamente! Se ha desbloqueado el Check-out para esta reserva.');
    } catch (err) {
      if (err.response?.status === 409) {
        alert('Este pago ya fue confirmado.');
        setPaymentModalData(null);
        setPaymentModalPaymentId(null);
        await fetchReservations();
      } else {
        alert(err.message || 'Error al registrar pago');
      }
    } finally {
      setPaymentSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-900/50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight flex items-center gap-2.5">
              <ClipboardList className="w-7 h-7 text-brand-600" />
              Recepción: Registro de Entrada, Check-out & Pagos
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Control de estancia de huéspedes en recepción.
            </p>
          </div>

          <button
            onClick={fetchReservations}
            className="self-start sm:self-auto flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-900/50 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Actualizar Lista
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700">
            <Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Cargando reservas en recepción...</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-4 px-6">Reserva / Huésped</th>
                    <th className="py-4 px-6">Habitación</th>
                    <th className="py-4 px-6">Fechas</th>
                    <th className="py-4 px-6">Total</th>
                    <th className="py-4 px-6">Estado</th>
                    <th className="py-4 px-6 text-right">Acciones de Recepción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {reservations.filter((res) => res.status !== 'checked_out' && res.status !== 'cancelled').length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500 dark:text-slate-400 font-medium">
                        No hay reservas activas pendientes en recepción.
                      </td>
                    </tr>
                  ) : (
                    reservations
                      .filter((res) => res.status !== 'checked_out' && res.status !== 'cancelled')
                      .map((res) => (
                        <tr key={res.id} className="hover:bg-slate-50 dark:bg-slate-900/50/70 transition-colors">
                          <td className="py-4 px-6">
                            <span className="font-extrabold text-slate-900 dark:text-slate-50 block">
                              Reserva #{res.id}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              Usuario #{res.user_id} • {res.num_guests} huésped(es)
                            </span>
                          </td>

                          <td className="py-4 px-6">
                            <span className="font-bold text-slate-800 dark:text-slate-100 bg-slate-100 px-2.5 py-1 rounded-lg text-xs">
                              Hab. #{res.room_id}
                            </span>
                          </td>

                          <td className="py-4 px-6 text-xs text-slate-600 dark:text-slate-300 font-medium">
                            <div>Entrada: <span className="font-bold text-slate-800 dark:text-slate-100">{res.check_in_date}</span></div>
                            {res.estimated_arrival_time && (
                              <div className="text-[11px] font-bold text-brand-600 dark:text-brand-400 mt-0.5">
                                ⏰ Llegada aprox: {res.estimated_arrival_time}
                              </div>
                            )}
                            <div>Check-out: <span className="font-bold text-slate-800 dark:text-slate-100">{res.check_out_date}</span></div>
                          </td>

                          <td className="py-4 px-6">
                            <span className="font-black text-slate-900 dark:text-slate-50">
                              ${(() => {
                                const roomCop = isLegacyUSD(res.final_total) ? res.final_total * 4000 : Number(res.final_total || 0);
                                const extrasCop = Number(res.extras_total || 0);
                                return (roomCop + extrasCop).toLocaleString('es-CO');
                              })()} COP
                            </span>
                            {Number(res.extras_total) > 0 && (
                              <span className="block text-[11px] text-brand-600 font-semibold">
                                +${Number(res.extras_total).toLocaleString('es-CO')} en servicios
                              </span>
                            )}
                            {res.is_paid ? (
                              <span className="block text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                                ✓ Pago Confirmado {res.payment_method ? `(${res.payment_method})` : ''}
                              </span>
                            ) : (
                              <span className="block text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">
                                ⏳ Pago Pendiente en Recepción
                              </span>
                            )}
                          </td>

                          <td className="py-4 px-6">
                            <span
                              className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                res.status === 'confirmed'
                                  ? 'bg-blue-50 text-blue-700'
                                  : res.status === 'checked_in'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-rose-50 text-rose-700'
                              }`}
                            >
                              {res.status === 'confirmed' ? 'CONFIRMADA' : res.status === 'checked_in' ? 'EN EL HOTEL' : res.status.toUpperCase()}
                            </span>
                          </td>

                          <td className="py-4 px-6 text-right space-x-2">
                            {/* Check-in Button */}
                            {res.status === 'confirmed' && (
                              <button
                                onClick={() => handleCheckIn(res.id)}
                                disabled={actionLoading === res.id}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50"
                              >
                                <LogIn className="w-3.5 h-3.5" />
                                Registrar Entrada
                              </button>
                            )}

                            {/* Payment Button - Visible whenever not paid to unlock Check-out */}
                            {!res.is_paid && res.status !== 'cancelled' && (
                              <button
                                onClick={() => handleOpenPaymentModal(res, res.payments?.[0]?.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
                                title="Registrar pago del huésped para desbloquear Check-out"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                Registrar Pago
                              </button>
                            )}

                            {/* Check-out Button */}
                            {res.status === 'checked_in' && (
                              <div className="inline-block" title={!res.is_paid ? "⚠️ Bloqueado: Primero registra el pago para habilitar el Check-out" : "Realizar salida y desocupar habitación"}>
                                <button
                                  onClick={() => handleCheckOut(res.id)}
                                  disabled={actionLoading === res.id || !res.is_paid}
                                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm transition-all ${
                                    !res.is_paid 
                                      ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-dashed border-slate-300 dark:border-slate-600' 
                                      : 'bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50'
                                  }`}
                                >
                                  <LogOut className="w-3.5 h-3.5" />
                                  Check-out {!res.is_paid && '🔒'}
                                </button>
                              </div>
                            )}

                            {/* Receipt Button */}
                            <button
                              onClick={() => setSelectedReceipt(res)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-xl text-xs font-bold transition-all"
                              title="Imprimir Comprobante"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              Recibo
                            </button>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {paymentModalData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-700/50">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-brand-600" />
                  Registrar Pago de Reserva
                </h3>
                <button
                  onClick={() => setPaymentModalData(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:text-slate-300 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400 mb-4 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                <div className="flex justify-between">
                  <span>Habitación #{paymentModalData.room_id}:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    ${(isLegacyUSD(paymentModalData.final_total) ? paymentModalData.final_total * 4000 : Number(paymentModalData.final_total || 0)).toLocaleString('es-CO')} COP
                  </span>
                </div>
                {Number(paymentModalData.extras_total) > 0 && (
                  <div className="flex justify-between text-brand-600 font-semibold">
                    <span>Servicios adicionales:</span>
                    <span>+${Number(paymentModalData.extras_total).toLocaleString('es-CO')} COP</span>
                  </div>
                )}
                <div className="border-t border-slate-200 dark:border-slate-700 pt-1 flex justify-between font-extrabold text-sm text-slate-900 dark:text-slate-50">
                  <span>Total a Cobrar:</span>
                  <span className="text-brand-700">
                    ${((isLegacyUSD(paymentModalData.final_total) ? paymentModalData.final_total * 4000 : Number(paymentModalData.final_total || 0)) + Number(paymentModalData.extras_total || 0)).toLocaleString('es-CO')} COP
                  </span>
                </div>
              </div>

              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1.5">
                    Moneda de Pago
                  </label>
                  <div className="w-full mb-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center justify-between">
                    <span>COP (Peso Colombiano)</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">Moneda Principal</span>
                  </div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1.5">
                    Monto a Pagar (COP)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 font-bold">
                      {currencies[paymentCurrency].symbol}
                    </span>
                    <input
                      type="text"
                      required
                      value={paymentAmount}
                      onChange={handleAmountChange}
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-8 pr-3 py-2 text-sm font-bold text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1.5">
                    Método de Pago
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => handleMethodChange(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  >
                    <option value="cash">💵 Efectivo (Pago en recepción)</option>
                    <option value="transfer">🏦 Transferencia Bancaria (Bancolombia / Nequi / Daviplata)</option>
                    <option value="credit_card">💳 Tarjeta de Crédito</option>
                    <option value="debit_card">💳 Tarjeta de Débito</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1.5">
                    Referencia de Transacción
                  </label>
                  <input
                    type="text"
                    required
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm font-medium text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="submit"
                    disabled={paymentSubmitting}
                    className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow disabled:opacity-50"
                  >
                    {paymentSubmitting ? 'Procesando...' : 'Confirmar Pago'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentModalData(null)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-semibold py-2.5 rounded-xl text-sm transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Printable Receipt Modal */}
        {selectedReceipt && (
          <ReservationReceiptModal
            reservation={selectedReceipt}
            onClose={() => setSelectedReceipt(null)}
          />
        )}
      </div>
    </div>
  );
}
