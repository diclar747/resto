import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../stores/auth.store';
import api from '../../../api/client';
import {
  DollarSign, ShoppingCart, Users, TrendingUp, Clock,
  Wallet, ChefHat, Activity
} from 'lucide-react';
import { formatCurrency, formatCurrencyShort } from '../../../utils/currency';
import { DateRangeFilter } from '../reports/components/DateRangeFilter';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';

const today = () => new Date().toISOString().split('T')[0];

export function DashboardPage() {
  const branchId = useAuthStore((s) => s.user?.branchId);
  const [from, setFrom] = useState(today());
  const [to, setTo] = useState(today());

  const isToday = from === to && from === today();

  // Daily summary for "today"
  const { data: summary } = useQuery({
    queryKey: ['daily-summary', branchId, from],
    queryFn: () =>
      api.get(`/reports/daily-summary?branchId=${branchId}&date=${from}`).then((r) => r.data),
    enabled: !!branchId && isToday,
    refetchInterval: 30000,
  });

  // Sales by period for ranges
  const { data: salesData } = useQuery({
    queryKey: ['sales-period', branchId, from, to],
    queryFn: () =>
      api.get(`/reports/sales?branchId=${branchId}&from=${from}T00:00:00&to=${to}T23:59:59&groupBy=day`).then((r) => r.data),
    enabled: !!branchId && !isToday,
  });

  const { data: paymentData } = useQuery({
    queryKey: ['payment-methods', branchId, from, to],
    queryFn: () =>
      api.get(`/reports/payment-methods?branchId=${branchId}&from=${from}T00:00:00&to=${to}T23:59:59`).then((r) => r.data),
    enabled: !!branchId && !isToday,
  });

  const { data: productData } = useQuery({
    queryKey: ['top-products', branchId, from, to],
    queryFn: () =>
      api.get(`/reports/products?branchId=${branchId}&from=${from}T00:00:00&to=${to}T23:59:59`).then((r) => r.data),
    enabled: !!branchId && !isToday,
  });

  const { data: activeOrders } = useQuery({
    queryKey: ['active-orders-count'],
    queryFn: () => api.get('/orders?status=open&status=in_progress').then((r) => r.data),
    refetchInterval: 10000,
  });

  // Normalize data based on mode
  const totalRevenue = isToday
    ? summary?.summary?.totalRevenue || '0'
    : salesData?.totalRevenue || '0';
  const totalOrders = isToday
    ? summary?.summary?.totalOrders || 0
    : salesData?.totalOrders || 0;
  const avgTicket = isToday
    ? summary?.summary?.averageTicket || '0'
    : totalOrders > 0 ? (parseFloat(totalRevenue) / totalOrders).toFixed(0) : '0';
  const payments = isToday
    ? summary?.paymentMethods || []
    : paymentData?.data || [];
  const topProducts = isToday
    ? summary?.topProducts || []
    : (productData?.data || []).slice(0, 8);
  const chartData = isToday
    ? (summary?.salesByHour || []).map((h: any) => ({ label: h.label, revenue: parseFloat(h.revenue) }))
    : (salesData?.data || []).map((d: any) => ({ label: d.label, revenue: parseFloat(d.revenue) }));

  const stats = [
    { label: 'Ventas Netas', value: formatCurrency(totalRevenue), icon: DollarSign, color: 'from-blue-600 to-indigo-600' },
    { label: 'Pedidos', value: totalOrders, icon: ShoppingCart, color: 'from-cyan-500 to-blue-500' },
    { label: 'Ticket Promedio', value: formatCurrency(avgTicket), icon: TrendingUp, color: 'from-purple-500 to-indigo-500' },
    { label: 'Órdenes Activas', value: activeOrders?.length || 0, icon: Users, color: 'from-orange-400 to-rose-500' },
  ];

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 bg-background min-h-full">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-secondary tracking-tight">Dashboard General</h1>
          <p className="text-text-secondary font-medium mt-1 text-sm">
            Sincronización en tiempo real • {new Date().toLocaleDateString('es-PY', { dateStyle: 'full' })}
          </p>
        </div>
        <DateRangeFilter from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t); }} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white dark:bg-surface rounded-[24px] md:rounded-[32px] p-4 md:p-6 shadow-card relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
              <div className={`p-3 md:p-4 rounded-2xl bg-gradient-to-br ${stat.color} text-white shadow-lg w-fit`}>
                <Icon size={20} />
              </div>
              <div className="mt-4">
                <p className="text-[10px] md:text-[11px] font-black text-text-secondary uppercase tracking-[0.1em]">{stat.label}</p>
                <p className="text-xl md:text-3xl font-black text-secondary mt-1 tracking-tight">{stat.value}</p>
              </div>
              <div className="absolute right-[-10%] bottom-[-10%] opacity-[0.03] group-hover:scale-110 transition-transform duration-500">
                <Icon size={100} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-surface rounded-[32px] p-6 md:p-8 shadow-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <Activity size={20} />
            </div>
            <h3 className="text-lg md:text-xl font-black text-secondary tracking-tight">
              {isToday ? 'Ventas por Hora' : 'Ventas por Día'}
            </h3>
          </div>

          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.05)' : '#f0f0f0'} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: isDark ? '#94A3B8' : '#A3AED0' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => formatCurrencyShort(v)} tick={{ fontSize: 11, fill: isDark ? '#94A3B8' : '#A3AED0' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value: number) => [formatCurrency(value), 'Ventas']}
                  contentStyle={{
                    borderRadius: '16px',
                    border: 'none',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                    backgroundColor: isDark ? '#1E293B' : '#fff',
                    color: isDark ? '#F1F5F9' : '#1B254B',
                  }}
                />
                <Area type="monotone" dataKey="revenue" stroke="var(--color-primary)" strokeWidth={3} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[280px] text-text-secondary opacity-40 space-y-3">
              <Clock size={40} />
              <p className="text-sm font-bold">Sin datos para el período</p>
            </div>
          )}
        </div>

        {/* Payment Distribution */}
        <div className="bg-white dark:bg-surface rounded-[32px] p-6 md:p-8 shadow-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-success/10 rounded-xl flex items-center justify-center text-success">
              <Wallet size={20} />
            </div>
            <h3 className="text-lg font-black text-secondary tracking-tight">Pagos</h3>
          </div>

          <div className="space-y-5">
            {payments.length > 0 ? (
              payments.map((pm: any) => (
                <div key={pm.method} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-secondary uppercase tracking-wider">{pm.method}</span>
                    <span className="text-xs font-black text-secondary">{formatCurrency(pm.total)}</span>
                  </div>
                  <div className="w-full bg-gray-50 dark:bg-white/5 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-primary to-blue-400 h-2.5 rounded-full transition-all duration-1000"
                      style={{ width: `${pm.percentage}%` }}
                    />
                  </div>
                  <p className="text-right text-[10px] font-bold text-text-secondary">{pm.percentage}%</p>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-3 text-text-secondary opacity-40">
                <Clock size={40} />
                <p className="text-sm font-bold">Sin transacciones</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white dark:bg-surface rounded-[32px] p-6 md:p-8 shadow-card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <ChefHat size={20} />
          </div>
          <h3 className="text-lg md:text-xl font-black text-secondary tracking-tight">Productos Top</h3>
        </div>

        {topProducts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {topProducts.map((p: any, i: number) => (
              <div key={p.variantId || i} className="group flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-white/10 text-[10px] font-black text-text-secondary group-hover:bg-primary group-hover:text-white transition-colors">
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div>
                    <p className="text-sm font-black text-secondary leading-tight">{p.productName}</p>
                    <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mt-0.5">{p.quantity} unidades</p>
                  </div>
                </div>
                <p className="text-sm font-black text-primary">{formatCurrency(p.revenue)}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-center space-y-3 text-text-secondary opacity-40">
            <Clock size={40} />
            <p className="text-sm font-bold">Sin ventas aún</p>
          </div>
        )}
      </div>
    </div>
  );
}
