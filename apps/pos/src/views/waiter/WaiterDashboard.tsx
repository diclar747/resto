import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/auth.store';
import api from '../../api/client';
import { Clock, AlertCircle, CheckCircle, ChefHat } from 'lucide-react';

const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
  open: { color: 'bg-blue-100 text-blue-700', icon: Clock, label: 'Abierta' },
  in_progress: { color: 'bg-orange-100 text-orange-700', icon: ChefHat, label: 'En cocina' },
  ready: { color: 'bg-green-100 text-green-700', icon: CheckCircle, label: 'Lista' },
};

export function WaiterDashboard() {
  const branchId = useAuthStore((s) => s.user?.branchId);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['waiter-orders', branchId],
    queryFn: () =>
      api.get(`/orders?status=open&status=in_progress&status=ready`).then((r) => r.data),
    refetchInterval: 3000,
  });

  const { data: tables } = useQuery({
    queryKey: ['tables', branchId],
    queryFn: () => api.get(`/tables?branchId=${branchId}`).then((r) => r.data),
    enabled: !!branchId,
    refetchInterval: 5000,
  });

  const activeOrders = orders?.filter(
    (o: any) => o.status !== 'closed' && o.status !== 'cancelled' && o.status !== 'void',
  ) || [];

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Dashboard Camarero</h2>

      {/* Alerts */}
      {tables?.filter((t: any) => t.status === 'bill_requested').length > 0 && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3">
          <AlertCircle className="text-blue-600" size={24} />
          <div>
            <p className="font-medium text-blue-800">Cuenta solicitada</p>
            <p className="text-sm text-blue-600">
              Mesa(s):{' '}
              {tables
                .filter((t: any) => t.status === 'bill_requested')
                .map((t: any) => t.number)
                .join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Active orders */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeOrders.map((order: any) => {
          const config = statusConfig[order.status] || statusConfig.open;
          const Icon = config.icon;
          return (
            <div key={order.id} className="card">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="font-bold text-lg">#{order.orderNumber}</span>
                  {order.table && (
                    <span className="ml-2 text-gray-500">Mesa {order.table.number}</span>
                  )}
                </div>
                <span className={`badge ${config.color}`}>
                  <Icon size={14} className="mr-1" />
                  {config.label}
                </span>
              </div>

              <div className="space-y-1">
                {order.items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>
                      {item.quantity}x {item.productVariant?.product?.name}
                      <span className="text-gray-400 ml-1">({item.productVariant?.name})</span>
                    </span>
                    <span
                      className={`text-xs ${
                        item.status === 'ready'
                          ? 'text-green-600 font-medium'
                          : item.status === 'preparing'
                          ? 'text-orange-600'
                          : 'text-gray-400'
                      }`}
                    >
                      {item.status === 'ready' ? 'Listo' : item.status === 'preparing' ? 'Preparando' : ''}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-3 pt-3 border-t flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {new Date(order.createdAt).toLocaleTimeString('es-AR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <span className="font-bold">${Number(order.total).toLocaleString('es-AR')}</span>
              </div>
            </div>
          );
        })}

        {activeOrders.length === 0 && !isLoading && (
          <div className="col-span-full text-center py-12 text-gray-400">
            No hay pedidos activos
          </div>
        )}
      </div>
    </div>
  );
}
