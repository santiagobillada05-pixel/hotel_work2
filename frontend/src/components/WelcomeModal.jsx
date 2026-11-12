import React from 'react';
import {
  X,
  Hotel,
  Wifi,
  UtensilsCrossed,
  Waves,
  Sparkles,
  Dumbbell,
  Car,
  ConciergeBell,
  Shirt,
  Wine,
  Plane,
  CheckCircle2,
  Star
} from 'lucide-react';

const INCLUDED_SERVICES = [
  {
    icon: Wifi,
    name: 'WiFi Premium',
    description: 'Conexión de alta velocidad en todas las áreas del hotel',
    price: null,
  },
];

const PREMIUM_SERVICES = [
  { icon: UtensilsCrossed, name: 'Desayuno Buffet', description: 'Desayuno completo tipo buffet con opciones internacionales', price: 35000 },
  { icon: Waves, name: 'Acceso a Piscina', description: 'Acceso ilimitado a la piscina climatizada durante su estadía', price: 25000 },
  { icon: Sparkles, name: 'Spa & Bienestar', description: 'Sesión de relajación en nuestro spa con sauna y jacuzzi', price: 80000 },
  { icon: Dumbbell, name: 'Gimnasio', description: 'Acceso completo al gimnasio equipado las 24 horas', price: 15000 },
  { icon: Car, name: 'Estacionamiento', description: 'Parqueadero seguro y cubierto disponible las 24 horas', price: 20000 },
  { icon: ConciergeBell, name: 'Servicio a la Habitación', description: 'Atención personalizada directamente en su habitación', price: 45000 },
  { icon: Shirt, name: 'Lavandería Express', description: 'Servicio de lavandería y planchado en menos de 24 horas', price: 30000 },
  { icon: Wine, name: 'Minibar Premium', description: 'Minibar surtido con bebidas y snacks de primera calidad', price: 50000 },
  { icon: Plane, name: 'Traslado Aeropuerto', description: 'Transporte privado desde y hacia el aeropuerto', price: 60000 },
];

const fmt = (price) =>
  new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price);

export default function WelcomeModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div className="relative bg-white dark:bg-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 dark:border-slate-700/50 flex flex-col max-h-[90vh] animate-scaleIn overflow-hidden">
        {/* Gradient header */}
        <div className="relative bg-gradient-to-br from-brand-600 to-brand-800 p-8 pb-6 text-white shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors text-white"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <Hotel className="w-7 h-7 text-white" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest opacity-80">Bienvenido a</span>
              <h2 className="text-2xl font-black tracking-tight leading-tight">
                Hotel<span className="text-amber-300">Work</span>
              </h2>
            </div>
          </div>

          <h3 className="text-xl font-extrabold mb-1">¡Bienvenido a HotelWork!</h3>
          <p className="text-sm opacity-80 leading-relaxed">
            Descubre todos los servicios y comodidades que tenemos para hacer tu estadía inolvidable.
          </p>

          {/* Stars decoration */}
          <div className="flex gap-1 mt-3">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 fill-amber-300 text-amber-300" />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-6 space-y-6">
          {/* Included Services */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                Servicios Incluidos
              </h4>
              <span className="ml-auto text-xs bg-emerald-100 text-emerald-700 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                Sin costo adicional
              </span>
            </div>
            <div className="grid gap-2">
              {INCLUDED_SERVICES.map((svc) => {
                const Icon = svc.icon;
                return (
                  <div
                    key={svc.name}
                    className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl p-3.5"
                  >
                    <div className="w-9 h-9 bg-emerald-100 dark:bg-emerald-800/40 rounded-xl flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{svc.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{svc.description}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-extrabold text-emerald-600">Incluido</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Premium Services */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                Servicios Premium
              </h4>
              <span className="ml-auto text-xs bg-amber-100 text-amber-700 font-bold px-2.5 py-0.5 rounded-full border border-amber-200">
                Agrega al reservar
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PREMIUM_SERVICES.map((svc) => {
                const Icon = svc.icon;
                return (
                  <div
                    key={svc.name}
                    className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/30 rounded-2xl p-3 hover:shadow-sm transition-all"
                  >
                    <div className="w-8 h-8 bg-amber-100 dark:bg-amber-800/30 rounded-xl flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{svc.name}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{svc.description}</p>
                    </div>
                    <span className="text-xs font-extrabold text-amber-700 shrink-0">
                      ${fmt(svc.price)}<br />
                      <span className="text-[10px] font-bold text-amber-500">COP</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Note */}
          <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl p-4 border border-emerald-200 dark:border-emerald-800/40 text-center space-y-1">
            <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
              💳 Pago Únicamente en el Hotel
            </p>
            <p className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
              No se realiza ningún cobro en la página web. El total (habitación + servicios elegidos) se paga directamente en el establecimiento al momento del registro de entrada (llegada), ya sea por transferencia, tarjeta o efectivo.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700/50 shrink-0 bg-slate-50 dark:bg-slate-900/30">
          <button
            onClick={onClose}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 rounded-xl shadow-md hover:shadow-lg transition-all text-sm"
          >
            ¡Explorar Habitaciones!
          </button>
        </div>
      </div>
    </div>
  );
}
