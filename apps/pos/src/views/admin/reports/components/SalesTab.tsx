import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../../stores/auth.store';
import api from '../../../../api/client';
import { formatCurrency, formatCurrencyShort } from '../../../../utils/currency';
import { DollarSign, ShoppingCart, TrendingUp, Clock } from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar
} from 'recharts';

const COLORS = ['#004AAD', '#00D1FF', '#05CD99', '#FFB547', '#EE5D50', '#8B5CF6'];

interface SalesTabProps {
  from: string;
  to: string;
  groupBy: 'day' | 'week';
}

export function SalesTab({ from, to, groupBy }: SalesTabProps) {
  const branchId = useAuthStore((s) => s.user?.branchId);
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

  const { data: salesData } = useQuery({
    queryKey: ['report-sales', branchId, from, to, groupBy],
    queryFn: () =>
      api.get(`/reports/sales?branchId=${branchId}&from=${from}T00:00:00&to=${to}T23:59:59&groupBy=${groupBy}`).then((r) => r.data),
    enabled: !!branchId,
  });

  const { data: paymentData } = useQuery({
    queryKey: ['report-payments', branchId, from, to],
    queryFn: () =>
      api.get(`/reports/payment-methods?branchId=${branchId}&from=${from}T00:00:00&to=${to}T23:59:59`).then((r) => r.data),
    enabled: !!branchId,
  });

  const totalRevenue = salesData?.totalRevenue || '0';
  const totalOrders = salesData?.totalOrders || 0;
  const avgTicket = totalOrders > 0 ? (parseFloat(totalRevenue) / totalOrders).toFixed(0) : '0';
  const chartData = (salesData?.data || []).map((d: any) => ({
    label: d.label,
    revenue: parseFloat(d.revenue),
    orders: d.orderCount,
  }));

  const paymentChartData = (paymentData?.data || []).map((p: any) => ({
    name: p.method,
    value: parseFloat(p.total),
  }));

  // Day-of-week breakdown
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const dayBreakdown = dayNames.map((name, i) => {
    const total = (salesData?.data || [])
      .filter((d: any) => new Date(d.key || d.label).getDay() === i)
      .reduce((sum: number, d: any) => sum + parseFloat(d.revenue), 0);
    return { name, revenue: total };
  });

  const kpis = [
    { label: 'Ingresos Totales', value: formatCurrency(totalRevenue), icon: DollarSign, color: 'from-blue-600 to-indigo-600' },
    { label: 'Total Pedidos', value: totalOrders, icon: ShoppingCart, color: 'from-cyan-500 to-blue-500' },
    { label: 'Ticket Promedio', value: formatCurrency(avgTicket), icon: TrendingUp, color: 'from-purple-500 to-indigo-500' },
  ];

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-white dark:bg-surface rounded-[24px] p-5 shadow-card flex items-center gap-4">
              <div className={`p-3 rounded-2xl bg-gradient-to-br ${kpi.color} text-white shadow-lg`}>
                <Icon size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">{kpi.label}</p>
                <p className="text-2xl font-black text-secondary tracking-tight">{kpi.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Area Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-surface rounded-[28px] p-6 shadow-card">
          <h4 className="text-sm font-black text-secondary uppercase tracking-widest mb-4">Ventas por {groupBy === 'week' ? 'Semana' : 'Día'}</h4>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.05)' : '#f0f0f0'} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: isDark ? '#94A3B8' : '#A3AED0' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => formatCurrencyShort(v)} tick={{ fontSize: 10, fill: isDark ? '#94A3B8' : '#A3AED0' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), 'Ventas']}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', backgroundColor: isDark ? '#1E293B' : '#fff', color: isDark ? '#F1F5F9' : '#1B254B' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="var(--color-primary)" strokeWidth={3} fill="url(#salesGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState />
          )}
        </div>

        {/* Payment Pie */}
        <div className="bg-white dark:bg-surface rounded-[28px] p-6 shadow-card">
          <h4 className="text-sm font-black text-secondary uppercase tracking-widest mb-4">Métodos de Pago</h4>
          {paymentChartData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={paymentChartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                    {paymentChartData.map((_: any, i: number) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: isDark ? '#1E293B' : '#fff', color: isDark ? '#F1F5F9' : '#1B254B' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-4">
                {paymentChartData.map((p: any, i: number) => (
                  <div key={p.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="font-bold text-secondary uppercase">{p.name}</span>
                    </div>
                    <span className="font-black text-secondary">{formatCurrency(p.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyState />
          )}
        </div>
      </div>

      {/* Day of week */}
      <div className="bg-white dark:bg-surface rounded-[28px] p-6 shadow-card">
        <h4 className="text-sm font-black text-secondary uppercase tracking-widest mb-4">Ventas por Día de la Semana</h4>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={dayBreakdown}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.05)' : '#f0f0f0'} />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: isDark ? '#94A3B8' : '#A3AED0' }} axisLine={false} tickLine={false} />
            <YAxis tickFormatter={(v) => formatCurrencyShort(v)} tick={{ fontSize: 10, fill: isDark ? '#94A3B8' : '#A3AED0' }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(value: number) => [formatCurrency(value), 'Ventas']} contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: isDark ? '#1E293B' : '#fff', color: isDark ? '#F1F5F9' : '#1B254B' }} />
            <Bar dataKey="revenue" fill="var(--color-primary)" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-[200px] text-text-secondary opacity-40 space-y-2">
      <Clock size={32} />
      <p className="text-xs font-bold">Sin datos</p>
    </div>
  );
}
