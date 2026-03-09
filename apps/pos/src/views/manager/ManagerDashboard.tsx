import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import api from '../../api/client';
import {
  DollarSign, ShoppingCart, Users, TrendingUp,
  ArrowUpRight, ArrowDownRight, ChefHat, Clock,
  ShoppingBag, UtensilsCrossed, Package, BarChart3
} from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

export function ManagerDashboard() {
  const navigate = useNavigate();
  const branchId = useAuthStore((s) => s.user?.branchId);
  const today = new Date().toISOString().split('T')[0];

  const { data: summary } = useQuery({
    queryKey: ['daily-summary', branchId, today],
    queryFn: () => api.get(`/reports/daily-summary?branchId=${branchId}&date=${today}`).then((r) => r.data),
    enabled: !!branchId,
    refetchInterval: 30000,
  });

  const { data: activeOrders } = useQuery({
    queryKey: ['active-orders', branchId],
    queryFn: () => api.get('/orders?status=open&status=in_progress').then((r) => r.data),
    refetchInterval: 10000,
  });

  const { data: recentOrders } = useQuery({
    queryKey: ['recent-orders-manager', branchId],
    queryFn: () => api.get('/orders?limit=5').then((r) => r.data),
    refetchInterval: 15000,
  });

  const stats = [
    {
      label: 'Ventas del Día',
      value: summary?.sales?.totals?.revenue ? formatCurrency(summary.sales.totals.revenue) : '₲ 0',
      change: '+12.5%', isPositive: true,
      icon: DollarSign, color: 'from-blue-600 to-indigo-600',
    },
    {
      label: 'Pedidos Hoy',
      value: summary?.sales?.totals?.orderCount || 0,
      change: '+5.2%', isPositive: true,
      icon: ShoppingCart, color: 'from-cyan-500 to-blue-500',
    },
    {
      label: 'Ticket Promedio',
      value: summary?.sales?.totals?.averageTicket ? formatCurrency(summary.sales.totals.averageTicket) : '₲ 0',
      change: '-2.1%', isPositive: false,
      icon: TrendingUp, color: 'from-purple-500 to-indigo-500',
    },
    {
      label: 'Pedidos Activos',
      value: activeOrders?.length || 0,
      change: 'En tiempo real',
      isPositive: true,
      icon: Users, color: 'from-orange-400 to-rose-500',
    },
  ];

  const quickActions = [
    { label: 'Punto de Venta', icon: ShoppingBag, path: '/pos', color: 'bg-primary text-white shadow-primary/20' },
    { label: 'Menú Digital', icon: UtensilsCrossed, path: '/admin/menu', color: 'bg-indigo-600 text-white shadow-indigo-200' },
    { label: 'Inventario', icon: Package, path: '/admin/inventory', color: 'bg-emerald-600 text-white shadow-emerald-200' },
    { label: 'Reportes', icon: BarChart3, path: '/admin/reports', color: 'bg-purple-600 text-white shadow-purple-200' },
  ];

  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-8 bg-[#F4F7FE] min-h-full">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-3xl font-black text-secondary tracking-tight">Dashboard Gerente</h1>
        <p className="text-text-secondary font-medium mt-1">
          Resumen de la sucursal • {new Date().toLocaleDateString('es-AR', { dateStyle: 'full' })}
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
                <div className={`flex items-center gap-1 text-xs font-black px-2 py-1 rounded-full ${stat.isPositive ? 'bg-success/10 text-success' : 'bg-rose-50 text-rose-500'}`}>
                  {stat.isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {stat.change}
                </div>
              </div>
              <div className="mt-6">
                <p className="text-[11px] font-black text-text-secondary uppercase tracking-[0.1em]">{stat.label}</p>
                <p className="text-xl md:text-3xl font-black text-secondary mt-1 tracking-tight">{stat.value}</p>
              </div>
              <div className="absolute right-[-10%] bottom-[-10%] opacity-[0.03] group-hover:scale-110 transition-transform duration-500">
                <Icon size={120} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className={`${action.color} rounded-2xl p-5 shadow-lg hover:scale-105 transition-all text-left group`}
            >
              <Icon size={24} className="mb-3 group-hover:scale-110 transition-transform" />
              <p className="text-xs font-black uppercase tracking-widest">{action.label}</p>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
        {/* Top Products */}
        <div className="bg-white rounded-[32px] p-4 md:p-8 shadow-card">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <ChefHat size={20} />
            </div>
            <h3 className="text-xl font-black text-secondary tracking-tight">Productos Top</h3>
          </div>

          <div className="space-y-4">
            {summary?.topProducts && summary.topProducts.length > 0 ? (
              summary.topProducts.slice(0, 5).map((p: any, i: number) => (
                <div key={p.productVariantId} className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-black text-text-secondary">
                      0{i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-black text-secondary">{p.productName}</p>
                      <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{p.quantity} vendidos</p>
                    </div>
                  </div>
                  <p className="text-sm font-black text-primary">{formatCurrency(p.revenue)}</p>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                <Clock className="text-gray-200" size={48} />
                <p className="text-sm font-medium text-text-secondary">Sin datos de ventas</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-[32px] p-4 md:p-8 shadow-card">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
              <ShoppingCart size={20} />
            </div>
            <h3 className="text-xl font-black text-secondary tracking-tight">Últimos Pedidos</h3>
          </div>

          <div className="space-y-3">
            {recentOrders && recentOrders.length > 0 ? (
              recentOrders.map((order: any) => {
                const statusColors: Record<string, string> = {
                  open: 'bg-blue-100 text-blue-700',
                  in_progress: 'bg-orange-100 text-orange-700',
                  ready: 'bg-green-100 text-green-700',
                  closed: 'bg-gray-100 text-gray-600',
                };
                const statusLabels: Record<string, string> = {
                  open: 'Abierto',
                  in_progress: 'En cocina',
                  ready: 'Listo',
                  closed: 'Cerrado',
                };
                return (
                  <div key={order.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 transition-colors">
                    <div>
                      <p className="text-sm font-black text-secondary">#{order.orderNumber}</p>
                      <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">
                        {order.items?.length || 0} items • {new Date(order.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${statusColors[order.status] || 'bg-gray-100 text-gray-600'}`}>
                        {statusLabels[order.status] || order.status}
                      </span>
                      <p className="text-sm font-black text-secondary">{formatCurrency(order.total)}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                <Clock className="text-gray-200" size={48} />
                <p className="text-sm font-medium text-text-secondary">Sin pedidos recientes</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
