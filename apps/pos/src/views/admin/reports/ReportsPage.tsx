import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../stores/auth.store';
import api from '../../../api/client';
import { useState } from 'react';
import { BarChart3, Download, Calendar } from 'lucide-react';

export function ReportsPage() {
  const branchId = useAuthStore((s) => s.user?.branchId);
  const [tab, setTab] = useState<'sales' | 'products' | 'waiters' | 'preptime'>('sales');
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    return {
      from: weekAgo.toISOString().split('T')[0],
      to: today.toISOString().split('T')[0],
    };
  });

  const params = `branchId=${branchId}&from=${dateRange.from}&to=${dateRange.to}`;

  const { data: salesData } = useQuery({
    queryKey: ['report-sales', branchId, dateRange],
    queryFn: () => api.get(`/reports/sales?${params}&groupBy=day`).then((r) => r.data),
    enabled: !!branchId && tab === 'sales',
  });

  const { data: productsData } = useQuery({
    queryKey: ['report-products', branchId, dateRange],
    queryFn: () => api.get(`/reports/products?${params}`).then((r) => r.data),
    enabled: !!branchId && tab === 'products',
  });

  const { data: waitersData } = useQuery({
    queryKey: ['report-waiters', branchId, dateRange],
    queryFn: () => api.get(`/reports/waiters?${params}`).then((r) => r.data),
    enabled: !!branchId && tab === 'waiters',
  });

  const { data: prepTimeData } = useQuery({
    queryKey: ['report-preptime', branchId, dateRange],
    queryFn: () => api.get(`/reports/prep-time?${params}`).then((r) => r.data),
    enabled: !!branchId && tab === 'preptime',
  });

  const maxRevenue = salesData?.periods
    ? Math.max(...salesData.periods.map((p: any) => Number(p.revenue)))
    : 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Reportes</h2>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-gray-400" />
            <input
              type="date"
              className="input"
              value={dateRange.from}
              onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
            />
            <span className="text-gray-400">-</span>
            <input
              type="date"
              className="input"
              value={dateRange.to}
              onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { key: 'sales', label: 'Ventas' },
          { key: 'products', label: 'Productos' },
          { key: 'waiters', label: 'Camareros' },
          { key: 'preptime', label: 'Tiempos cocina' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              tab === t.key ? 'bg-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Sales report */}
      {tab === 'sales' && salesData && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border p-4">
              <p className="text-sm text-gray-500">Ingresos totales</p>
              <p className="text-2xl font-bold">${Number(salesData.totals?.revenue || 0).toLocaleString('es-AR')}</p>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <p className="text-sm text-gray-500">Total pedidos</p>
              <p className="text-2xl font-bold">{salesData.totals?.orderCount || 0}</p>
            </div>
            <div className="bg-white rounded-xl border p-4">
              <p className="text-sm text-gray-500">Ticket promedio</p>
              <p className="text-2xl font-bold">${Number(salesData.totals?.averageTicket || 0).toLocaleString('es-AR')}</p>
            </div>
          </div>

          {/* Simple bar chart */}
          <div className="bg-white rounded-xl border p-5">
            <h3 className="font-semibold mb-4">Ventas por día</h3>
            <div className="space-y-2">
              {salesData.periods?.map((period: any) => (
                <div key={period.period} className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 w-24">{period.period}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-6">
                    <div
                      className="bg-blue-500 h-6 rounded-full flex items-center justify-end pr-2"
                      style={{ width: `${maxRevenue ? (Number(period.revenue) / maxRevenue) * 100 : 0}%`, minWidth: '2rem' }}
                    >
                      <span className="text-xs text-white font-medium">
                        ${Number(period.revenue).toLocaleString('es-AR')}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm text-gray-400 w-16 text-right">{period.orderCount} ord</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Products report */}
      {tab === 'products' && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">#</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Producto</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Cantidad</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Ingresos</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {productsData?.map((p: any, i: number) => (
                <tr key={p.productVariantId}>
                  <td className="px-4 py-3 text-sm text-gray-400">{i + 1}</td>
                  <td className="px-4 py-3 font-medium">{p.productName}</td>
                  <td className="px-4 py-3 text-right">{p.quantity}</td>
                  <td className="px-4 py-3 text-right font-bold">${Number(p.revenue).toLocaleString('es-AR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Waiters report */}
      {tab === 'waiters' && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Camarero</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Pedidos</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Ingresos</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Ticket prom.</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {waitersData?.map((w: any) => (
                <tr key={w.waiterId}>
                  <td className="px-4 py-3 font-medium">{w.waiterName || w.waiterId}</td>
                  <td className="px-4 py-3 text-right">{w.orderCount}</td>
                  <td className="px-4 py-3 text-right font-bold">${Number(w.revenue).toLocaleString('es-AR')}</td>
                  <td className="px-4 py-3 text-right">${Number(w.averageTicket).toLocaleString('es-AR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Prep time report */}
      {tab === 'preptime' && prepTimeData && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border p-5">
            <h3 className="font-semibold mb-2">Tiempo promedio general</h3>
            <p className="text-3xl font-bold">
              {prepTimeData.overall ? `${Math.round(prepTimeData.overall / 60)} min` : 'N/A'}
            </p>
          </div>
          {prepTimeData.byStation && prepTimeData.byStation.length > 0 && (
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Estación</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Tiempo promedio</th>
                    <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Tickets</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {prepTimeData.byStation.map((s: any) => (
                    <tr key={s.stationId}>
                      <td className="px-4 py-3 font-medium">{s.stationName}</td>
                      <td className="px-4 py-3 text-right">{Math.round(s.averageSeconds / 60)} min</td>
                      <td className="px-4 py-3 text-right">{s.ticketCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
