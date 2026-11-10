import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Users, BedDouble, CheckCircle2, Sparkles } from "lucide-react";
import RoomCarousel from "./RoomCarousel";

export default function RoomCard({ room, onSelect }) {
  const navigate = useNavigate();

  const parseAmenities = (amenities) => {
    if (!amenities) return [];
    try {
      return JSON.parse(amenities);
    } catch {
      return amenities.split(",").map((a) => a.trim());
    }
  };

  const getRoomTypeLabel = (type) => {
    const map = {
      single: "Individual",
      double: "Doble",
      suite: "Suite Ejecutiva",
      deluxe: "Penthouse Deluxe",
    };
    return map[type] || type;
  };

  const amenitiesList = parseAmenities(room.amenities);

  // Resolve images: prefer image_urls array, fallback to [image_url]
  const images =
    Array.isArray(room.image_urls) && room.image_urls.length > 0
      ? room.image_urls
      : room.image_url
      ? [room.image_url]
      : [];

  const goToDetail = () => navigate("/rooms/" + room.id);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/50 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-500 flex flex-col group">
      {/* Image / Carousel container -- clicking navigates to detail */}
      <div
        className="relative h-64 overflow-hidden cursor-pointer"
        onClick={goToDetail}
      >
        <div className="w-full h-full transform group-hover:scale-105 transition-transform duration-700 ease-out">
          <RoomCarousel images={images} roomNumber={room.room_number} className="h-64" />
        </div>

        {/* Overlaid badges - pointer-events-none so clicks pass through to carousel controls */}
        <div className="absolute top-4 left-4 flex gap-2 pointer-events-none z-20">
          <span className="bg-brand-600/90 backdrop-blur-md text-white font-bold text-xs px-3 py-1.5 rounded-full shadow-lg border border-brand-500/30">
            Hab. {room.room_number}
          </span>
          <span className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md text-slate-900 dark:text-white font-semibold text-xs px-3 py-1.5 rounded-full shadow-lg border border-white/20">
            {getRoomTypeLabel(room.room_type)}
          </span>
        </div>

        {room.floor && (
          <div className="absolute top-4 right-4 bg-black/40 text-white font-medium text-xs px-2.5 py-1 rounded-full backdrop-blur-md pointer-events-none z-20 border border-white/10">
            Piso {room.floor}
          </div>
        )}

        {/* Badge Ocupada */}
        {!room.is_room_bookable && (
          <div className="absolute inset-x-0 bottom-0 bg-blue-600/90 backdrop-blur-md text-white text-center py-2.5 text-xs font-bold pointer-events-none z-20">
            Ocupada
          </div>
        )}
      </div>

      {/* Content -- clicking title/description navigates to detail */}
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div className="cursor-pointer" onClick={goToDetail}>
          <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400 mb-4">
            <span className="flex items-center gap-1.5 font-medium">
              <Users className="w-4 h-4 text-brand-600" /> Hasta {room.capacity} huespedes
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <BedDouble className="w-4 h-4 text-brand-600" /> Descanso Premium
            </span>
          </div>

          <p className="text-slate-600 dark:text-slate-300 text-sm line-clamp-2 mb-5 leading-relaxed font-light">
            {room.description ||
              "Espacio cuidadosamente diseñado para su descanso, equipado con detalles de primera categoría para una experiencia inolvidable."}
          </p>

          {amenitiesList.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {amenitiesList.slice(0, 3).map((item, idx) => (
                <span
                  key={idx}
                  className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 text-xs px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 font-medium transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-500" />
                  {item}
                </span>
              ))}
              {amenitiesList.length > 3 && (
                <span className="text-xs text-slate-400 self-center pl-1 font-medium hover:text-brand-600 transition-colors">
                  +{amenitiesList.length - 3} mas
                </span>
              )}
            </div>
          )}
        </div>

        <div className="pt-5 border-t border-slate-100 dark:border-slate-700/50 flex items-center justify-between mt-auto">
          <div className="cursor-pointer" onClick={goToDetail}>
            <span className="text-xs text-slate-400 block font-medium uppercase tracking-wider mb-0.5">Tarifa por noche</span>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              ${(Number(room.price_per_night) > 0 && Number(room.price_per_night) < 2000 ? Number(room.price_per_night) * 4000 : Number(room.price_per_night)).toLocaleString('es-CO')}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold ml-1.5">
              COP / noche
            </span>
          </div>

          {room.is_room_bookable ? (
            <button
              onClick={(e) => { e.stopPropagation(); onSelect(room); }}
              className="bg-brand-600 hover:bg-brand-700 active:bg-brand-800 text-white font-semibold text-sm px-4 py-2.5 rounded-xl shadow-sm hover:shadow transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4" />
              Reservar
            </button>
          ) : (
            <button
              disabled
              className="bg-slate-200 text-slate-500 dark:text-slate-400 font-semibold text-sm px-4 py-2.5 rounded-xl shadow-sm cursor-not-allowed flex items-center gap-1.5"
            >
              Ocupada
            </button>
          )}
        </div>
      </div>
    </div>
  );
}