import React, { useState, useEffect } from 'react';
import { reservationsApi, getReservationDeadline } from '../api/reservationsApi';
import { extrasApi } from '../api/extrasApi';
import { 
  CalendarCheck, 
  Calendar, 
  Clock, 
  AlertCircle, 
  Loader2, 
  CheckCircle2, 
  XCircle,
  Receipt,
  BedDouble,
  FileText,
  ShoppingBag,
  Plus,
  AlertTriangle
} from 'lucide-react';
import ReservationReceiptModal from '../components/reservations/ReservationReceiptModal';
import ExtrasSelector from '../components/reservations/ExtrasSelector';

export default function MyReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [extrasModalReservation, setExtrasModalReservation] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null);
  const [editingArrivalReservation, setEditingArrivalReservation] = useState(null);
  const [arrivalTimeInput, setArrivalTimeInput] = useState('3:00 PM (Check-in estándar)');
  const [updatingArrival, setUpdatingArrival] = useState(false);

  const fetchMyReservations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await reservationsApi.getMyReservations();
      const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      setReservations(list);
    } catch (err) {
      setError(err.message || 'Error al obtener tu historial de reservas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyReservations();
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas cancelar esta reserva?')) return;
    setActionLoading(id);
    try {
      await reservationsApi.cancelReservation(id);
      await fetchMyReservations();
    } catch (err) {
      alert(err.message || 'Error al cancelar la reserva');
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirm = async (id) => {
    if (!window.confirm('¿Confirmar esta reserva? Recuerda que el pago se realiza únicamente en el hotel al momento de tu llegada (transferencia bancaria, tarjeta o efectivo).')) return;
    setConfirmingId(id);
    try {
      await reservationsApi.confirmReservation(id);
      await fetchMyReservations();
    } catch (err) {
      alert(err.message || 'Error al confirmar la reserva');
    } finally {
      setConfirmingId(null);
    }
  };

  const handleOpenArrivalModal = (res) => {
    setEditingArrivalReservation(res);
    setArrivalTimeInput(res.estimated_arrival_time || '3:00 PM (Check-in estándar)');
  };

  const handleSaveArrivalTime = async (e) => {
    e.preventDefault();
    if (!editingArrivalReservation) return;
    const confirmChoice = window.confirm(
      `¿Desea registrar ${arrivalTimeInput} como su hora definitiva de llegada?\n\nRecuerde: Este registro es único y no podrá ser modificado. Su plazo límite de confirmación vencerá exactamente 24 horas antes de dicha hora.`
    );
    if (!confirmChoice) return;

    setUpdatingArrival(true);
    try {
      await reservationsApi.updateArrivalTime(editingArrivalReservation.id, arrivalTimeInput);
      setEditingArrivalReservation(null);
      await fetchMyReservations();
      alert('Hora de llegada registrada exitosamente de forma definitiva.');
    } catch (err) {
      alert(err.message || 'Error al registrar hora de llegada');
    } finally {
      setUpdatingArrival(false);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      pending: { label: 'Pendiente', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
      confirmed: { label: 'Confirmada', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
      checked_in: { label: 'En el Hotel', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      checked_out: { label: 'Completada', bg: 'bg-slate-100 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700' },
      cancelled: { label: 'Cancelada', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
    };
    const s = map[status] || { label: status, bg: 'bg-slate-100 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700' };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${s.bg}`}>
        {s.label}
      </span>
    );
  };

  const getConfirmationInfo = (checkInDateStr, arrivalTimeStr) => {
    if (!checkInDateStr) return null;
    const now = new Date();
    const deadlineInfo = getReservationDeadline(checkInDateStr, arrivalTimeStr);
    if (!deadlineInfo) return null;

    const { checkInDateTime, deadlineDateTime, timeLabel } = deadlineInfo;
    const diffMs = deadlineDateTime.getTime() - now.getTime();
    const isExpired = diffMs <= 0;

    const totalHoursRemaining = Math.floor(diffMs / (1000 * 60 * 60));
    const totalMinutesRemaining = Math.floor(diffMs / (1000 * 60));
    const remainingMinutes = Math.max(0, totalMinutesRemaining % 60);
    const diffDays = Math.floor(totalHoursRemaining / 24);
    const remainingHours = Math.max(0, totalHoursRemaining % 24);

    const checkInFormatted = checkInDateTime.toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'long',
    });

    const deadlineFormatted = deadlineDateTime.toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'long',
    });

    let message = '';
    let style = {
      bg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800/40 text-blue-900 dark:text-blue-200',
      icon: 'text-blue-600 dark:text-blue-400',
      badge: 'bg-blue-100 text-blue-800 border-blue-300',
    };

    if (isExpired) {
      style = {
        bg: 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/40 text-rose-900 dark:text-rose-200',
        icon: 'text-rose-600 dark:text-rose-400',
        badge: 'bg-rose-100 text-rose-800 border-rose-300',
      };
      message = `Plazo de confirmación vencido: Esta reserva requería confirmación previa de 24 horas (plazo límite: ${deadlineFormatted} a las ${timeLabel}) y ha sido cancelada automáticamente.`;
    } else if (totalHoursRemaining < 4) {
      // Menos de 4 horas exactas para el plazo límite -> ALERTA URGENTE
      style = {
        bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-100 font-medium',
        icon: 'text-rose-600 dark:text-rose-400',
        badge: 'bg-rose-100 text-rose-800 border-rose-300',
      };
      message = `Aviso urgente: Dispone de ${totalHoursRemaining} hora(s) y ${remainingMinutes} minuto(s) para confirmar su asistencia. Su plazo límite vence a las ${timeLabel} de hoy (24 horas antes de su llegada el ${checkInFormatted} a las ${timeLabel}). De no confirmar, la reserva se cancelará automáticamente.`;
    } else if (totalHoursRemaining < 24) {
      // Entre 4 y 23 horas restantes
      style = {
        bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-200',
        icon: 'text-amber-600 dark:text-amber-400',
        badge: 'bg-amber-100 text-amber-800 border-amber-300',
      };
      message = `Dispone de ${totalHoursRemaining} horas para confirmar su asistencia. Su plazo límite vence a las ${timeLabel} del ${deadlineFormatted} (exactamente 24 horas antes de su llegada el ${checkInFormatted} a las ${timeLabel}).`;
    } else {
      // 24 horas o más
      style = {
        bg: 'bg-amber-50/80 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-800/30 text-amber-900 dark:text-amber-200',
        icon: 'text-amber-600 dark:text-amber-400',
        badge: 'bg-amber-100/80 text-amber-800 border-amber-300',
      };
      message = `Dispone de ${diffDays} día(s) y ${remainingHours} hora(s) para confirmar su asistencia (Plazo límite: ${deadlineFormatted} a las ${timeLabel}).`;
    }

    return {
      checkInDateTime,
      deadlineDateTime,
      timeLabel,
      totalHoursRemaining,
      totalMinutesRemaining,
      diffDays,
      remainingHours,
      checkInFormatted,
      deadlineFormatted,
      message,
      style,
      isExpired,
      isUrgent: totalHoursRemaining < 4 && !isExpired,
    };
  };

  const fmtAmt = (amt) => Number(amt) > 0 && Number(amt) < 2000
    ? (Number(amt) * 4000).toLocaleString('es-CO')
    : Number(amt).toLocaleString('es-CO');

  const hasPendingReservations = reservations.some((r) => r.status === 'pending');

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-900/50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight flex items-center gap-2.5">
            <CalendarCheck className="w-7 h-7 text-brand-600" />
            Mis Reservas
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Consulta el estado de tus reservas, detalles de estancia y recibos de pago
          </p>
        </div>

        {/* Warning banner for pending reservations */}
        {hasPendingReservations && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-3 animate-slideUp">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="text-sm font-bold text-amber-800">Tienes reservas pendientes de confirmar</p>
              <p className="text-xs text-amber-700 mt-0.5">
                Reservas sin confirmar serán canceladas automáticamente si no se confirman un día antes de la fecha de entrada.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-brand-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Cargando tu historial...</p>
          </div>
        ) : reservations.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-700">
            <BedDouble className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Aún no tienes reservas</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto mb-6">
              Explora nuestras habitaciones y reserva tu próxima estadía en HotelWork.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reservations.map((res) => {
              const confirmInfo = res.status === 'pending' ? getConfirmationInfo(res.check_in_date, res.estimated_arrival_time) : null;
              const extras = res.extras || [];
              const extrasTotal = extras.reduce((sum, e) => sum + (e.subtotal || e.unit_price || 0), 0);
              const roomTotal = Number(res.final_total) > 0 && Number(res.final_total) < 2000
                ? Number(res.final_total) * 4000
                : Number(res.final_total);
              const grandTotal = roomTotal + extrasTotal;

              return (
                <div
                  key={res.id}
                  className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all overflow-hidden"
                >
                  {/* Smart Confirmation Deadline Warning */}
                  {res.status === 'pending' && confirmInfo && (
                    <div className={`px-4 py-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-slideUp ${confirmInfo.style.bg}`}>
                      <div className="flex items-center gap-2.5">
                        <Clock className={`w-4 h-4 shrink-0 ${confirmInfo.style.icon}`} />
                        <p className="text-xs font-bold leading-tight">
                          {confirmInfo.message}
                        </p>
                      </div>
                      {!confirmInfo.isExpired && (
                        <button
                          onClick={() => handleConfirm(res.id)}
                          disabled={confirmingId === res.id}
                          className="shrink-0 self-start sm:self-auto px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Confirmar Asistencia
                        </button>
                      )}
                    </div>
                  )}

                  <div className="p-6 flex flex-col md:flex-row justify-between md:items-start gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-extrabold text-base text-slate-900 dark:text-slate-50">
                          Reserva #{res.id}
                        </span>
                        {getStatusBadge(res.status)}
                      </div>

                      <div className="flex flex-wrap gap-4 text-xs text-slate-600 dark:text-slate-300 font-medium">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-brand-600" />
                          {res.check_in_date} al {res.check_out_date}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <BedDouble className="w-4 h-4 text-brand-600" />
                          Habitación #{res.room_id}
                        </span>
                        {res.estimated_arrival_time && (
                          <span className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700" title="Hora de llegada definitiva registrada para esta reservación">
                            <Clock className="w-3.5 h-3.5 text-brand-600" />
                            Llegada registrada: {res.estimated_arrival_time} (Definitiva)
                          </span>
                        )}
                      </div>

                      {res.clean_special_requests && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-700/50 max-w-lg">
                          "{res.clean_special_requests}"
                        </p>
                      )}

                      {/* Extras list */}
                      {extras.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Servicios agregados:</p>
                          {extras.map((extra, idx) => (
                            <div key={idx} className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/30 px-2.5 py-1.5 rounded-lg">
                              <span>{extra.extra_service?.name || `Servicio #${extra.extra_service_id}`}</span>
                              <span className="font-semibold">${(extra.subtotal || extra.unit_price || 0).toLocaleString('es-CO')} COP</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-700/50 gap-3">
                      <div className="text-left md:text-right">
                        <span className="text-xs text-slate-400 block font-medium">Total Habitación</span>
                        <span className="text-lg font-black text-slate-900 dark:text-slate-50">
                          ${roomTotal.toLocaleString('es-CO')} COP
                        </span>
                        {extrasTotal > 0 && (
                          <>
                            <span className="text-xs text-slate-400 block mt-1 font-medium">+ Servicios</span>
                            <span className="text-sm font-bold text-brand-600">
                              +${extrasTotal.toLocaleString('es-CO')} COP
                            </span>
                            <div className="border-t border-slate-200 dark:border-slate-600 mt-1 pt-1">
                              <span className="text-xs text-slate-400 block font-medium">Gran Total</span>
                              <span className="text-base font-black text-brand-700">
                                ${grandTotal.toLocaleString('es-CO')} COP
                              </span>
                            </div>
                          </>
                        )}
                        <span className="text-xs text-slate-400 block">IVA 19% incl.</span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-semibold mt-0.5">
                          Pago al llegar al hotel: Tarjeta, Transferencia o Efectivo
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 justify-end">
                        <button
                          onClick={() => setSelectedReceipt(res)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
                        >
                          <Receipt className="w-3.5 h-3.5 text-brand-600" />
                          Ver Factura
                        </button>

                        {/* Add extras button for pending/confirmed */}
                        {['pending', 'confirmed'].includes(res.status) && (
                          <button
                            onClick={() => setExtrasModalReservation(res)}
                            className="px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold rounded-xl border border-brand-200 transition-colors flex items-center gap-1.5"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Servicios
                          </button>
                        )}

                        {/* Registrar Hora de Llegada - Disponible únicamente si no ha sido registrada previamente */}
                        {['pending', 'confirmed'].includes(res.status) && !res.estimated_arrival_time && (
                          <button
                            onClick={() => handleOpenArrivalModal(res)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5"
                            title="Registrar hora estimada de llegada (Registro único)"
                          >
                            <Clock className="w-3.5 h-3.5 text-brand-600" />
                            Registrar Llegada
                          </button>
                        )}

                        {/* Confirm button for pending */}
                        {res.status === 'pending' && (
                          <button
                            onClick={() => handleConfirm(res.id)}
                            disabled={confirmingId === res.id}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                          >
                            {confirmingId === res.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                            {confirmingId === res.id ? 'Confirmando...' : 'Confirmar'}
                          </button>
                        )}

                        {['pending', 'confirmed'].includes(res.status) && (
                          <button
                            onClick={() => handleCancel(res.id)}
                            disabled={actionLoading === res.id}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl border border-rose-200 transition-colors disabled:opacity-50"
                          >
                            {actionLoading === res.id ? 'Cancelando...' : 'Cancelar'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Printable Receipt Modal */}
        {selectedReceipt && (
          <ReservationReceiptModal
            reservation={selectedReceipt}
            onClose={() => setSelectedReceipt(null)}
          />
        )}

        {/* Extras Modal */}
        {extrasModalReservation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full shadow-2xl border border-slate-100 dark:border-slate-700/50 flex flex-col max-h-[85vh]">
              <div className="p-5 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 shrink-0">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-brand-600" />
                    Agregar Servicios
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Reserva #{extrasModalReservation.id}
                  </p>
                </div>
                <button
                  onClick={() => { setExtrasModalReservation(null); fetchMyReservations(); }}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 overflow-y-auto">
                <ExtrasSelector
                  reservationId={extrasModalReservation.id}
                  roomTotal={
                    Number(extrasModalReservation.final_total) > 0 && Number(extrasModalReservation.final_total) < 2000
                      ? Number(extrasModalReservation.final_total) * 4000
                      : Number(extrasModalReservation.final_total)
                  }
                  onTotalChange={() => {}}
                />
              </div>
            </div>
          </div>
        )}

        {/* Arrival Time Modal */}
        {editingArrivalReservation && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-700/50">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-brand-600" />
                  Hora Estimada de Llegada al Hotel
                </h3>
                <button
                  onClick={() => setEditingArrivalReservation(null)}
                  className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
                Indique su hora estimada de llegada a recepción (Reserva #{editingArrivalReservation.id}).
                <span className="block mt-1.5 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 font-medium">
                  Registro único y definitivo: Esta hora solo puede establecerse una única vez por cada reservación. Una vez confirmada, fijará su plazo límite de confirmación (exactamente 24 horas antes de dicha hora) y no podrá modificarse.
                </span>
              </p>

              <form onSubmit={handleSaveArrivalTime} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1.5">
                    Selecciona tu hora aproximada:
                  </label>
                  <select
                    value={arrivalTimeInput}
                    onChange={(e) => setArrivalTimeInput(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-900 dark:text-slate-50 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  >
                    <option value="12:00 PM">12:00 PM (Mediodía)</option>
                    <option value="1:00 PM">1:00 PM</option>
                    <option value="2:00 PM">2:00 PM (Check-in temprano)</option>
                    <option value="3:00 PM (Check-in estándar)">3:00 PM (Check-in estándar)</option>
                    <option value="4:00 PM">4:00 PM</option>
                    <option value="5:00 PM">5:00 PM</option>
                    <option value="6:00 PM">6:00 PM</option>
                    <option value="7:00 PM">7:00 PM</option>
                    <option value="8:00 PM">8:00 PM</option>
                    <option value="9:00 PM">9:00 PM</option>
                    <option value="10:00 PM">10:00 PM (Noche)</option>
                    <option value="11:00 PM">11:00 PM (Llegada tardía)</option>
                    <option value="Madrugada (12:00 AM - 5:00 AM)">Madrugada (12:00 AM - 5:00 AM)</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={updatingArrival}
                    className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow disabled:opacity-50"
                  >
                    {updatingArrival ? 'Guardando...' : 'Guardar Hora de Llegada'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingArrivalReservation(null)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-semibold py-2.5 rounded-xl text-sm transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
