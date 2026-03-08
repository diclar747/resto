import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import {
  BarChart3, Calendar, TrendingUp, DollarSign, ShoppingCart, Building2
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';

const COLORS = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function GlobalReportsPage() {
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });
  const [selectedBranch, setSelectedBranch] = useState('all');

  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: () => api.get('/marketplace/branches').then((r) => r.data),
  });

  const activeBranches = branches?.filter((b: any) => b.isActive !== false) || [];

  // Generate mock comparison data per branch
  const comparisonData = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(Date.now() - (6 - i) * 86400000);
    const entry: any = { day: date.toLocaleDateString('es-AR', { weekday: 'short' }) };
    activeBranches.forEach((b: any, j: number) => {
      entry[b.name || `Sucursal ${j + 1}`] = Math.floor(20000 + Math.random() * 40000);
    });
    return entry;
  });

  const branchPerformance = activeBranches.map((b: any, i: number) => ({
    name: b.name || `Sucursal ${i + 1}`,
    ingresos: Math.floor(150000 + Math.random() * 200000),
    pedidos: Math.floor(400 + Math.random() * 600),
    ticketPromedio: Math.floor(800 + Math.random() * 1200),
  })).sort((a: any, b: any) => b.ingresos - a.ingresos);

  const totalRevenue = branchPerformance.reduce((sum: number, b: any) => sum + b.ingresos, 0);
  const totalOrders = branchPerformance.reduce((sum: number, b: any) => sum + b.pedidos, 0);
  const avgTicket = totalOrders > 0 ? Math.floor(totalRevenue / totalOrders) : 0;

  return (
    <div className="p-8 space-y-8 bg-[#F4F7FE] min-h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-secondary tracking-tight">Métricas Globales</h1>
          <p className="text-text-secondary font-medium mt-1">Análisis comparativo entre sucursales</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="px-4 py-2.5 bg-white border border-gray-100 rounded-xl text-xs font-bold shadow-sm"
          >
            <option value="all">Todas las Sucursales</option>
            {activeBranches.map((b: any) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
          <div className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-100 rounded-xl shadow-sm">
            <Calendar size={14} className="text-indigo-600" />
            <input type="date" value={dateRange.from} onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })} className="text-xs font-bold border-none outline-none bg-transparent" />
            <span className="text-gray-300">—</span>
            <input type="date" value={dateRange.to} onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })} className="text-xs font-bold border-none outline-none bg-transparent" />
          </div>
        </div>
      </div>

      {/* Aggregate Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Ingresos Totales', value: `$${totalRevenue.toLocaleString('es-AR')}`, icon: DollarSign, color: 'from-indigo-600 to-purple-600' },
          { label: 'Pedidos Totales', value: totalOrders.toLocaleString('es-AR'), icon: ShoppingCart, color: 'from-cyan-500 to-blue-500' },
          { label: 'Ticket Promedio', value: `$${avgTicket.toLocaleString('es-AR')}`, icon: TrendingUp, color: 'from-emerald-500 to-teal-500' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-[32px] p-6 shadow-card relative overflow-hidden group hover:scale-[1.02] transition-transform">
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-2xl bg-gradient-to-br ${stat.color} text-white shadow-lg`}>
                  <Icon size={24} />
                </div>
                <div>
                  <p className="text-[11px] font-black text-text-secondary uppercase tracking-[0.1em]">{stat.label}</p>
                  <p className="text-2xl font-black text-secondary tracking-tight">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Revenue Comparison Chart */}
      <div className="bg-white rounded-[32px] p-8 shadow-card">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
            <BarChart3 size={20} />
          </div>
          <h3 className="text-xl font-black text-secondary tracking-tight">Comparativo de Ingresos</h3>
        </div>

        {activeBranches.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={comparisonData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fontWeight: 700 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                formatter={(value: number) => [`$${value.toLocaleString('es-AR')}`, '']}
              />
              <Legend />
              {activeBranches.map((b: any, i: number) => (
                <Line
                  key={b.id}
                  type="monotone"
                  dataKey={b.name || `Sucursal ${i + 1}`}
                  stroke={COLORS[i % COLORS.length]}
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
            <Building2 className="text-gray-200" size={48} />
            <p className="text-sm font-medium text-text-secondary">No hay sucursales para comparar</p>
          </div>
        )}
      </div>

      {/* Branch Performance Table */}
      <div className="bg-white rounded-[32px] p-8 shadow-card">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
            <TrendingUp size={20} />
          </div>
          <h3 className="text-xl font-black text-secondary tracking-tight">Ranking de Sucursales</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-4 px-4 text-[10px] font-black text-text-secondary uppercase tracking-widest">#</th>
                <th className="text-left py-4 px-4 text-[10px] font-black text-text-secondary uppercase tracking-widest">Sucursal</th>
                <th className="text-right py-4 px-4 text-[10px] font-black text-text-secondary uppercase tracking-widest">Ingresos</th>
                <th className="text-right py-4 px-4 text-[10px] font-black text-text-secondary uppercase tracking-widest">Pedidos</th>
                <th className="text-right py-4 px-4 text-[10px] font-black text-text-secondary uppercase tracking-widest">Ticket Prom.</th>
                <th className="text-right py-4 px-4 text-[10px] font-black text-text-secondary uppercase tracking-widest">% del Total</th>
              </tr>
            </thead>
            <tbody>
              {branchPerformance.map((branch: any, i: number) => (
                <tr key={branch.name} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${i === 0 ? 'bg-yellow-100 text-yellow-700' : i === 1 ? 'bg-gray-100 text-gray-600' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-gray-50 text-gray-400'}`}>
                      {i + 1}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-sm font-black text-secondary">{branch.name}</td>
                  <td className="py-4 px-4 text-sm font-black text-secondary text-right">${branch.ingresos.toLocaleString('es-AR')}</td>
                  <td className="py-4 px-4 text-sm font-bold text-text-secondary text-right">{branch.pedidos}</td>
                  <td className="py-4 px-4 text-sm font-bold text-text-secondary text-right">${branch.ticketPromedio.toLocaleString('es-AR')}</td>
                  <td className="py-4 px-4 text-right">
                    <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                      {totalRevenue > 0 ? ((branch.ingresos / totalRevenue) * 100).toFixed(1) : 0}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
