import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { reservationsApi } from '../../api/reservationsApi';
import BookingExtrasPicker from './BookingExtrasPicker';
import { 
  X, 
  Calendar, 
  Users, 
  FileText, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  Receipt,
  Clock,
  Info,
  ShoppingBag,
  CreditCard,
  Sparkles
} from 'lucide-react';

export default function ReservationModal({ room, initialCheckIn, initialCheckOut, onClose, onSuccess }) {
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const isStaffOrAdmin = user?.role === 'admin' || user?.role === 'staff';

  const today = new Date().toISOString().split('T')[0];
  const defaultCheckIn = initialCheckIn || today;
  
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const defaultCheckOut = initialCheckOut || tomorrowDate.toISOString().split('T')[0];

  const [checkInDate, setCheckInDate] = useState(defaultCheckIn);
  const [checkOutDate, setCheckOutDate] = useState(defaultCheckOut);
  const [arrivalTime, setArrivalTime] = useState('3:00 PM (Check-in estándar)');
  const [numGuests, setNumGuests] = useState(1);
  const [specialRequests, setSpecialRequests] = useState('');
  const [selectedExtras, setSelectedExtras] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);

  // Extras total
  const extrasTotal = useMemo(() => {
    return selectedExtras.reduce(
      (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
      0
    );
  }, [selectedExtras]);

  // Live tariff calculation
  const calculations = useMemo(() => {
    if (!checkInDate || !checkOutDate) return null;
    const start = new Date(checkInDate);
    const end = new Date(checkOutDate);
    const diffTime = end - start;
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (nights <= 0) return null;

    const rawPrice = Number(room.price_per_night) || 0;
    const price = rawPrice > 0 && rawPrice < 2000 ? rawPrice * 4000 : rawPrice;
    const baseTotal = nights * price;
    const taxAmount = Math.round(baseTotal * 0.19); // 19% IVA
    const finalRoomTotal = baseTotal + taxAmount;
    
    const formatAmt = (amt) => new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amt);

    return {
      nights,
      price,
      baseTotal: formatAmt(baseTotal),
      rawBaseTotal: baseTotal,
      taxAmount: formatAmt(taxAmount),
      rawTaxAmount: taxAmount,
      finalTotal: formatAmt(finalRoomTotal),
      rawFinalTotal: finalRoomTotal,
      currency: 'COP',
    };
  }, [checkInDate, checkOutDate, room.price_per_night]);

  const grandTotal = (calculations?.rawFinalTotal || 0) + extrasTotal;
  const fmtAmt = (amt) => new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amt);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isStaffOrAdmin) {
      setError('Las cuentas de Administrador y Personal de Recepción no pueden reservar habitaciones.');
      return;
    }
    if (!isAuthenticated) {
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }

    if (!calculations) {
      setError('La fecha de salida debe ser posterior a la fecha de entrada');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await reservationsApi.createReservation({
        room_id: Number(room.id),
        check_in_date: checkInDate,
        check_out_date: checkOutDate,
        num_guests: Number(numGuests),
        estimated_arrival_time: arrivalTime,
        special_requests: specialRequests || null,
        selected_extras: selectedExtras,
      });

      setSuccessData(response.data || response);
      if (onSuccess) onSuccess();
    } catch (err) {
      if (err.statusCode === 401) {
        navigate('/login', { state: { from: window.location.pathname } });
        return;
      }
      setError(err.message || 'Error al procesar la reserva');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-700/50 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
              {successData ? 'Reserva Registrada con Éxito' : 'Confirmar Reserva'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Habitación {room.room_number} • ${Number(room.price_per_night > 0 && room.price_per_night < 2000 ? room.price_per_night * 4000 : room.price_per_night).toLocaleString('es-CO')} COP / noche
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {isStaffOrAdmin ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-50">
                  Acción restringida para {user?.role === 'admin' ? 'Administración' : 'Recepción (Staff)'}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
                  Las cuentas con perfil de {user?.role === 'admin' ? 'Administrador' : 'Recepción (Staff)'} no tienen permitido realizar reservas de habitaciones. Para reservar una habitación, inicie sesión con una cuenta de huésped.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-xs transition-all"
                >
                  Entendido
                </button>
              </div>
            </div>
          ) : successData ? (
            <div className="space-y-5">
              {/* Status Badge */}
              <div className="text-center py-2">
                <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/40 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Clock className="w-8 h-8" />
                </div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-1">¡Reserva Creada!</h4>
                <span className="inline-block px-3 py-1 bg-amber-100 text-amber-700 border border-amber-300 rounded-full text-xs font-extrabold uppercase tracking-wider mb-2">
                  Estado: Pendiente
                </span>
                <p className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed max-w-sm mx-auto">
                  Tu reserva <span className="font-bold text-slate-900 dark:text-slate-50">#{successData.id}</span> quedó registrada correctamente en el sistema.
                </p>
              </div>

              {/* Reservation details */}
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 text-left border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Código de reserva:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">#{successData.id}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Habitación:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">Hab. {room.room_number}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Fechas de estadía:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{successData.check_in_date} al {successData.check_out_date}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Huéspedes:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{numGuests} {numGuests === 1 ? 'huésped' : 'huéspedes'}</span>
                </div>

                {/* Selected Extras in summary */}
                {selectedExtras.length > 0 && (
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-2 space-y-1">
                    <span className="font-bold text-slate-700 dark:text-slate-200 block mb-1">Servicios adicionales incluidos:</span>
                    {selectedExtras.map((ex, i) => (
                      <div key={i} className="flex justify-between text-slate-500 dark:text-slate-400 pl-2">
                        <span>• {ex.name}</span>
                        <span>+${fmtAmt(ex.price)} COP</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between font-extrabold text-slate-900 dark:text-slate-50 text-sm">
                  <span>Total a pagar en recepción:</span>
                  <span className="text-brand-700 dark:text-brand-400 text-base font-black">${fmtAmt(successData.final_total || grandTotal)} COP</span>
                </div>
              </div>

              {/* Confirmation deadline info */}
              <div className="p-3.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed space-y-1">
                  <p className="font-bold text-amber-950 dark:text-amber-100">
                    Importante: Confirmación Requerida
                  </p>
                  <p>
                    Debes confirmar tu asistencia <strong>1 día antes de tu fecha de entrada</strong> (o a más tardar <strong>4 horas antes</strong>) desde la pestaña <strong>"Mis Reservas"</strong>.
                  </p>
                  <p className="text-[11px] font-semibold text-rose-700 dark:text-rose-400">
                    * Si no confirmas a tiempo, la reserva se cancelará automáticamente.
                  </p>
                </div>
              </div>

              {/* Payment note */}
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed text-center space-y-1">
                <p className="font-extrabold text-sm flex items-center justify-center gap-1.5 text-emerald-800 dark:text-emerald-300">
                  <CreditCard className="w-4 h-4" /> Pago Directo en el Hotel
                </p>
                <p>
                  El valor total se cancela directamente en la recepción del hotel <strong>al momento del registro de entrada</strong>.
                </p>
                <p className="font-semibold text-emerald-700 dark:text-emerald-400 text-[11px]">
                  Medios de pago aceptados: Transferencia bancaria, Tarjetas de crédito/débito o Efectivo.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => navigate('/my-reservations')}
                  className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm shadow-md"
                >
                  Ver Mis Reservas
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-semibold py-2.5 rounded-xl transition-colors text-sm"
                >
                  Cerrar
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Date Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                    Fecha de Entrada
                  </label>
                  <input
                    type="date"
                    min={today}
                    value={checkInDate}
                    onChange={(e) => setCheckInDate(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                    Fecha de Salida
                  </label>
                  <input
                    type="date"
                    min={checkInDate || today}
                    value={checkOutDate}
                    onChange={(e) => setCheckOutDate(e.target.value)}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                  />
                </div>
              </div>

              {/* Estimated Arrival Time */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-brand-600" />
                  Hora Estimada de Llegada (Registro Único y Definitivo)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={arrivalTime}
                    onChange={(e) => setArrivalTime(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 font-semibold"
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
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 flex items-center bg-slate-50 dark:bg-slate-900/40 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 leading-tight">
                    Fija su plazo límite de confirmación (24 horas antes de dicha hora). Solo puede elegirse una única vez.
                  </div>
                </div>
              </div>

              {/* Guests and Currency */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                    Número de Huéspedes
                  </label>
                  <div className="relative">
                    <Users className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <select
                      value={numGuests}
                      onChange={(e) => setNumGuests(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                    >
                      {Array.from({ length: room.capacity }, (_, i) => i + 1).map((n) => (
                        <option key={n} value={n}>
                          {n} {n === 1 ? 'huésped' : 'huéspedes'}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                    Moneda de Pago
                  </label>
                  <div className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm text-slate-800 dark:text-slate-100 font-bold flex items-center justify-between">
                    <span>COP (Pesos)</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">Oficial</span>
                  </div>
                </div>
              </div>

              {/* Special Requests */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                  Peticiones Especiales (Opcional)
                </label>
                <textarea
                  rows={2}
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  placeholder="Ej: Llegada tardía, piso alto, cuna..."
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium placeholder:text-slate-400"
                />
              </div>

              {/* EXTRAS PICKER: SELECCIÓN DE SERVICIOS ADICIONALES AL MOMENTO DE RESERVAR */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700/50">
                <BookingExtrasPicker
                  selectedExtras={selectedExtras}
                  onChange={setSelectedExtras}
                />
              </div>

              {/* Price Breakdown */}
              {calculations ? (
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                    <Receipt className="w-3.5 h-3.5 text-brand-600" />
                    Desglose de Tarifas
                  </div>
                  <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                    <span>
                      {calculations.nights} noche(s) × ${Number(room.price_per_night > 0 && room.price_per_night < 2000 ? room.price_per_night * 4000 : room.price_per_night).toLocaleString('es-CO')} COP
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">${calculations.baseTotal} COP</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                    <span>Impuestos (IVA 19%)</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">${calculations.taxAmount} COP</span>
                  </div>
                  {extrasTotal > 0 && (
                    <div className="flex justify-between text-xs text-brand-700 dark:text-brand-400 font-bold">
                      <span>Servicios adicionales ({selectedExtras.length})</span>
                      <span>+${fmtAmt(extrasTotal)} COP</span>
                    </div>
                  )}
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between items-center text-sm font-extrabold text-slate-900 dark:text-slate-50">
                    <span>Total a Pagar en Recepción</span>
                    <span className="text-base text-brand-700 dark:text-brand-400 font-black">${fmtAmt(grandTotal)} COP</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-amber-600 italic">
                  Selecciona fechas válidas para calcular la tarifa automáticamente.
                </p>
              )}

              {/* Important payment notice at reservation time */}
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl flex items-start gap-2.5">
                <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-[11px] text-emerald-900 dark:text-emerald-200 leading-relaxed">
                  <p className="font-bold text-emerald-950 dark:text-emerald-100">
                    Pago Únicamente en el Hotel
                  </p>
                  <p>
                    No se realiza ningún cargo ahora. Cancelas el valor total en recepción al momento del check-in (transferencia, tarjeta o efectivo).
                  </p>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={loading || !calculations}
                className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-md hover:shadow transition-all flex items-center justify-center gap-2 text-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Procesando Reserva...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Confirmar y Reservar Ahora (${fmtAmt(grandTotal)} COP)
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
