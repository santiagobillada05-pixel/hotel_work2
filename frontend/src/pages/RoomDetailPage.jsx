import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { roomsApi } from "../api/roomsApi";
import { reservationsApi } from "../api/reservationsApi";
import { useAuthStore } from "../store/authStore";
import RoomCarousel from "../components/rooms/RoomCarousel";
import BookingExtrasPicker from "../components/reservations/BookingExtrasPicker";
import { 
  ArrowLeft, 
  Users, 
  BedDouble, 
  Sparkles, 
  CheckCircle2, 
  Calendar, 
  ShieldCheck, 
  Clock, 
  Receipt, 
  Loader2, 
  AlertCircle,
  Info,
  CreditCard
} from "lucide-react";

export default function RoomDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      if (user?.role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else if (user?.role === "staff") {
        navigate("/check-in-out", { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const today = new Date().toISOString().split("T")[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultCheckOut = tomorrow.toISOString().split("T")[0];

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(defaultCheckOut);
  const [numGuests, setNumGuests] = useState(1);
  const [specialRequests, setSpecialRequests] = useState("");
  const [selectedExtras, setSelectedExtras] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    const fetchRoom = async () => {
      setLoading(true);
      try {
        const res = await roomsApi.getRoomById(id);
        setRoom(res.data);
      } catch (err) {
        setError(err.message || "Error al cargar habitacion");
      } finally {
        setLoading(false);
      }
    };
    fetchRoom();
  }, [id]);

  const extrasTotal = useMemo(() => {
    return selectedExtras.reduce(
      (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
      0
    );
  }, [selectedExtras]);

  const calculations = useMemo(() => {
    if (!room || !checkIn || !checkOut) return null;
    const diff = new Date(checkOut) - new Date(checkIn);
    const nights = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (nights <= 0) return null;

    const price = Number(room.price_per_night) > 0 && Number(room.price_per_night) < 2000 
      ? Number(room.price_per_night) * 4000 
      : Number(room.price_per_night);

    const base = nights * price;
    const tax = Math.round(base * 0.19);
    const roomTotal = base + tax;
    const grandTotal = roomTotal + extrasTotal;

    return {
      nights,
      currency: 'COP',
      price: price.toLocaleString('es-CO'),
      base: base.toLocaleString('es-CO'),
      tax: tax.toLocaleString('es-CO'),
      roomTotal: roomTotal.toLocaleString('es-CO'),
      grandTotal: grandTotal.toLocaleString('es-CO'),
      rawGrandTotal: grandTotal,
    };
  }, [room, checkIn, checkOut, extrasTotal]);

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/rooms/${id}` } });
      return;
    }

    setBookingLoading(true);
    setError(null);
    try {
      await reservationsApi.createReservation({
        room_id: Number(room.id),
        check_in_date: checkIn,
        check_out_date: checkOut,
        num_guests: Number(numGuests),
        special_requests: specialRequests || null,
        selected_extras: selectedExtras,
      });
      setBookingSuccess(true);
    } catch (err) {
      if (err.statusCode === 401) {
        navigate('/login', { state: { from: `/rooms/${id}` } });
        return;
      }
      setError(err.message || "Error al procesar reserva");
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50 dark:bg-slate-900/50">
        <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Habitacion no encontrada</h2>
        <Link to="/" className="text-brand-600 font-bold hover:underline">
          Volver al buscador
        </Link>
      </div>
    );
  }

  const parseAmenities = (amenities) => {
    if (!amenities) return [];
    if (Array.isArray(amenities)) return amenities;
    if (typeof amenities === 'string') {
      try {
        const parsed = JSON.parse(amenities);
        if (Array.isArray(parsed)) return parsed;
        return [parsed];
      } catch {
        return amenities.split(",").map((a) => a.trim()).filter(Boolean);
      }
    }
    return [];
  };

  const amenitiesList = parseAmenities(room.amenities);

  // Resolve gallery images
  const galleryImages =
    Array.isArray(room.image_urls) && room.image_urls.length > 0
      ? room.image_urls
      : room.image_url
      ? [room.image_url]
      : [];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-900/50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-brand-600 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Volver a Habitaciones
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Gallery carousel - h-96 in detail view */}
            <div className="relative rounded-3xl overflow-hidden shadow-sm">
              <RoomCarousel
                images={galleryImages}
                roomNumber={room.room_number}
                className="h-96"
              />
              <div className="absolute top-4 left-4 flex gap-2 pointer-events-none z-20">
                <span className="bg-brand-600 text-white font-extrabold text-sm px-3.5 py-1 rounded-full shadow">
                  Habitacion {room.room_number}
                </span>
                <span className="bg-white dark:bg-slate-800/90 backdrop-blur-md text-slate-900 dark:text-slate-50 font-bold text-sm px-3 py-1 rounded-full shadow">
                  {room.room_type?.toUpperCase()}
                </span>
              </div>
              
              {/* Banner Fuera de servicio */}
              {!room.is_room_bookable && (
                <div className="absolute inset-x-0 bottom-0 bg-rose-600/95 backdrop-blur-md py-3 z-20 flex justify-center items-center shadow-[0_-4px_20px_rgba(225,29,72,0.3)] border-t border-rose-500/50">
                  <div className="flex items-center gap-2 text-white font-black text-sm tracking-wide">
                    <AlertCircle className="w-5 h-5" />
                    ESTA HABITACIÓN ESTÁ FUERA DE SERVICIO
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
              <div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-slate-50 mb-2">
                  Habitacion {room.room_number} - Categoria {room.room_type}
                </h1>
                <div className="flex items-center gap-6 text-xs text-slate-500 dark:text-slate-400 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-brand-600" /> Capacidad: {room.capacity} persona(s)
                  </span>
                  <span className="flex items-center gap-1.5">
                    <BedDouble className="w-4 h-4 text-brand-600" /> Piso: {room.floor || 1}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-700/50 pt-6">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-2">
                  Descripcion
                </h3>
                <p className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed">
                  {room.description ||
                    "Disfrute de una estancia placentera con todas las comodidades modernas, servicio de primera y el ambiente optimo tanto para descanso como para viajes de trabajo."}
                </p>
              </div>

              {/* Amenities */}
              <div className="border-t border-slate-100 dark:border-slate-700/50 pt-6">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-3">
                  Amenidades y Servicios Incluidos
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {amenitiesList.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-700/50"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Policies */}
              <div className="border-t border-slate-100 dark:border-slate-700/50 pt-6">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-3">
                  Politicas del Hotel
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-brand-600 shrink-0" />
                    <span>Entrada a partir de las 15:00 hrs</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-brand-600 shrink-0" />
                    <span>Check-out hasta las 12:00 hrs</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Cancelacion gratuita hasta 24h antes</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>Servicio de limpieza diario incluido</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Widget Sidebar */}
          <div>
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-xl sticky top-24">
              <div className="flex items-baseline justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-700/50">
                <div>
                  <span className="text-3xl font-black text-slate-900 dark:text-slate-50">
                    ${(Number(room.price_per_night) > 0 && Number(room.price_per_night) < 2000 ? Number(room.price_per_night) * 4000 : Number(room.price_per_night)).toLocaleString('es-CO')}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-bold"> COP / noche</span>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  room.is_room_bookable
                    ? "text-emerald-600 bg-emerald-50"
                    : "text-blue-600 bg-blue-50"
                }`}>
                  {room.guest_status_label || (room.is_room_bookable ? "Disponible" : "Ocupada")}
                </span>
              </div>

              {bookingSuccess ? (
                <div className="text-center py-6 space-y-4">
                  <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Clock className="w-8 h-8" />
                  </div>
                  <div>
                    <span className="inline-block px-3 py-0.5 bg-amber-100 text-amber-700 border border-amber-300 rounded-full text-[11px] font-extrabold uppercase tracking-wider mb-2">
                      Estado: Pendiente
                    </span>
                    <h4 className="text-base font-extrabold text-slate-900 dark:text-slate-50">¡Reserva Creada!</h4>
                  </div>
                  
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-xl text-left text-xs text-amber-900 dark:text-amber-200 space-y-1">
                    <p className="font-bold flex items-center gap-1.5 text-amber-950 dark:text-amber-100">
                      <Info className="w-4 h-4 text-amber-600 shrink-0" />
                      Confirmación Requerida
                    </p>
                    <p className="text-[11px] leading-relaxed">
                      Debes confirmar tu asistencia <strong>1 día antes de tu llegada</strong> (o hasta 4 horas antes) en <em>Mis Reservas</em>. De lo contrario, se cancelará automáticamente.
                    </p>
                  </div>

                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl text-left text-xs text-emerald-900 dark:text-emerald-200 space-y-0.5">
                    <p className="font-bold flex items-center gap-1.5 text-emerald-950 dark:text-emerald-100">
                      <CreditCard className="w-4 h-4 text-emerald-600 shrink-0" />
                      Pago en el Hotel
                    </p>
                    <p className="text-[11px] leading-relaxed">
                      No pagas en línea. Cancelas al llegar por transferencia, tarjeta o efectivo.
                    </p>
                  </div>

                  <button
                    onClick={() => navigate("/my-reservations")}
                    className="w-full py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs shadow transition-all"
                  >
                    Ver Mis Reservas
                  </button>
                </div>
              ) : !room.is_room_bookable ? (
                <div className="text-center py-8 px-4 bg-blue-50 border border-blue-100 rounded-2xl">
                  <AlertCircle className="w-10 h-10 text-blue-500 mx-auto mb-3 opacity-80" />
                  <h4 className="text-sm font-bold text-blue-900 mb-2">Habitación Ocupada</h4>
                  <p className="text-xs text-blue-700 font-medium">
                    Esta habitación se encuentra ocupada actualmente por un huésped y no puede ser reservada en este momento.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleBooking} className="space-y-4">
                  {error && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">
                        Fecha de Entrada
                      </label>
                      <input
                        type="date"
                        min={today}
                        value={checkIn}
                        onChange={(e) => setCheckIn(e.target.value)}
                        required
                        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">
                        Salida (Check-out)
                      </label>
                      <input
                        type="date"
                        min={checkIn || today}
                        value={checkOut}
                        onChange={(e) => setCheckOut(e.target.value)}
                        required
                        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">
                        Huespedes (Max: {room.capacity})
                      </label>
                      <select
                        value={numGuests}
                        onChange={(e) => setNumGuests(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      >
                        {Array.from({ length: room.capacity }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={n}>
                            {n} {n === 1 ? "huesped" : "huespedes"}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1">
                        Peticiones Especiales (Opcional)
                      </label>
                      <textarea
                        rows={2}
                        value={specialRequests}
                        onChange={(e) => setSpecialRequests(e.target.value)}
                        placeholder="Cama matrimonial, piso silencioso..."
                        className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Extras Picker: Selección de Servicios Adicionales */}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                    <BookingExtrasPicker
                      selectedExtras={selectedExtras}
                      onChange={setSelectedExtras}
                    />
                  </div>

                  {calculations && (
                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-600 dark:text-slate-300">
                        <span>
                          {calculations.nights} noche(s) x ${calculations.price} COP
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-slate-50">${calculations.base} COP</span>
                      </div>
                      <div className="flex justify-between text-slate-600 dark:text-slate-300">
                        <span>IVA (19%)</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-50">${calculations.tax} COP</span>
                      </div>
                      {extrasTotal > 0 && (
                        <div className="flex justify-between text-brand-700 dark:text-brand-400 font-bold">
                          <span>Servicios adicionales ({selectedExtras.length})</span>
                          <span>+${extrasTotal.toLocaleString('es-CO')} COP</span>
                        </div>
                      )}
                      <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between font-black text-slate-900 dark:text-slate-50 text-sm">
                        <span>Total a pagar en recepción</span>
                        <span className="text-brand-700 font-extrabold text-base">
                          ${calculations.grandTotal} COP
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Confirmation & Payment notice */}
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 rounded-xl text-xs text-amber-900 dark:text-amber-200 space-y-1">
                    <p className="font-bold flex items-center gap-1.5 text-amber-950 dark:text-amber-100">
                      <Info className="w-4 h-4 text-amber-600 shrink-0" />
                      Política de Confirmación
                    </p>
                    <p className="text-[11px] leading-relaxed">
                      La reserva queda en estado <strong>Pendiente</strong>. Deberás confirmarla 1 día antes de la llegada en "Mis Reservas" para evitar auto-cancelación.
                    </p>
                  </div>

                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="text-[11px] font-semibold">
                      Pago al llegar al hotel: Transferencia, Tarjeta o Efectivo
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={bookingLoading || !calculations}
                    className="w-full py-3 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-extrabold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    {bookingLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      "Confirmar Reserva"
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}