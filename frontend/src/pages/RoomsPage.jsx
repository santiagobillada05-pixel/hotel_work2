import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { roomsApi } from '../api/roomsApi';
import RoomCard from '../components/rooms/RoomCard';
import ReservationModal from '../components/reservations/ReservationModal';
import WelcomeModal from '../components/WelcomeModal';
import { 
  Search, 
  Calendar, 
  Filter, 
  Users, 
  Sparkles, 
  Loader2, 
  Bed, 
  DollarSign,
  AlertCircle
} from 'lucide-react';

export default function RoomsPage() {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const [showWelcome, setShowWelcome] = useState(() => {
    return !localStorage.getItem('hotelwork_welcome_seen');
  });

  const handleCloseWelcome = () => {
    localStorage.setItem('hotelwork_welcome_seen', 'true');
    setShowWelcome(false);
  };

  useEffect(() => {
    if (isAuthenticated) {
      if (user?.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else if (user?.role === 'staff') {
        navigate('/check-in-out', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate]);

  const today = new Date().toISOString().split('T')[0];
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 2);
  const defaultCheckOut = tomorrow.toISOString().split('T')[0];

  const [checkIn, setCheckIn] = useState(today);
  const [checkOut, setCheckOut] = useState(defaultCheckOut);
  const [roomType, setRoomType] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [capacity, setCapacity] = useState('');

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);

  const fetchRooms = async () => {
    setLoading(true);
    setError(null);
    try {
      if (checkIn && checkOut) {
        // Search available rooms by date
        const response = await roomsApi.getAvailableRooms({
          check_in: checkIn,
          check_out: checkOut,
          room_type: roomType || undefined,
          max_price: maxPrice ? Number(maxPrice) : undefined,
          capacity: capacity ? Number(capacity) : undefined,
        });
        setRooms(response.data || []);
      } else {
        const response = await roomsApi.getAllRooms();
        setRooms(response.data || []);
      }
    } catch (err) {
      setError(err.message || 'Error al cargar habitaciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchRooms();
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-900/50 py-8">
      {/* Welcome Modal - obligatorio cerrar con X */}
      {showWelcome && <WelcomeModal onClose={handleCloseWelcome} />}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 bg-brand-50 border border-brand-100 px-3 py-1 rounded-full text-brand-700 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            Experiencia Hotelera Exclusiva
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-50 tracking-tight">
            Encuentra tu habitación ideal en <span className="text-brand-600">HotelWork</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-300 text-sm mt-2">
            Verifica disponibilidad en tiempo real, consulta tarifas transparentes y reserva en segundos.
          </p>
        </div>

        {/* Search & Filter Box */}
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-10">
          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            {/* Check-in */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-brand-600" /> Check-in
              </label>
              <input
                type="date"
                min={today}
                value={checkIn}
                onChange={(e) => setCheckIn(e.target.value)}
                required
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            {/* Check-out */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-brand-600" /> Check-out
              </label>
              <input
                type="date"
                min={checkIn || today}
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                required
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
              />
            </div>

            {/* Room Type */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Bed className="w-3.5 h-3.5 text-brand-600" /> Tipo
              </label>
              <select
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value="">Todos los tipos</option>
                <option value="single">Individual</option>
                <option value="double">Doble</option>
                <option value="suite">Suite</option>
                <option value="deluxe">Deluxe</option>
              </select>
            </div>

            {/* Guests */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-brand-600" /> Huéspedes
              </label>
              <select
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm text-slate-800 dark:text-slate-100 font-medium focus:ring-2 focus:ring-brand-500 focus:outline-none"
              >
                <option value="">Cualquiera</option>
                <option value="1">1 persona</option>
                <option value="2">2 personas</option>
                <option value="3">3+ personas</option>
              </select>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-bold py-2.5 px-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 h-[42px]"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Buscar Disponibles
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Feedback / Error */}
        {error && (
          <div className="mb-8 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Results Grid */}
        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-brand-600 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Consultando habitaciones disponibles...</p>
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-8">
            <Bed className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">No encontramos habitaciones disponibles</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Intenta cambiar el rango de fechas o los filtros seleccionados para encontrar opciones libres.
            </p>
          </div>
        ) : (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                Habitaciones Disponibles ({rooms.length})
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Fechas: {checkIn} → {checkOut}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  onSelect={(r) => setSelectedRoom(r)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Welcome Modal */}
        {showWelcome && <WelcomeModal onClose={handleCloseWelcome} />}

        {/* Reservation Modal */}
        {selectedRoom && (
          <ReservationModal
            room={selectedRoom}
            initialCheckIn={checkIn}
            initialCheckOut={checkOut}
            onClose={() => setSelectedRoom(null)}
            onSuccess={() => {
              fetchRooms();
            }}
          />
        )}
      </div>
    </div>
  );
}
