import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import api from '../../api/client';
import toast from 'react-hot-toast';
import {
  Package, Bike, CheckCircle, Clock, MapPin,
  Phone, ArrowRight, User
} from 'lucide-react';

const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Pendiente' },
  assigned: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Asignado' },
  picked_up: { bg: 'bg-indigo-100', text: 'text-indigo-700', label: 'Recogido' },
  in_transit: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'En camino' },
  delivered: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Entregado' },
  cancelled: { bg: 'bg-rose-100', text: 'text-rose-700', label: 'Cancelado' },
};

export function DeliveryDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  const { data: deliveries, isLoading } = useQuery({
    queryKey: ['deliveries'],
    queryFn: () => api.get('/delivery').then((r) => r.data),
    refetchInterval: 5000,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/delivery/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      toast.success('Estado actualizado');
    },
    onError: () => toast.error('Error al actualizar estado'),
  });

  const acceptMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/delivery/${id}/assign`, { driverId: userId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      toast.success('Entrega aceptada');
    },
    onError: () => toast.error('Error al aceptar entrega'),
  });

  const allDeliveries = deliveries || [];
  const pending = allDeliveries.filter((d: any) => d.status === 'pending' || (d.status === 'assigned' && d.driverId === userId));
  const active = allDeliveries.find((d: any) =>
    d.driverId === userId && ['picked_up', 'in_transit'].includes(d.status)
  );
  const completedToday = allDeliveries.filter((d: any) => {
    if (d.status !== 'delivered' || d.driverId !== userId) return false;
    const today = new Date().toDateString();
    return new Date(d.deliveredAt || d.updatedAt).toDateString() === today;
  });

  const stats = [
    { label: 'Pendientes', value: pending.length, icon: Package, color: 'from-yellow-500 to-orange-500' },
    { label: 'En Curso', value: active ? 1 : 0, icon: Bike, color: 'from-purple-500 to-indigo-500' },
    { label: 'Completadas', value: completedToday.length, icon: CheckCircle, color: 'from-emerald-500 to-teal-500' },
  ];

  const getNextStatus = (current: string) => {
    const flow: Record<string, string> = {
      assigned: 'picked_up',
      picked_up: 'in_transit',
      in_transit: 'delivered',
    };
    return flow[current];
  };

  const getActionLabel = (status: string) => {
    const labels: Record<string, string> = {
      assigned: 'Marcar Recogido',
      picked_up: 'En Camino',
      in_transit: 'Marcar Entregado',
    };
    return labels[status] || '';
  };

  return (
    <div className="p-6 space-y-6 min-h-full">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-2xl p-4 shadow-card text-center">
              <div className={`w-10 h-10 mx-auto rounded-xl bg-gradient-to-br ${stat.color} text-white flex items-center justify-center shadow-lg mb-2`}>
                <Icon size={20} />
              </div>
              <p className="text-2xl font-black text-secondary">{stat.value}</p>
              <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Active Delivery */}
      {active && (
        <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-[32px] p-6 text-white shadow-xl shadow-purple-200">
          <div className="flex items-center gap-2 mb-4">
            <Bike size={20} />
            <h3 className="font-black uppercase tracking-widest text-sm">Entrega Activa</h3>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 space-y-3 mb-4">
            <div className="flex items-center gap-2">
              <User size={16} />
              <span className="font-bold">{active.customerName || 'Cliente'}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin size={16} />
              <span className="font-medium text-sm">{active.deliveryAddress || 'Sin dirección'}</span>
            </div>
            {active.customerPhone && (
              <a href={`tel:${active.customerPhone}`} className="flex items-center gap-2 text-white/80 hover:text-white">
                <Phone size={16} />
                <span className="font-medium text-sm">{active.customerPhone}</span>
              </a>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate(`/delivery/${active.id}`)}
              className="flex-1 py-3 bg-white/20 backdrop-blur-sm rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/30 transition-all text-center"
            >
              Ver Detalle
            </button>
            {getNextStatus(active.status) && (
              <button
                onClick={() => updateStatusMutation.mutate({ id: active.id, status: getNextStatus(active.status)! })}
                className="flex-1 py-3 bg-white text-purple-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all text-center"
              >
                {getActionLabel(active.status)}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Pending Deliveries */}
      <div>
        <h3 className="text-lg font-black text-secondary tracking-tight mb-4">Entregas Pendientes</h3>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-3 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
          </div>
        ) : pending.length > 0 ? (
          <div className="space-y-3">
            {pending.map((delivery: any) => {
              const style = statusStyles[delivery.status] || statusStyles.pending;
              return (
                <div key={delivery.id} className="bg-white rounded-2xl p-5 shadow-card hover:scale-[1.01] transition-transform">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-black text-secondary">
                        Pedido #{delivery.order?.orderNumber || delivery.orderId?.slice(-6)}
                      </p>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest mt-1 ${style.bg} ${style.text}`}>
                        {style.label}
                      </span>
                    </div>
                    {delivery.estimatedTime && (
                      <span className="flex items-center gap-1 text-xs font-bold text-text-secondary">
                        <Clock size={12} /> {delivery.estimatedTime} min
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <User size={14} className="shrink-0" />
                      <span>{delivery.customerName || 'Cliente'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <MapPin size={14} className="shrink-0" />
                      <span className="truncate">{delivery.deliveryAddress || 'Sin dirección'}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/delivery/${delivery.id}`)}
                      className="flex-1 py-2.5 bg-gray-100 text-secondary rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                    >
                      Detalle <ArrowRight size={14} />
                    </button>
                    {delivery.status === 'pending' && (
                      <button
                        onClick={() => acceptMutation.mutate(delivery.id)}
                        className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-purple-200 hover:scale-105 transition-all"
                      >
                        Aceptar
                      </button>
                    )}
                    {delivery.status === 'assigned' && delivery.driverId === userId && (
                      <button
                        onClick={() => updateStatusMutation.mutate({ id: delivery.id, status: 'picked_up' })}
                        className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-purple-200 hover:scale-105 transition-all"
                      >
                        Recoger
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-12 shadow-card text-center">
            <Package className="mx-auto text-gray-200 mb-3" size={48} />
            <p className="text-sm font-medium text-text-secondary">No hay entregas pendientes</p>
          </div>
        )}
      </div>

      {/* Completed Today */}
      {completedToday.length > 0 && (
        <div>
          <h3 className="text-lg font-black text-secondary tracking-tight mb-4">Completadas Hoy</h3>
          <div className="space-y-2">
            {completedToday.map((delivery: any) => (
              <div key={delivery.id} className="bg-white rounded-2xl p-4 shadow-card flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle size={16} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-secondary">#{delivery.order?.orderNumber || delivery.orderId?.slice(-6)}</p>
                    <p className="text-[10px] font-bold text-text-secondary">{delivery.customerName}</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-text-secondary">
                  {new Date(delivery.deliveredAt || delivery.updatedAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
