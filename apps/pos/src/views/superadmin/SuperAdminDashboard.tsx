import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import {
  Building2, ShoppingCart, Users, DollarSign,
  ArrowUpRight, Activity, Clock
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export function SuperAdminDashboard() {
  const { data: branches } = useQuery({
    queryKey: ['superadmin-branches'],
    queryFn: () => api.get('/marketplace/branches').then((r) => r.data),
  });

  const activeBranches = branches?.filter((b: any) => b.isActive !== false) || [];

  const { data: users } = useQuery({
    queryKey: ['superadmin-users'],
    queryFn: () => api.get('/users').then((r) => r.data),
  });

  // Mock aggregated data (real implementation would aggregate per-branch reports)
  const totalRevenue = activeBranches.length * 45000;
  const totalOrders = activeBranches.length * 120;

  const stats = [
    {
      label: 'Ingresos Totales',
      value: `$${totalRevenue.toLocaleString('es-AR')}`,
      change: '+18.3%',
      icon: DollarSign,
      color: 'from-indigo-600 to-purple-600',
    },
    {
      label: 'Pedidos Globales',
      value: totalOrders,
      change: '+12.1%',
      icon: ShoppingCart,
      color: 'from-cyan-500 to-blue-500',
    },
    {
      label: 'Sucursales Activas',
      value: activeBranches.length,
      change: `${branches?.length || 0} total`,
      icon: Building2,
      color: 'from-emerald-500 to-teal-500',
    },
    {
      label: 'Usuarios del Sistema',
      value: users?.length || 0,
      change: 'Todos los roles',
      icon: Users,
      color: 'from-orange-400 to-rose-500',
    },
  ];

  const chartData = activeBranches.map((b: any, i: number) => ({
    name: b.name || `Sucursal ${i + 1}`,
    ingresos: Math.floor(30000 + Math.random() * 50000),
    pedidos: Math.floor(80 + Math.random() * 150),
  }));

  // Mock recent activity
  const recentActivity = [
    { action: 'Nuevo pedido #1042', branch: activeBranches[0]?.name || 'Sucursal 1', time: 'Hace 2 min', type: 'order' },
    { action: 'Cierre de caja completado', branch: activeBranches[0]?.name || 'Sucursal 1', time: 'Hace 15 min', type: 'cash' },
    { action: 'Nuevo usuario registrado', branch: 'Sistema', time: 'Hace 1 hora', type: 'user' },
    { action: 'Stock bajo: Tomates', branch: activeBranches[0]?.name || 'Sucursal 1', time: 'Hace 2 horas', type: 'alert' },
    { action: 'Menú actualizado', branch: activeBranches[0]?.name || 'Sucursal 1', time: 'Hace 3 horas', type: 'menu' },
  ];

  return (
    <div className="p-8 space-y-8 bg-[#F4F7FE] min-h-full">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-secondary tracking-tight">Panel Global</h1>
        <p className="text-text-secondary font-medium mt-1">
          Vista general de todas las sucursales • {new Date().toLocaleDateString('es-AR', { dateStyle: 'full' })}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-[32px] p-6 shadow-card relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
              <div className="flex items-center justify-between relative z-10">
                <div className={`p-4 rounded-2xl bg-gradient-to-br ${stat.color} text-white shadow-lg`}>
                  <Icon size={24} />
                </div>
                <div className="flex items-center gap-1 text-xs font-black px-2 py-1 rounded-full bg-indigo-50 text-indigo-600">
                  <ArrowUpRight size={14} />
                  {stat.change}
                </div>
              </div>
              <div className="mt-6">
                <p className="text-[11px] font-black text-text-secondary uppercase tracking-[0.1em]">{stat.label}</p>
                <p className="text-3xl font-black text-secondary mt-1 tracking-tight">{stat.value}</p>
              </div>
              <div className="absolute right-[-10%] bottom-[-10%] opacity-[0.03] group-hover:scale-110 transition-transform duration-500">
                <Icon size={120} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white rounded-[32px] p-8 shadow-card">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                <Activity size={20} />
              </div>
              <h3 className="text-xl font-black text-secondary tracking-tight">Ingresos por Sucursal</h3>
            </div>
          </div>

          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 700 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                  formatter={(value: number) => [`$${value.toLocaleString('es-AR')}`, 'Ingresos']}
                />
                <Bar dataKey="ingresos" fill="#4f46e5" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
              <Building2 className="text-gray-200" size={48} />
              <p className="text-sm font-medium text-text-secondary">No hay sucursales registradas</p>
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-[32px] p-8 shadow-card">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600">
              <Clock size={20} />
            </div>
            <h3 className="text-xl font-black text-secondary tracking-tight">Actividad Reciente</h3>
          </div>

          <div className="space-y-4">
            {recentActivity.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-2xl hover:bg-gray-50 transition-colors">
                <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-secondary truncate">{item.action}</p>
                  <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mt-0.5">
                    {item.branch} • {item.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
