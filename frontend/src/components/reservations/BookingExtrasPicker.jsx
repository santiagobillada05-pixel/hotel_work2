import React, { useState, useEffect } from 'react';
import { extrasApi } from '../../api/extrasApi';
import {
  Utensils,
  Waves,
  Sparkles,
  Dumbbell,
  Car,
  Coffee,
  Shirt,
  Wine,
  Plane,
  Clock,
  Plus,
  Check,
  ShoppingBag,
  Loader2
} from 'lucide-react';

const ICON_MAP = {
  Utensils: Utensils,
  Waves: Waves,
  Sparkles: Sparkles,
  Dumbbell: Dumbbell,
  Car: Car,
  Coffee: Coffee,
  Shirt: Shirt,
  Wine: Wine,
  Plane: Plane,
  Clock: Clock,
};

const fmt = (amt) => new Intl.NumberFormat('es-CO', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
}).format(amt);

export default function BookingExtrasPicker({ selectedExtras = [], onChange }) {
  const [availableServices, setAvailableServices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchServices = async () => {
      try {
        const res = await extrasApi.getAllExtras();
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        if (isMounted) {
          setAvailableServices(list);
        }
      } catch (err) {
        console.error('Error fetching extras:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchServices();
    return () => { isMounted = false; };
  }, []);

  const isSelected = (serviceId) => {
    return selectedExtras.some((item) => (item.id === serviceId || item.extra_service_id === serviceId));
  };

  const toggleService = (service) => {
    const exists = isSelected(service.id);
    let updated;
    if (exists) {
      updated = selectedExtras.filter((item) => item.id !== service.id && item.extra_service_id !== service.id);
    } else {
      updated = [
        ...selectedExtras,
        {
          id: service.id,
          extra_service_id: service.id,
          name: service.name,
          price: Number(service.price) || 0,
          quantity: 1,
          icon: service.icon,
        },
      ];
    }
    if (onChange) {
      onChange(updated);
    }
  };

  if (loading) {
    return (
      <div className="py-4 text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
        <span>Cargando servicios adicionales disponibles...</span>
      </div>
    );
  }

  if (availableServices.length === 0) {
    return null;
  }

  const selectedCount = selectedExtras.length;
  const totalExtrasAmount = selectedExtras.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 uppercase tracking-wider">
          <ShoppingBag className="w-4 h-4 text-brand-600" />
          Servicios Adicionales (Opcional)
        </label>
        {selectedCount > 0 && (
          <span className="text-[11px] font-extrabold text-brand-700 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/40 px-2.5 py-0.5 rounded-full border border-brand-200 dark:border-brand-800/40">
            {selectedCount} seleccionado{selectedCount > 1 ? 's' : ''} (+${fmt(totalExtrasAmount)} COP)
          </span>
        )}
      </div>

      <p className="text-[11px] text-slate-500 dark:text-slate-400">
        Personaliza tu estadía. Puedes agregarlos ahora o solicitarlos en recepción durante tu llegada.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
        {availableServices.map((service) => {
          const selected = isSelected(service.id);
          const IconComp = ICON_MAP[service.icon] || Sparkles;

          return (
            <div
              key={service.id}
              onClick={() => toggleService(service)}
              className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between text-left select-none ${
                selected
                  ? 'bg-brand-50 dark:bg-brand-950/30 border-brand-500 dark:border-brand-500/50 shadow-sm'
                  : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0 pr-2">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    selected
                      ? 'bg-brand-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <IconComp className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {service.name}
                  </p>
                  <p className="text-[11px] font-semibold text-brand-600 dark:text-brand-400">
                    +${fmt(service.price)} COP
                  </p>
                </div>
              </div>

              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
                  selected
                    ? 'bg-brand-600 border-brand-600 text-white'
                    : 'border-slate-300 dark:border-slate-600 text-slate-400'
                }`}
              >
                {selected ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Plus className="w-3.5 h-3.5" />}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
