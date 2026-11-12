import React, { useState, useEffect } from 'react';
import { extrasApi } from '../../api/extrasApi';
import {
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
  Plus,
  Minus,
  Loader2,
  AlertCircle,
  ShoppingBag,
  Receipt
} from 'lucide-react';

// Icon map from backend icon name to lucide component
const ICON_MAP = {
  Wifi: Wifi,
  UtensilsCrossed: UtensilsCrossed,
  Waves: Waves,
  Sparkles: Sparkles,
  Dumbbell: Dumbbell,
  Car: Car,
  ConciergeBell: ConciergeBell,
  Shirt: Shirt,
  Wine: Wine,
  Plane: Plane,
};

const fmt = (price) =>
  new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price);

export default function ExtrasSelector({ reservationId, roomTotal, onTotalChange }) {
  const [extras, setExtras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingId, setAddingId] = useState(null);
  const [removingId, setRemovingId] = useState(null);
  const [selectedExtras, setSelectedExtras] = useState({}); // { extraId: reservationExtraId }

  useEffect(() => {
    fetchData();
  }, [reservationId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [allExtras, reservationExtras] = await Promise.all([
        extrasApi.getAllExtras(),
        extrasApi.getReservationExtras(reservationId),
      ]);

      const extrasData = Array.isArray(allExtras) ? allExtras : allExtras?.data || [];
      const resExtrasData = Array.isArray(reservationExtras) ? reservationExtras : reservationExtras?.data || [];

      setExtras(extrasData);

      // Build map of which extras are selected: extraServiceId -> reservationExtraId
      const selectedMap = {};
      resExtrasData.forEach((re) => {
        selectedMap[re.extra_service_id] = re.id;
      });
      setSelectedExtras(selectedMap);

      // Calculate total
      const selectedItems = extrasData.filter((e) => selectedMap[e.id]);
      const extrasTotal = selectedItems.reduce((sum, e) => sum + (e.price || 0), 0);
      if (onTotalChange) onTotalChange(extrasTotal);
    } catch (err) {
      setError('Error al cargar servicios adicionales');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (extra) => {
    if (extra.category === 'included') return;
    const isSelected = !!selectedExtras[extra.id];

    if (isSelected) {
      // Remove
      setRemovingId(extra.id);
      try {
        const reservationExtraId = selectedExtras[extra.id];
        await extrasApi.removeExtraFromReservation(reservationId, reservationExtraId);
        const newSelected = { ...selectedExtras };
        delete newSelected[extra.id];
        setSelectedExtras(newSelected);

        const selectedItems = extras.filter((e) => newSelected[e.id]);
        const extrasTotal = selectedItems.reduce((sum, e) => sum + (e.price || 0), 0);
        if (onTotalChange) onTotalChange(extrasTotal);
      } catch (err) {
        alert(err.message || 'Error al quitar el servicio');
      } finally {
        setRemovingId(null);
      }
    } else {
      // Add
      setAddingId(extra.id);
      try {
        const response = await extrasApi.addExtraToReservation(reservationId, {
          extra_service_id: extra.id,
          quantity: 1,
        });
        const newExtra = Array.isArray(response) ? response : response?.data || response;
        const newSelected = { ...selectedExtras, [extra.id]: newExtra?.id || extra.id };
        setSelectedExtras(newSelected);

        const selectedItems = extras.filter((e) => newSelected[e.id]);
        const extrasTotal = selectedItems.reduce((sum, e) => sum + (e.price || 0), 0);
        if (onTotalChange) onTotalChange(extrasTotal);
      } catch (err) {
        alert(err.message || 'Error al agregar el servicio');
      } finally {
        setAddingId(null);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-brand-600 mr-2" />
        <span className="text-sm text-slate-500 dark:text-slate-400">Cargando servicios...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
        <AlertCircle className="w-4 h-4 shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  const includedExtras = extras.filter((e) => e.category === 'included');
  const premiumExtras = extras.filter((e) => e.category === 'premium');
  const selectedItems = extras.filter((e) => selectedExtras[e.id]);
  const extrasTotal = selectedItems.reduce((sum, e) => sum + (e.price || 0), 0);
  const grandTotal = (roomTotal || 0) + extrasTotal;

  return (
    <div className="space-y-4 animate-slideUp">
      <div className="flex items-center gap-2 text-sm font-extrabold text-slate-800 dark:text-slate-100">
        <ShoppingBag className="w-4 h-4 text-brand-600" />
        Servicios Adicionales
      </div>

      {/* Included */}
      {includedExtras.length > 0 && (
        <div>
          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">Incluidos</p>
          <div className="space-y-2">
            {includedExtras.map((extra) => {
              const Icon = ICON_MAP[extra.icon] || CheckCircle2;
              return (
                <div
                  key={extra.id}
                  className="flex items-center gap-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl"
                >
                  <div className="w-8 h-8 bg-emerald-100 dark:bg-emerald-800/40 rounded-lg flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{extra.name}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{extra.description}</p>
                  </div>
                  <span className="text-xs font-extrabold text-emerald-600 shrink-0">Incluido</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Premium */}
      {premiumExtras.length > 0 && (
        <div>
          <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">Premium</p>
          <div className="grid grid-cols-1 gap-2">
            {premiumExtras.map((extra) => {
              const Icon = ICON_MAP[extra.icon] || ShoppingBag;
              const isSelected = !!selectedExtras[extra.id];
              const isLoading = addingId === extra.id || removingId === extra.id;

              return (
                <div
                  key={extra.id}
                  className={`flex items-center gap-3 p-3 border rounded-xl transition-all ${
                    isSelected
                      ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-300 dark:border-brand-700/50'
                      : 'bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected ? 'bg-brand-100 dark:bg-brand-800/40' : 'bg-slate-100 dark:bg-slate-800/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-brand-600' : 'text-slate-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{extra.name}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{extra.description}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-extrabold text-slate-700 dark:text-slate-200">
                      ${fmt(extra.price)}
                    </span>
                    <button
                      onClick={() => handleToggle(extra)}
                      disabled={isLoading}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all disabled:opacity-50 ${
                        isSelected
                          ? 'bg-rose-100 hover:bg-rose-200 text-rose-600'
                          : 'bg-brand-100 hover:bg-brand-200 text-brand-600'
                      }`}
                    >
                      {isLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : isSelected ? (
                        <Minus className="w-3.5 h-3.5" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Totals */}
      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
          <Receipt className="w-3.5 h-3.5 text-brand-600" />
          Resumen de Costos
        </div>
        <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
          <span>Habitación (con IVA)</span>
          <span className="font-semibold">${fmt(roomTotal || 0)} COP</span>
        </div>
        {selectedItems.map((extra) => (
          <div key={extra.id} className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
            <span>{extra.name}</span>
            <span className="font-semibold">${fmt(extra.price)} COP</span>
          </div>
        ))}
        {extrasTotal > 0 && (
          <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
            <span>Subtotal servicios</span>
            <span className="font-semibold">${fmt(extrasTotal)} COP</span>
          </div>
        )}
        <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between items-center">
          <span className="text-sm font-extrabold text-slate-900 dark:text-slate-50">Total a Pagar</span>
          <span className="text-base font-black text-brand-700">${fmt(grandTotal)} COP</span>
        </div>
      </div>
    </div>
  );
}
