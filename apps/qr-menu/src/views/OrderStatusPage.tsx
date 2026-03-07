import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { ArrowLeft, Clock, ChefHat, CheckCircle } from 'lucide-react';

const statusConfig: Record<string, { icon: any; label: string; color: string }> = {
  pending: { icon: Clock, label: 'Pendiente', color: 'text-gray-500 bg-gray-100' },
  sent: { icon: Clock, label: 'Enviado', color: 'text-blue-600 bg-blue-100' },
  preparing: { icon: ChefHat, label: 'Preparando', color: 'text-orange-600 bg-orange-100' },
  ready: { icon: CheckCircle, label: 'Listo', color: 'text-green-600 bg-green-100' },
  delivered: { icon: CheckCircle, label: 'Entregado', color: 'text-green-700 bg-green-200' },
};

export function OrderStatusPage() {
  const { tableCode } = useParams<{ tableCode: string }>();
  const navigate = useNavigate();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['qr-order-status', tableCode],
    queryFn: () => api.get(`/qr/${tableCode}/status`).then((r) => r.data),
    enabled: !!tableCode,
    refetchInterval: 5000,
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-blue-700 text-white px-4 py-4 flex items-center gap-3">
        <button onClick={() => navigate(`/mesa/${tableCode}`)}>
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-lg font-bold">Estado de tu pedido</h1>
      </div>

      <div className="p-4 space-y-4">
        {isLoading && (
          <div className="text-center py-8 text-gray-400">Cargando...</div>
        )}

        {orders?.map((order: any) => (
          <div key={order.id} className="bg-white rounded-xl p-4 shadow-sm border">
            <div className="flex items-center justify-between mb-3">
              <span className="font-bold">Pedido #{order.orderNumber}</span>
              <span className="text-sm text-gray-500">
                {new Date(order.createdAt).toLocaleTimeString('es-AR', {
                  hour: '2-digit', minute: '2-digit',
                })}
              </span>
            </div>

            <div className="space-y-2">
              {order.items?.map((item: any) => {
                const config = statusConfig[item.status] || statusConfig.pending;
                const Icon = config.icon;
                return (
                  <div key={item.id} className="flex items-center justify-between py-1.5">
                    <div>
                      <span className="font-medium">
                        {item.quantity}x {item.productVariant?.product?.name}
                      </span>
                      {item.productVariant?.name !== 'Estándar' && (
                        <span className="text-gray-500 text-sm ml-1">
                          ({item.productVariant?.name})
                        </span>
                      )}
                    </div>
                    <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium ${config.color}`}>
                      <Icon size={12} />
                      {config.label}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="mt-3 pt-3 border-t flex justify-between">
              <span className="text-sm text-gray-500">Total</span>
              <span className="font-bold">${Number(order.total).toLocaleString('es-AR')}</span>
            </div>
          </div>
        ))}

        {orders?.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Clock size={48} className="mx-auto mb-3 opacity-50" />
            <p>No hay pedidos activos</p>
            <button
              onClick={() => navigate(`/mesa/${tableCode}`)}
              className="btn-primary mt-4"
            >
              Ver menú
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
