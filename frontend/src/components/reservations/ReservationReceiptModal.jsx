import React from 'react';
import { 
  X, 
  Printer, 
  Hotel, 
  CheckCircle2, 
  Calendar, 
  CreditCard, 
  Receipt,
  Download
} from 'lucide-react';

export default function ReservationReceiptModal({ reservation, onClose }) {
  if (!reservation) return null;

  const handlePrint = () => {
    window.print();
  };

  const nights = Math.max(
    1,
    Math.round(
      (new Date(reservation.check_out_date) - new Date(reservation.check_in_date)) /
        (1000 * 60 * 60 * 24)
    )
  );

  const isLegacy = Number(reservation.final_total) > 0 && Number(reservation.final_total) < 2000;
  const mult = isLegacy ? 4000 : 1;
  const fmtRoom = (amt) => amt != null ? `$${Math.round(Number(amt) * mult).toLocaleString('es-CO')} COP` : '$0 COP';
  const fmtCop = (amt) => amt != null ? `$${Math.round(Number(amt)).toLocaleString('es-CO')} COP` : '$0 COP';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm print:p-0 print:bg-white dark:bg-slate-800 animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-2xl w-full p-8 shadow-2xl border border-slate-100 dark:border-slate-700/50 max-h-[92vh] overflow-y-auto print:max-h-none print:shadow-none print:border-none print:rounded-none">
        {/* Controls - Hidden when printing */}
        <div className="flex justify-between items-center pb-6 mb-6 border-b border-slate-100 dark:border-slate-700/50 print:hidden">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <Receipt className="w-4 h-4 text-brand-600" />
            Comprobante de Reserva & Factura
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir / PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Letterhead Area */}
        <div className="space-y-6">
          {/* Header */}
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-brand-600 text-white rounded-2xl flex items-center justify-center font-bold text-xl shadow-md">
                <Hotel className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-slate-50 tracking-tight leading-none">
                  Hotel<span className="text-brand-600">Work</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">Gestión & Hospitalidad Hotelera</p>
                <p className="text-[11px] text-slate-400">NIT: 900.123.456-7 • contacto@hotelwork.com</p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">
                Factura / Recibo
              </span>
              <span className="text-lg font-black text-slate-900 dark:text-slate-50">
                #HW-{reservation.id.toString().padStart(5, '0')}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                Fecha: {reservation.created_at ? new Date(reservation.created_at).toLocaleDateString() : 'Hoy'}
              </span>
            </div>
          </div>

          {/* Guest & Reservation Metadata */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700/80 text-xs">
            <div>
              <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">
                Datos del Huésped
              </span>
              <p className="font-extrabold text-slate-800 dark:text-slate-100">
                Usuario Registrado #{reservation.user_id}
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                Huéspedes registrados: {reservation.num_guests}
              </p>
            </div>

            <div>
              <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">
                Detalles de Estancia
              </span>
              <p className="text-slate-700 dark:text-slate-200 font-semibold">
                Habitación: #{reservation.room_id}
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                {reservation.check_in_date} al {reservation.check_out_date} ({nights} noche{nights > 1 ? 's' : ''})
              </p>
              <div className="mt-1">
                <span className="inline-block px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-black uppercase">
                  {reservation.status}
                </span>
              </div>
            </div>
          </div>

          {/* Breakdown Table */}
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">
                <th className="py-2.5">Concepto</th>
                <th className="py-2.5 text-center">Noches</th>
                <th className="py-2.5 text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-3">
                  <span className="font-bold text-slate-800 dark:text-slate-100 block">
                    Alojamiento — Habitación #{reservation.room_id}
                  </span>
                  <span className="text-slate-400 text-[11px]">
                    Tarifa regular por estadía
                  </span>
                </td>
                <td className="py-3 text-center font-semibold text-slate-700 dark:text-slate-200">
                  {nights}
                </td>
                <td className="py-3 text-right font-extrabold text-slate-900 dark:text-slate-50">
                  {fmtRoom(reservation.base_total)}
                </td>
              </tr>
              {reservation.discount_amount > 0 && (
                <tr className="text-emerald-700">
                  <td className="py-2.5 font-medium">Descuento aplicado</td>
                  <td className="py-2.5 text-center">-</td>
                  <td className="py-2.5 text-right font-bold">
                    -{fmtRoom(reservation.discount_amount)}
                  </td>
                </tr>
              )}
              <tr>
                <td className="py-2.5 text-slate-600 dark:text-slate-300">Impuestos (IVA 19%)</td>
                <td className="py-2.5 text-center">-</td>
                <td className="py-2.5 text-right font-semibold text-slate-800 dark:text-slate-100">
                  {fmtRoom(reservation.tax_amount)}
                </td>
              </tr>
              {/* Extras */}
              {Array.isArray(reservation.extras) && reservation.extras.length > 0 && (
                <>
                  <tr>
                    <td className="py-2 pt-3" colSpan="3">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Servicios Adicionales
                      </span>
                    </td>
                  </tr>
                  {reservation.extras.map((extra, idx) => (
                    <tr key={idx} className="text-slate-600 dark:text-slate-300">
                      <td className="py-2">
                        {extra.extra_service?.name || `Servicio #${extra.extra_service_id}`}
                        {extra.quantity > 1 && (
                          <span className="text-slate-400"> × {extra.quantity}</span>
                        )}
                      </td>
                      <td className="py-2 text-center">-</td>
                      <td className="py-2 text-right font-semibold">
                        {fmtCop(extra.subtotal)}
                      </td>
                    </tr>
                  ))}
                </>
              )}
            </tbody>
            <tfoot>
              {Array.isArray(reservation.extras) && reservation.extras.length > 0 && (
                <tr className="text-slate-600 dark:text-slate-300 text-xs">
                  <td className="pt-2" colSpan="2">Subtotal habitación + servicios</td>
                  <td className="pt-2 text-right font-semibold">
                    {(() => {
                      const extrasSum = (reservation.extras || []).reduce((s, e) => s + (Number(e.subtotal) || 0), 0);
                      const roomTotal = Number(reservation.final_total) * mult;
                      return fmtCop(roomTotal + extrasSum);
                    })()}
                  </td>
                </tr>
              )}
              <tr className="border-t-2 border-slate-900 font-extrabold text-sm text-slate-900 dark:text-slate-50">
                <td className="pt-3" colSpan="2">
                  Total a Pagar en Hotel
                </td>
                <td className="pt-3 text-right text-brand-700 text-base">
                  {(() => {
                    const extrasSum = Array.isArray(reservation.extras)
                      ? reservation.extras.reduce((s, e) => s + (Number(e.subtotal) || 0), 0)
                      : 0;
                    const roomTotal = Number(reservation.final_total) * mult;
                    return fmtCop(roomTotal + extrasSum);
                  })()}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Footer note */}
          <div className="pt-6 border-t border-slate-100 dark:border-slate-700/50 text-center text-[11px] text-slate-400 space-y-1">
            <p>Gracias por elegir HotelWork. Esperamos que disfrute plenamente de su estancia.</p>
            <p className="text-[10px]">Este documento constituye un comprobante formal de reserva emitido por HotelWork PMS.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
