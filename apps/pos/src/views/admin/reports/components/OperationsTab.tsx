import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../../stores/auth.store';
import api from '../../../../api/client';
import { formatCurrency } from '../../../../utils/currency';
import { Clock, ChefHat } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';

interface OperationsTabProps {
  from: string;
  to: string;
}

export function OperationsTab({ from, to }: OperationsTabProps) {
  const branchId = useAuthStore((s) => s.user?.branchId);
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

  const { data: prepData } = useQuery({
    queryKey: ['report-prep-time', branchId, from, to],
    queryFn: () =>
      api.get(`/reports/prep-time?branchId=${branchId}&from=${from}T00:00:00&to=${to}T23:59:59`).then((r) => r.data),
    enabled: !!branchId,
  });

  const { data: waiterData } = useQuery({
    queryKey: ['report-waiters', branchId, from, to],
    queryFn: () =>
      api.get(`/reports/waiters?branchId=${branchId}&from=${from}T00:00:00&to=${to}T23:59:59`).then((r) => r.data),
    enabled: !!branchId,
  });

  const stationData = (prepData?.byStation || []).map((s: any) => ({
    name: s.stationName,
    avgSeconds: s.averagePrepTimeSeconds,
    avgMinutes: (s.averagePrepTimeSeconds / 60).toFixed(1),
    tickets: s.ticketCount,
  }));

  const overallAvg = prepData?.overallAveragePrepTimeSeconds || 0;
  const waiters = waiterData?.data || [];

  function formatTime(seconds: number): string {
    const min = Math.floor(seconds / 60);
    const sec = seconds % 60;
    return `${min}m ${sec}s`;
  }

  return (
    <div className="space-y-6">
      {/* Overview KPI */}
      <div className="bg-white dark:bg-surface rounded-[24px] p-5 shadow-card flex items-center gap-4 w-fit">
        <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
          <ChefHat size={20} />
        </div>
        <div>
          <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Tiempo Promedio General</p>
          <p className="text-2xl font-black text-secondary tracking-tight">{formatTime(overallAvg)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prep Time by Station */}
        <div className="bg-white dark:bg-surface rounded-[28px] p-6 shadow-card">
          <h4 className="text-sm font-black text-secondary uppercase tracking-widest mb-4">Tiempo por Estación</h4>
          {stationData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stationData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.05)' : '#f0f0f0'} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: isDark ? '#94A3B8' : '#A3AED0' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: isDark ? '#94A3B8' : '#A3AED0' }} axisLine={false} tickLine={false} label={{ value: 'Segundos', angle: -90, position: 'insideLeft', fontSize: 10, fill: isDark ? '#94A3B8' : '#A3AED0' }} />
                <Tooltip
                  formatter={(value: number) => [formatTime(value), 'Promedio']}
                  contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: isDark ? '#1E293B' : '#fff', color: isDark ? '#F1F5F9' : '#1B254B' }}
                />
                <Bar dataKey="avgSeconds" fill="#F59E0B" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState />
          )}
        </div>

        {/* Waiter Performance */}
        <div className="bg-white dark:bg-surface rounded-[28px] p-6 shadow-card">
          <h4 className="text-sm font-black text-secondary uppercase tracking-widest mb-4">Rendimiento de Meseros</h4>
          {waiters.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-white/10">
                    <th className="pb-3 text-[10px] font-black text-text-secondary uppercase tracking-widest">Mesero</th>
                    <th className="pb-3 text-[10px] font-black text-text-secondary uppercase tracking-widest text-right">Pedidos</th>
                    <th className="pb-3 text-[10px] font-black text-text-secondary uppercase tracking-widest text-right">Ingresos</th>
                    <th className="pb-3 text-[10px] font-black text-text-secondary uppercase tracking-widest text-right">Ticket Prom.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                  {waiters.map((w: any) => (
                    <tr key={w.waiterId} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                      <td className="py-3 text-xs font-black text-secondary">{w.firstName} {w.lastName}</td>
                      <td className="py-3 text-xs font-bold text-secondary text-right">{w.orderCount}</td>
                      <td className="py-3 text-xs font-black text-primary text-right">{formatCurrency(w.revenue)}</td>
                      <td className="py-3 text-xs font-bold text-text-secondary text-right">{formatCurrency(w.averageTicket)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState />
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-[200px] text-text-secondary opacity-40 space-y-2">
      <Clock size={32} />
      <p className="text-xs font-bold">Sin datos de operaciones</p>
    </div>
  );
}
