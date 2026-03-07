import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { ArrowLeft, Clock, ChefHat, CheckCircle, Package, Utensils, Receipt } from 'lucide-react';

const statusConfig: Record<string, { icon: any; label: string; color: string; bgColor: string }> = {
  pending: { icon: Clock, label: 'En Cola', color: 'text-gray-400', bgColor: 'bg-gray-100' },
  sent: { icon: Package, label: 'Recibido', color: 'text-[var(--primary)]', bgColor: 'bg-[var(--primary-light)]' },
  preparing: { icon: ChefHat, label: 'En Cocina', color: 'text-orange-500', bgColor: 'bg-orange-50' },
  ready: { icon: Utensils, label: 'Listo p/ Servir', color: 'text-[var(--success)]', bgColor: 'bg-[#E6F9F4]' },
  delivered: { icon: CheckCircle, label: 'Entregado', color: 'text-[var(--secondary)]', bgColor: 'bg-gray-100' },
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
    <div className="min-h-screen bg-[var(--background)] pb-20">
      {/* Premium Header */}
      <div className="sticky top-0 z-30 p-4">
        <div className="mobile-glass flex items-center gap-4 !p-5 shadow-xl">
          <button
            onClick={() => navigate(`/mesa/${tableCode}`)}
            className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-[var(--secondary)] border border-gray-100 shadow-sm active:scale-95 transition-all"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Seguimiento</p>
            <h1 className="text-lg font-black text-[var(--secondary)] tracking-tight">Tu Pedido</h1>
          </div>
        </div>
      </div>

      <div className="px-5 space-y-6 pt-2">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-[var(--primary)]/10 border-t-[var(--primary)] rounded-full animate-spin mb-4" />
            <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Sincronizando...</p>
          </div>
        )}

        {orders?.map((order: any) => (
          <div key={order.id} className="mobile-card !p-6 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-[0.03]">
              <Receipt size={80} />
            </div>

            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Orden #{order.orderNumber}</p>
                <p className="text-xs font-bold text-[var(--secondary)]">
                  {new Date(order.createdAt).toLocaleTimeString('es-AR', {
                    hour: '2-digit', minute: '2-digit',
                  })} hs
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Total</p>
                <p className="text-xl font-black text-[var(--primary)] tracking-tight">${Number(order.total).toLocaleString('es-AR')}</p>
              </div>
            </div>

            <div className="space-y-4 relative z-10">
              {order.items?.map((item: any) => {
                const config = statusConfig[item.status] || statusConfig.pending;
                const Icon = config.icon;
                return (
                  <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-[24px] border border-transparent hover:border-gray-100 transition-all">
                    <div className={`w-12 h-12 ${config.bgColor} ${config.color} rounded-2xl flex items-center justify-center shadow-sm`}>
                      <Icon size={20} className={item.status === 'preparing' ? 'animate-pulse' : ''} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-black text-[var(--secondary)] leading-tight">
                        {item.quantity}x {item.productVariant?.product?.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-black uppercase tracking-widest ${config.color}`}>
                          {config.label}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        {orders?.length === 0 && !isLoading && (
          <div className="text-center py-20 px-10">
            <div className="w-20 h-20 bg-white rounded-[32px] shadow-xl flex items-center justify-center mx-auto mb-6 text-gray-200">
              <Clock size={32} />
            </div>
            <h3 className="text-xl font-black text-[var(--secondary)] tracking-tight mb-2">Sin Pedidos Activos</h3>
            <p className="text-xs font-medium text-[var(--text-secondary)] leading-relaxed mb-8">
              Aún no has enviado nada a cocina. ¡Explora nuestro menú y comienza una experiencia gastronómica!
            </p>
            <button
              onClick={() => navigate(`/mesa/${tableCode}`)}
              className="btn-mobile-primary"
            >
              IR AL MENÚ
            </button>
          </div>
        )}
      </div>

      {/* Helpful Tip */}
      {!isLoading && orders?.length > 0 && (
        <div className="px-8 mt-10">
          <div className="bg-[var(--primary)]/5 p-6 rounded-[32px] border border-[var(--primary)]/10 border-dashed">
            <p className="text-[10px] font-black text-[var(--primary)] uppercase tracking-widest mb-2 text-center">Tip de Experiencia</p>
            <p className="text-[11px] font-medium text-[var(--text-secondary)] text-center leading-relaxed">
              Esta página se actualiza automáticamente. Te notificaremos cuando tu plato esté listo para servir.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
