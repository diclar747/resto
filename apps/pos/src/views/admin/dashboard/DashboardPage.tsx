import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../stores/auth.store';
import api from '../../../api/client';
import {
  DollarSign, ShoppingCart, Users, TrendingUp, Clock, ChefHat,
} from 'lucide-react';

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
      label: 'Ventas del día',
      value: summary?.sales?.totals?.revenue
        ? `$${Number(summary.sales.totals.revenue).toLocaleString('es-AR')}`
        : '$0',
      icon: DollarSign,
      color: 'bg-green-100 text-green-700',
    },
    {
      label: 'Pedidos hoy',
      value: summary?.sales?.totals?.orderCount || 0,
      icon: ShoppingCart,
      color: 'bg-blue-100 text-blue-700',
    },
    {
      label: 'Ticket promedio',
      value: summary?.sales?.totals?.averageTicket
        ? `$${Number(summary.sales.totals.averageTicket).toLocaleString('es-AR')}`
        : '$0',
      icon: TrendingUp,
      color: 'bg-purple-100 text-purple-700',
    },
    {
      label: 'Pedidos activos',
      value: activeOrders?.length || 0,
      icon: Clock,
      color: 'bg-orange-100 text-orange-700',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Dashboard</h2>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-xl p-5 shadow-sm border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <Icon size={24} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Payment methods breakdown */}
      {summary?.paymentMethods && summary.paymentMethods.length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <h3 className="font-semibold mb-4">Métodos de pago</h3>
          <div className="space-y-3">
            {summary.paymentMethods.map((pm: any) => (
              <div key={pm.method} className="flex items-center justify-between">
                <span className="text-sm font-medium capitalize">{pm.method}</span>
                <div className="flex items-center gap-4">
                  <div className="w-32 bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${pm.percentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold w-24 text-right">
                    ${Number(pm.total).toLocaleString('es-AR')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top products */}
      {summary?.topProducts && summary.topProducts.length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-sm border">
          <h3 className="font-semibold mb-4">Productos más vendidos</h3>
          <div className="space-y-2">
            {summary.topProducts.slice(0, 10).map((p: any, i: number) => (
              <div key={p.productVariantId} className="flex items-center justify-between py-1">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-400 w-6">{i + 1}.</span>
                  <span className="text-sm font-medium">{p.productName}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500">{p.quantity} uds</span>
                  <span className="text-sm font-bold">
                    ${Number(p.revenue).toLocaleString('es-AR')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
