import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../stores/auth.store';
import api from '../../../api/client';
import { useState } from 'react';
import {
  BarChart3, Download, Calendar, TrendingUp, Users, Clock,
  DollarSign, PieChart as PieChartIcon, ArrowUpRight, ArrowDownRight,
  Filter, RefreshCcw, MoreHorizontal
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { formatCurrency, formatCurrencyShort } from '../../../utils/currency';

const COLORS = ['#004AAD', '#00C2FF', '#FFB800', '#FF4D4D', '#2ECC71'];

export function ReportsPage() {
  const branchId = useAuthStore((s) => s.user?.branchId);
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

  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ['report-sales', branchId, dateRange],
    queryFn: () => api.get(`/reports/sales?${params}&groupBy=day`).then((r) => r.data),
    enabled: !!branchId,
  });

  const { data: productsData } = useQuery({
    queryKey: ['report-products', branchId, dateRange],
    queryFn: () => api.get(`/reports/products?${params}`).then((r) => r.data),
    enabled: !!branchId,
  });

  const { data: paymentsData } = useQuery({
    queryKey: ['report-payments', branchId, dateRange],
    queryFn: () => api.get(`/reports/payment-methods?${params}`).then((r) => r.data),
    enabled: !!branchId,
  });

  const { data: prepTimeData } = useQuery({
    queryKey: ['report-preptime', branchId, dateRange],
    queryFn: () => api.get(`/reports/prep-time?${params}`).then((r) => r.data),
    enabled: !!branchId,
  });

  if (salesLoading) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-primary/10 border-t-primary rounded-full animate-spin mb-4" />
        <p className="text-sm font-bold text-secondary/60 animate-pulse uppercase tracking-widest">Generando Inteligencia de Negocios...</p>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 bg-[#F4F7FE] min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/50 backdrop-blur-md p-6 rounded-[32px] border border-white shadow-xl">
        <div>
          <h2 className="text-3xl font-black text-secondary tracking-tight">Business <span className="text-primary italic">Intelligence</span></h2>
          <p className="text-sm font-medium text-text-secondary mt-1">Análisis avanzado de rendimiento y ventas</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 px-3">
              <Calendar size={16} className="text-primary" />
              <input
                type="date"
                className="bg-transparent border-none text-xs font-black uppercase text-secondary focus:ring-0"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
              />
            </div>
            <div className="w-px h-4 bg-gray-100" />
            <div className="flex items-center gap-2 px-3">
              <input
                type="date"
                className="bg-transparent border-none text-xs font-black uppercase text-secondary focus:ring-0"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
              />
            </div>
          </div>

          <button className="flex items-center gap-2 px-6 py-3 bg-secondary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-secondary/90 transition-all shadow-lg shadow-secondary/20">
            <Download size={14} /> Exportar
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title="Ingresos Totales"
          value={formatCurrency(salesData?.totalRevenue || 0)}
          trend="+12.5%"
          positive={true}
          icon={DollarSign}
          color="bg-primary"
        />
        <KpiCard
          title="Pedidos Totales"
          value={salesData?.totalOrders || 0}
          trend="+5.2%"
          positive={true}
          icon={BarChart3}
          color="bg-secondary"
        />
        <KpiCard
          title="Ticket Promedio"
          value={formatCurrency(salesData?.totalOrders > 0 ? (salesData.totalRevenue / salesData.totalOrders) : 0)}
          trend="-2.1%"
          positive={false}
          icon={TrendingUp}
          color="bg-amber-500"
        />
        <KpiCard
          title="Tiempo Cocina"
          value={prepTimeData?.overallAveragePrepTimeSeconds ? `${Math.round(prepTimeData.overallAveragePrepTimeSeconds / 60)}m` : 'N/A'}
          trend="-15s"
          positive={true}
          icon={Clock}
          color="bg-emerald-500"
        />
      </div>

      {/* Charts Main Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Sales Chart */}
        <div className="lg:col-span-2 bg-white rounded-[40px] p-8 shadow-xl border border-white relative overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-secondary tracking-tight">Rendimiento de Ventas</h3>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mt-1">Ingresos vs Volumen</p>
            </div>
            <button className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
              <MoreHorizontal size={20} className="text-gray-400" />
            </button>
          </div>

          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData?.data}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#004AAD" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#004AAD" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
                <XAxis
                  dataKey="label"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#A3AED0' }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#A3AED0' }}
                  tickFormatter={(val) => formatCurrencyShort(val)}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '24px',
                    border: 'none',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                    padding: '16px'
                  }}
                  itemStyle={{ fontSize: '12px', fontWeight: 900 }}
                  labelStyle={{ fontSize: '10px', fontWeight: 900, marginBottom: '4px', textTransform: 'uppercase', color: '#A3AED0' }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#004AAD"
                  strokeWidth={4}
                  fillOpacity={1}
                  fill="url(#colorRev)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods Chart */}
        <div className="bg-white rounded-[40px] p-8 shadow-xl border border-white">
          <div className="mb-8">
            <h3 className="text-xl font-black text-secondary tracking-tight">Canales de Pago</h3>
            <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mt-1">Distribución de Ingresos</p>
          </div>

          <div className="h-[250px] w-full mb-8">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentsData?.data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="total"
                  nameKey="method"
                >
                  {paymentsData?.data?.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-4">
            {paymentsData?.data?.slice(0, 4).map((item: any, index: number) => (
              <div key={item.method} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <span className="text-sm font-bold text-secondary uppercase tracking-wider">{item.method}</span>
                </div>
                <span className="text-sm font-black text-primary">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Table Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Products */}
        <div className="bg-white rounded-[40px] p-8 shadow-xl border border-white">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-secondary tracking-tight">Top Ventas</h3>
              <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mt-1">Productos por Volumen</p>
            </div>
          </div>

          <div className="space-y-6">
            {productsData?.data?.slice(0, 5).map((p: any, i: number) => (
              <div key={p.variantId} className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center font-black text-primary text-xs border border-gray-100 italic">
                  #{i + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black text-secondary uppercase tracking-wide truncate">{p.productName}</p>
                  <p className="text-[10px] font-bold text-text-secondary uppercase">{p.variantName}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-primary">{formatCurrency(p.revenue)}</p>
                  <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{p.quantity} Unidades</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Kitchen Performance */}
        <div className="bg-white rounded-[40px] p-8 shadow-xl border border-white">
          <div className="mb-8">
            <h3 className="text-xl font-black text-secondary tracking-tight">Eficacia Operativa</h3>
            <p className="text-xs font-bold text-text-secondary uppercase tracking-widest mt-1">Tiempos por Estación (KDS)</p>
          </div>

          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={prepTimeData?.byStation?.map((s: any) => ({ ...s, min: Math.round(s.averagePrepTimeSeconds / 60) }))}>
                <XAxis
                  dataKey="stationName"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#A3AED0' }}
                />
                <YAxis
                  hide
                />
                <Tooltip
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                  cursor={{ fill: 'transparent' }}
                />
                <Bar
                  dataKey="min"
                  radius={[12, 12, 12, 12]}
                  barSize={40}
                >
                  {prepTimeData?.byStation?.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.min > 15 ? '#FF4D4D' : '#2ECC71'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-black uppercase text-gray-400">Excelente (&lt;15m)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="text-[10px] font-black uppercase text-gray-400">Crítico (&gt;15m)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ title, value, trend, positive, icon: Icon, color }: any) {
  return (
    <div className="bg-white rounded-[32px] p-6 shadow-xl border border-white hover:-translate-y-1 transition-all duration-300 group">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center text-white shadow-lg shadow-black/5 group-hover:scale-110 transition-transform`}>
          <Icon size={24} />
        </div>
        <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-[10px] font-black uppercase ${positive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
          {positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {trend}
        </div>
      </div>
      <div>
        <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.1em] mb-1">{title}</p>
        <h4 className="text-2xl font-black text-secondary tracking-tight">{value}</h4>
      </div>
    </div>
  );
}
