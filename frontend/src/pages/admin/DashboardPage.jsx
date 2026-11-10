import React, { useState, useEffect } from 'react';
import { reportsApi } from '../../api/reportsApi';
import { 
  BarChart3, 
  BedDouble, 
  DollarSign, 
  TrendingUp, 
  Users, 
  CalendarCheck, 
  RefreshCw, 
  Loader2, 
  AlertCircle,
  CreditCard,
  Building,
  Download
} from 'lucide-react';

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const formatCOP = (val) => {
    if (val == null) return '$0 COP';
    const num = Number(val);
    const normalized = num > 0 && num < 5000 ? num * 4000 : num;
    return `$${Math.round(normalized).toLocaleString('es-CO')} COP`;
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [sumRes, revRes] = await Promise.all([
        reportsApi.getSummary(),
        reportsApi.getRevenueReport(),
      ]);
      setSummary(sumRes.data);
      setRevenue(revRes.data || []);
    } catch (err) {
      setError(err.message || 'Error al cargar métricas del panel administrativo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50 dark:bg-slate-900/50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-brand-600 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Cargando reporte administrativo...</p>
        </div>
      </div>
    );
  }

  const handleDownloadCSV = async (type) => {
    try {
      const token = localStorage.getItem('access_token');
      const url = `/api/v1/reports/export/${type}.csv`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Error al descargar reporte');
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `hotelwork_${type}_${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert(err.message || 'Error al descargar archivo');
    }
  };

  const kpis = summary?.kpis || {};
  const roomBreakdown = summary?.room_status_breakdown || [];

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 dark:bg-slate-900/50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight flex items-center gap-2.5">
              <BarChart3 className="w-7 h-7 text-brand-600" />
              Panel de Control Administrativo
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
              Indicadores clave de desempeño, ocupación hotelera e ingresos
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
            <button
              onClick={() => handleDownloadCSV('reservations')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-xl text-xs font-bold text-emerald-700 shadow-sm transition-all"
              title="Descargar Reservas en formato CSV"
            >
              <Download className="w-3.5 h-3.5" />
              Reservas .CSV
            </button>
            <button
              onClick={() => handleDownloadCSV('revenue')}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-50 border border-blue-200 hover:bg-blue-100 rounded-xl text-xs font-bold text-blue-700 shadow-sm transition-all"
              title="Descargar Pagos en formato CSV"
            >
              <Download className="w-3.5 h-3.5" />
              Pagos .CSV
            </button>
            <button
              onClick={fetchData}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:bg-slate-900/50 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 shadow-sm transition-all"
              title="Actualizar datos"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Actualizar
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 4 Primary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {/* Occupancy Rate */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Tasa de Ocupación
              </span>
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-slate-50">
              {kpis.occupancy_rate}%
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
              {kpis.occupied_rooms} de {kpis.total_rooms} habitaciones ocupadas
            </p>
          </div>

          {/* Revenue Total */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Ingresos Recaudados
              </span>
              <div className="w-10 h-10 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-slate-50">
              {formatCOP(kpis.total_revenue)}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
              Pendiente de cobro: {formatCOP(kpis.pending_balance)}
            </p>
          </div>

          {/* Total Reservations */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Total Reservas
              </span>
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <CalendarCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-slate-50">
              {kpis.total_reservations}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
              {kpis.active_reservations} activas actualmente
            </p>
          </div>

          {/* Registered Guests */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Huéspedes Registrados
              </span>
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-slate-50">
              {kpis.total_registered_guests}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
              Cuentas activas en el sistema
            </p>
          </div>
        </div>

        {/* Section 2: Room Status Breakdown & Payment Methods */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Room Distribution */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-50 mb-6 flex items-center gap-2">
              <Building className="w-4 h-4 text-brand-600" />
              Distribución de Habitaciones
            </h3>

            <div className="space-y-4">
              {roomBreakdown.map((item, idx) => {
                const total = kpis.total_rooms || 1;
                const pct = Math.round((item.value / total) * 100);
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-700 dark:text-slate-200">
                      <span>{item.name}</span>
                      <span>
                        {item.value} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: item.color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Revenue by Method */}
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-50 mb-6 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-brand-600" />
              Ingresos por Método de Pago
            </h3>

            {revenue.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                No hay transacciones registradas aún.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {revenue.map((r, i) => (
                  <div key={i} className="py-3.5 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wide">
                        {r.method === 'credit_card'
                          ? 'Tarjeta de Crédito'
                          : r.method === 'debit_card'
                          ? 'Tarjeta de Débito'
                          : r.method === 'transfer'
                          ? 'Transferencia Bancaria'
                          : 'Efectivo'}
                      </p>
                      <span className="text-xs text-slate-400">
                        {r.transaction_count} pago(s) completados
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-slate-900 dark:text-slate-50">
                        {formatCOP(r.total_amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
