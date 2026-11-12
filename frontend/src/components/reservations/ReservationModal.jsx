import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { reservationsApi } from '../../api/reservationsApi';
import ExtrasSelector from './ExtrasSelector';
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
  ShoppingBag
} from 'lucide-react';

export default function ReservationModal({ room, initialCheckIn, initialCheckOut, onClose, onSuccess }) {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const today = new Date().toISOString().split('T')[0];
  const defaultCheckIn = initialCheckIn || today;
  
  // Calculate default check-out as tomorrow
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const defaultCheckOut = initialCheckOut || tomorrowDate.toISOString().split('T')[0];

  const [checkInDate, setCheckInDate] = useState(defaultCheckIn);
  const [checkOutDate, setCheckOutDate] = useState(defaultCheckOut);
  const [numGuests, setNumGuests] = useState(1);
  const [specialRequests, setSpecialRequests] = useState('');
  const [currency, setCurrency] = useState('COP');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);
  const [extrasTotal, setExtrasTotal] = useState(0);

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
    const finalTotal = baseTotal + taxAmount;
    
    const formatAmt = (amt) => new Intl.NumberFormat('es-CO', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amt);

    return {
      nights,
      baseTotal: formatAmt(baseTotal),
      taxAmount: formatAmt(taxAmount),
      finalTotal: formatAmt(finalTotal),
      symbol: '$',
      currency: 'COP',
      rawFinalTotal: finalTotal
    };
  }, [checkInDate, checkOutDate, room.price_per_night]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login');
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
        special_requests: specialRequests || null,
        discount_rate: 0.0,
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

  const grandTotal = (calculations?.rawFinalTotal || 0) + extrasTotal;
  const fmtAmt = (amt) => new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amt);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 dark:border-slate-700/50 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
              {successData ? 'Reserva Registrada' : 'Confirmar Reserva'}
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
        <div className="p-6 overflow-y-auto">
          {successData ? (
            <div className="space-y-5">
              {/* Pending Status Badge */}
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-10 h-10" />
                </div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-1">¡Reserva Creada!</h4>
                <span className="inline-block px-3 py-1 bg-amber-100 text-amber-700 border border-amber-300 rounded-full text-xs font-extrabold uppercase tracking-wider mb-3">
                  Estado: Pendiente
                </span>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                  Tu reserva <span className="font-bold text-slate-900 dark:text-slate-50">#{successData.id}</span> fue registrada. 
                  Está en estado <strong>pendiente</strong> hasta que la confirmes.
                </p>
              </div>

              {/* Confirmation deadline info */}
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed space-y-1">
                  <p className="font-bold text-amber-950 dark:text-amber-100">
                    Importante: Confirmación Requerida
                  </p>
                  <p>
                    Debes confirmar que asistirás <strong>1 día antes del check-in</strong> (o a más tardar <strong>4 horas antes</strong> de la hora prevista) desde la pestaña <strong>"Mis Reservas"</strong>.
                  </p>
                  <p className="text-[11px] font-semibold text-rose-700 dark:text-rose-400">
                    Si no confirmas a tiempo, la reserva se cancelará automáticamente.
                  </p>
                </div>
              </div>

              {/* Reservation details */}
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 text-left border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Código de reserva:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-100">#{successData.id}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Fechas:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{successData.check_in_date} al {successData.check_out_date}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Subtotal habitación:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-100">
                    {calculations ? `${calculations.symbol}${calculations.finalTotal} ${calculations.currency}` : `$${Number(successData.final_total).toLocaleString('es-CO')} COP`}
                  </span>
                </div>
                {extrasTotal > 0 && (
                  <div className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>Servicios adicionales:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-100">${fmtAmt(extrasTotal)} COP</span>
                  </div>
                )}
                <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between font-extrabold text-slate-900 dark:text-slate-50 text-sm">
                  <span>Total a pagar:</span>
                  <span className="text-brand-700">${fmtAmt(grandTotal)} COP</span>
                </div>
              </div>

              {/* Extras Selector */}
              <div className="border-t border-slate-100 dark:border-slate-700/50 pt-4">
                <div className="flex items-center gap-2 text-sm font-extrabold text-slate-700 dark:text-slate-200 mb-3">
                  <ShoppingBag className="w-4 h-4 text-brand-600" />
                  ¿Deseas agregar servicios a tu estadía?
                </div>
                <ExtrasSelector
                  reservationId={successData.id}
                  roomTotal={calculations?.rawFinalTotal || Number(successData.final_total)}
                  onTotalChange={setExtrasTotal}
                />
              </div>

              {/* Payment note */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700/50 rounded-xl text-xs text-slate-600 dark:text-slate-300 text-center">
                💳 <strong>Recuerda:</strong> No se realiza pago en línea. El total se paga directamente en el hotel.
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => navigate('/my-reservations')}
                  className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 rounded-xl transition-colors text-sm"
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
            <form onSubmit={handleSubmit} className="space-y-5">
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
                  <div className="relative">
                    <input
                      type="date"
                      min={today}
                      value={checkInDate}
                      onChange={(e) => setCheckInDate(e.target.value)}
                      required
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1.5">
                    Fecha de Salida
                  </label>
                  <div className="relative">
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
              </div>

              {/* Guests and Currency Selector */}
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
                  <div className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-100 font-bold flex items-center justify-between">
                    <span>COP (Peso Colombiano)</span>
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
                  placeholder="Ej: Llegada tardía, piso alto, cuna para bebé..."
                  className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium placeholder:text-slate-400"
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
                  <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between items-center text-sm font-extrabold text-slate-900 dark:text-slate-50">
                    <span>Total a Pagar</span>
                    <span className="text-base text-brand-700">${calculations.finalTotal} COP</span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-amber-600 italic">
                  Selecciona fechas válidas para calcular la tarifa automáticamente.
                </p>
              )}

              {/* Important confirmation policy notice */}
              <div className="p-3.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-2xl flex items-start gap-3">
                <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed space-y-1">
                  <p className="font-bold text-amber-950 dark:text-amber-100 flex items-center gap-1.5">
                    <span>⚠️ Política de Confirmación</span>
                  </p>
                  <p>
                    La reserva quedará en estado <strong>Pendiente</strong>:
                  </p>
                  <ul className="list-disc list-inside space-y-0.5 pl-1 opacity-95">
                    <li>Debes confirmar tu asistencia <strong>1 día antes</strong> del check-in en <em>"Mis Reservas"</em>.</li>
                    <li>O como plazo máximo hasta <strong>4 horas antes</strong> de la hora de llegada.</li>
                  </ul>
                  <p className="text-[11px] font-semibold text-rose-700 dark:text-rose-400 pt-0.5">
                    * Si no confirmas a tiempo, el sistema cancelará la reserva automáticamente.
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
                  'Confirmar y Reservar Ahora'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
