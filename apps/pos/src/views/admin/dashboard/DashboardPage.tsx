import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../stores/auth.store';
import api from '../../../api/client';
import {
  DollarSign, ShoppingCart, Users, TrendingUp, Clock, ArrowUpRight,
  ArrowDownRight, Wallet, Filter, Calendar, ChefHat
} from 'lucide-react';
import { formatCurrency } from '../../../utils/currency';

export function DashboardPage() {
  const branchId = useAuthStore((s) => s.user?.branchId);
  const today = new Date().toISOString().split('T')[0];

  const { data: summary } = useQuery({
    queryKey: ['daily-summary', branchId, today],
    queryFn: () =>
      api.get(`/reports/daily-summary?branchId=${branchId}&date=${today}`).then((r) => r.data),
    enabled: !!branchId,
    refetchInterval: 30000,
  });

  const { data: activeOrders } = useQuery({
    queryKey: ['active-orders-count', branchId],
    queryFn: () =>
      api.get(`/orders?status=open&status=in_progress`).then((r) => r.data),
    refetchInterval: 10000,
  });

  const stats = [
    {
      label: 'Ventas Netas',
      value: summary?.sales?.totals?.revenue
        ? formatCurrency(summary.sales.totals.revenue)
        : '₲ 0',
      change: '+12.5%',
      isPositive: true,
      icon: DollarSign,
      color: 'from-blue-600 to-indigo-600',
    },
    {
      label: 'Pedidos del Día',
      value: summary?.sales?.totals?.orderCount || 0,
      change: '+5.2%',
      isPositive: true,
      icon: ShoppingCart,
      color: 'from-cyan-500 to-blue-500',
    },
    {
      label: 'Ticket Promedio',
      value: summary?.sales?.totals?.averageTicket
        ? formatCurrency(summary.sales.totals.averageTicket)
        : '₲ 0',
      change: '-2.1%',
      isPositive: false,
      icon: TrendingUp,
      color: 'from-purple-500 to-indigo-500',
    },
    {
      label: 'Comensales Activos',
      value: activeOrders?.length || 0,
      change: '+8',
      isPositive: true,
      icon: Users,
      color: 'from-orange-400 to-rose-500',
    },
  ];

  return (
    <div className="p-8 space-y-8 bg-[#F4F7FE] min-h-full">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-secondary tracking-tight">Dashboard General</h1>
          <p className="text-text-secondary font-medium mt-1">Sincronización en tiempo real • {new Date().toLocaleDateString('es-AR', { dateStyle: 'full' })}</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white text-secondary rounded-xl font-bold text-xs shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <Filter size={14} /> Filtros Avanzados
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-bold text-xs shadow-lg shadow-primary/20 hover:scale-105 transition-all">
            <Calendar size={14} /> Exportar Reporte
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-[32px] p-6 shadow-card border-none relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
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
                <p className="text-3xl font-black text-secondary mt-1 tracking-tight">{stat.value}</p>
              </div>
              <div className="absolute right-[-10%] bottom-[-10%] opacity-[0.03] group-hover:scale-110 transition-transform duration-500">
                <Icon size={120} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Payment Methods Breakdown */}
        <div className="bg-white rounded-[32px] p-8 shadow-card border-none">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-success/10 rounded-xl flex items-center justify-center text-success">
                <Wallet size={20} />
              </div>
              <h3 className="text-xl font-black text-secondary tracking-tight">Distribución de Pagos</h3>
            </div>
            <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Ver Detalle</button>
          </div>

          <div className="space-y-6">
            {summary?.paymentMethods && summary.paymentMethods.length > 0 ? (
              summary.paymentMethods.map((pm: any) => (
                <div key={pm.method} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-secondary uppercase tracking-wider">{pm.method}</span>
                    <span className="text-sm font-black text-secondary">{formatCurrency(pm.total)}</span>
                  </div>
                  <div className="w-full bg-gray-50 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-primary to-blue-400 h-3 rounded-full shadow-sm transition-all duration-1000"
                      style={{ width: `${pm.percentage}%` }}
                    />
                  </div>
                  <div className="flex justify-end">
                    <span className="text-[10px] font-bold text-text-secondary uppercase">{pm.percentage}% del total</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                <Clock className="text-gray-200" size={48} />
                <p className="text-sm font-medium text-text-secondary">Sin transacciones registradas hoy</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="bg-white rounded-[32px] p-8 shadow-card border-none">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <ChefHat size={20} />
              </div>
              <h3 className="text-xl font-black text-secondary tracking-tight">Productos Top Hoy</h3>
            </div>
            <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Auditoría Total</button>
          </div>

          <div className="space-y-4">
            {summary?.topProducts && summary.topProducts.length > 0 ? (
              summary.topProducts.slice(0, 6).map((p: any, i: number) => (
                <div key={p.productVariantId} className="group flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-[10px] font-black text-text-secondary group-hover:bg-primary group-hover:text-white transition-colors">
                      0{i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-black text-secondary leading-tight">{p.productName}</p>
                      <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest mt-0.5">{p.quantity} Unidades Vendidas</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-primary">{formatCurrency(p.revenue)}</p>
                    <p className="text-[10px] font-bold text-success uppercase tracking-wider">Altos Márgenes</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                <Clock className="text-gray-200" size={48} />
                <p className="text-sm font-medium text-text-secondary">Aún no hay ventas para analizar</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
