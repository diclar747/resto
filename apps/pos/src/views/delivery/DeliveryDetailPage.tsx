import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import toast from 'react-hot-toast';
import {
  ArrowLeft, MapPin, Phone, User, Package,
  CheckCircle, Bike, Clock, Navigation, Receipt
} from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

const steps = [
  { key: 'assigned', label: 'Asignado', icon: Package },
  { key: 'picked_up', label: 'Recogido', icon: CheckCircle },
  { key: 'in_transit', label: 'En Camino', icon: Bike },
  { key: 'delivered', label: 'Entregado', icon: CheckCircle },
];

const stepOrder = ['assigned', 'picked_up', 'in_transit', 'delivered'];

export function DeliveryDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: delivery, isLoading } = useQuery({
    queryKey: ['delivery', id],
    queryFn: () => api.get(`/delivery/${id}`).then((r) => r.data),
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: (status: string) => api.patch(`/delivery/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['delivery', id] });
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      toast.success('Estado actualizado');
    },
    onError: () => toast.error('Error al actualizar'),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-full">
        <div className="w-8 h-8 border-3 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full p-6 text-center">
        <Package className="text-gray-200 mb-3" size={48} />
        <p className="text-text-secondary font-medium">Entrega no encontrada</p>
        <button onClick={() => navigate('/delivery')} className="mt-4 text-purple-600 font-bold text-sm">Volver</button>
      </div>
    );
  }

  const currentStepIndex = stepOrder.indexOf(delivery.status);

  const getNextStatus = () => {
    const flow: Record<string, string> = {
      assigned: 'picked_up',
      picked_up: 'in_transit',
      in_transit: 'delivered',
    };
    return flow[delivery.status];
  };

  const getActionLabel = () => {
    const labels: Record<string, string> = {
      assigned: 'Marcar como Recogido',
      picked_up: 'Marcar En Camino',
      in_transit: 'Marcar como Entregado',
    };
    return labels[delivery.status] || '';
  };

  const getActionColor = () => {
    const colors: Record<string, string> = {
      assigned: 'bg-indigo-600 shadow-indigo-200',
      picked_up: 'bg-purple-600 shadow-purple-200',
      in_transit: 'bg-emerald-600 shadow-emerald-200',
    };
    return colors[delivery.status] || 'bg-gray-600';
  };

  const mapsUrl = delivery.deliveryAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(delivery.deliveryAddress)}`
    : null;

  return (
    <div className="p-6 space-y-6 min-h-full pb-24">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/delivery')}
          className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-gray-400 hover:text-secondary transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-xl font-black text-secondary tracking-tight">
            Pedido #{delivery.order?.orderNumber || delivery.orderId?.slice(-6)}
          </h1>
          <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Detalle de entrega</p>
        </div>
      </div>

      {/* Status Timeline */}
      <div className="bg-white rounded-[32px] p-6 shadow-card">
        <h3 className="text-sm font-black text-secondary uppercase tracking-widest mb-6">Estado de Entrega</h3>

        <div className="flex items-center justify-between relative">
          {/* Progress Line */}
          <div className="absolute top-5 left-0 right-0 h-1 bg-gray-100 mx-10">
            <div
              className="h-1 bg-purple-600 transition-all duration-500"
              style={{ width: `${Math.max(0, (currentStepIndex / (steps.length - 1)) * 100)}%` }}
            />
          </div>

          {steps.map((step, i) => {
            const Icon = step.icon;
            const isCompleted = i <= currentStepIndex;
            const isCurrent = i === currentStepIndex;
            return (
              <div key={step.key} className="flex flex-col items-center relative z-10">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isCompleted
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-200'
                    : 'bg-gray-100 text-gray-400'
                } ${isCurrent ? 'ring-4 ring-purple-100 scale-110' : ''}`}>
                  <Icon size={18} />
                </div>
                <p className={`text-[10px] font-black uppercase tracking-widest mt-2 ${isCompleted ? 'text-purple-600' : 'text-gray-400'}`}>
                  {step.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Customer Info */}
      <div className="bg-white rounded-[32px] p-6 shadow-card space-y-4">
        <h3 className="text-sm font-black text-secondary uppercase tracking-widest">Información del Cliente</h3>

        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600">
            <User size={18} />
          </div>
          <div>
            <p className="font-black text-secondary">{delivery.customerName || 'Cliente'}</p>
            <p className="text-xs text-text-secondary">Cliente</p>
          </div>
        </div>

        {delivery.customerPhone && (
          <a href={`tel:${delivery.customerPhone}`} className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
              <Phone size={18} />
            </div>
            <div>
              <p className="font-bold text-secondary">{delivery.customerPhone}</p>
              <p className="text-xs text-text-secondary">Tocar para llamar</p>
            </div>
          </a>
        )}

        {delivery.deliveryAddress && (
          <div className="p-3 bg-gray-50 rounded-2xl">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <MapPin size={18} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-secondary">{delivery.deliveryAddress}</p>
                {mapsUrl && (
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2 text-xs font-black text-purple-600 uppercase tracking-widest hover:underline"
                  >
                    <Navigation size={12} /> Abrir en Maps
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-[32px] p-6 shadow-card">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
            <Receipt size={18} />
          </div>
          <h3 className="text-sm font-black text-secondary uppercase tracking-widest">Detalle del Pedido</h3>
        </div>

        <div className="space-y-3">
          {delivery.order?.items?.map((item: any) => (
            <div key={item.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 transition-colors">
              <div>
                <p className="text-sm font-bold text-secondary">
                  {item.quantity}x {item.productVariant?.product?.name || 'Producto'}
                </p>
                {item.productVariant?.name && (
                  <p className="text-xs text-text-secondary">{item.productVariant.name}</p>
                )}
                {item.notes && (
                  <p className="text-xs text-orange-600 mt-0.5">Nota: {item.notes}</p>
                )}
              </div>
              <p className="text-sm font-black text-secondary">{formatCurrency(item.subtotal || 0)}</p>
            </div>
          )) || (
            <p className="text-sm text-text-secondary text-center py-4">Sin items disponibles</p>
          )}
        </div>

        {delivery.order?.total && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm font-black text-secondary uppercase tracking-widest">Total</span>
            <span className="text-xl font-black text-primary">{formatCurrency(delivery.order.total)}</span>
          </div>
        )}
      </div>

      {/* Timestamps */}
      <div className="bg-white rounded-[32px] p-6 shadow-card">
        <h3 className="text-sm font-black text-secondary uppercase tracking-widest mb-4">Tiempos</h3>
        <div className="space-y-2">
          {delivery.assignedAt && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary font-medium flex items-center gap-2"><Clock size={14} /> Asignado</span>
              <span className="font-bold text-secondary">{new Date(delivery.assignedAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          )}
          {delivery.pickedUpAt && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary font-medium flex items-center gap-2"><Clock size={14} /> Recogido</span>
              <span className="font-bold text-secondary">{new Date(delivery.pickedUpAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          )}
          {delivery.deliveredAt && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-text-secondary font-medium flex items-center gap-2"><Clock size={14} /> Entregado</span>
              <span className="font-bold text-secondary">{new Date(delivery.deliveredAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Button */}
      {getNextStatus() && (
        <div className="fixed bottom-20 left-4 right-4 z-30">
          <button
            onClick={() => updateStatusMutation.mutate(getNextStatus()!)}
            disabled={updateStatusMutation.isPending}
            className={`w-full py-4 ${getActionColor()} text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50`}
          >
            {updateStatusMutation.isPending ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
            ) : (
              getActionLabel()
            )}
          </button>
        </div>
      )}
    </div>
  );
}
