import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import api from '../../api/client';
import {
  ShoppingCart, DollarSign, Receipt, CreditCard,
  Clock, ArrowUpRight, Wallet, TrendingUp
} from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

export function CashierDashboard() {
  const navigate = useNavigate();
  const branchId = useAuthStore((s) => s.user?.branchId);
  const today = new Date().toISOString().split('T')[0];

  const { data: summary } = useQuery({
    queryKey: ['daily-summary', branchId, today],
    queryFn: () => api.get(`/reports/daily-summary?branchId=${branchId}&date=${today}`).then((r) => r.data),
    enabled: !!branchId,
    refetchInterval: 30000,
  });

  const { data: recentOrders } = useQuery({
    queryKey: ['recent-orders', branchId],
    queryFn: () => api.get('/orders?status=closed&limit=10').then((r) => r.data),
    refetchInterval: 15000,
  });

  const revenue = summary?.sales?.totals?.revenue || 0;
  const orderCount = summary?.sales?.totals?.orderCount || 0;
  const avgTicket = summary?.sales?.totals?.averageTicket || 0;

  const stats = [
    { label: 'Ventas del Turno', value: formatCurrency(revenue), icon: DollarSign, color: 'from-blue-600 to-indigo-600' },
    { label: 'Pedidos Procesados', value: orderCount, icon: Receipt, color: 'from-cyan-500 to-blue-500' },
    { label: 'Ticket Promedio', value: formatCurrency(avgTicket), icon: TrendingUp, color: 'from-purple-500 to-indigo-500' },
  ];

  return (
    <div className="p-8 space-y-8 bg-background min-h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-secondary tracking-tight">Dashboard Cajero</h1>
          <p className="text-text-secondary font-medium mt-1">
            Resumen de tu turno • {new Date().toLocaleDateString('es-AR', { dateStyle: 'full' })}
          </p>
        </div>
      </div>

      {/* Big POS Button */}
      <button
        onClick={() => navigate('/pos')}
        className="w-full bg-gradient-to-r from-primary to-blue-500 text-white rounded-[32px] p-8 shadow-xl shadow-primary/20 hover:scale-[1.01] transition-transform duration-300 group"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
              <ShoppingCart size={32} />
            </div>
            <div className="text-left">
              <h2 className="text-2xl font-black tracking-tight">Abrir Punto de Venta</h2>
              <p className="text-white/70 font-bold text-sm mt-1 uppercase tracking-widest">Registrar nueva venta</p>
            </div>
          </div>
          <ArrowUpRight size={32} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
        </div>
      </button>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white dark:bg-surface rounded-[32px] p-6 shadow-card relative overflow-hidden group hover:scale-[1.02] transition-transform duration-300">
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-2xl bg-gradient-to-br ${stat.color} text-white shadow-lg`}>
                  <Icon size={24} />
                </div>
                <div>
                  <p className="text-[11px] font-black text-text-secondary uppercase tracking-[0.1em]">{stat.label}</p>
                  <p className="text-2xl font-black text-secondary tracking-tight">{stat.value}</p>
                </div>
              </div>
              <div className="absolute right-[-10%] bottom-[-10%] opacity-[0.03] group-hover:scale-110 transition-transform duration-500">
                <Icon size={100} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Payment Methods */}
        <div className="bg-white dark:bg-surface rounded-[32px] p-8 shadow-card">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
              <Wallet size={20} />
            </div>
            <h3 className="text-xl font-black text-secondary tracking-tight">Métodos de Pago</h3>
          </div>

          <div className="space-y-5">
            {summary?.paymentMethods && summary.paymentMethods.length > 0 ? (
              summary.paymentMethods.map((pm: any) => (
                <div key={pm.method} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-secondary uppercase tracking-wider">{pm.method}</span>
                    <span className="text-sm font-black text-secondary">{formatCurrency(pm.total)}</span>
                  </div>
                  <div className="w-full bg-gray-50 dark:bg-white/5 rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-primary to-blue-400 h-3 rounded-full" style={{ width: `${pm.percentage}%` }} />
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                <CreditCard className="text-gray-200 dark:text-white/15" size={48} />
                <p className="text-sm font-medium text-text-secondary">Sin transacciones aún</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white dark:bg-surface rounded-[32px] p-8 shadow-card">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
              <Receipt size={20} />
            </div>
            <h3 className="text-xl font-black text-secondary tracking-tight">Últimas Ventas</h3>
          </div>

          <div className="space-y-3">
            {recentOrders && recentOrders.length > 0 ? (
              recentOrders.slice(0, 8).map((order: any) => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center">
                      <Receipt size={14} className="text-gray-500 dark:text-white/40" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-secondary">#{order.orderNumber}</p>
                      <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">
                        {order.items?.length || 0} items • {order.orderType === 'dine_in' ? 'Mesa' : order.orderType === 'takeaway' ? 'Para llevar' : 'Delivery'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-primary">{formatCurrency(order.total)}</p>
                    <p className="text-[10px] font-bold text-text-secondary flex items-center gap-1 justify-end">
                      <Clock size={10} />
                      {new Date(order.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                <Clock className="text-gray-200 dark:text-white/15" size={48} />
                <p className="text-sm font-medium text-text-secondary">No hay ventas registradas hoy</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
