import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/auth.store';
import { useEffect } from 'react';
import { io } from 'socket.io-client';
import api from '../../api/client';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { Clock, Check, ChefHat } from 'lucide-react';

const ticketStatusColors: Record<string, string> = {
  pending: 'border-red-500 bg-red-50',
  preparing: 'border-yellow-500 bg-yellow-50',
  ready: 'border-green-500 bg-green-50',
};

export function KdsPage() {
  const branchId = useAuthStore((s) => s.user?.branchId);
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const queryClient = useQueryClient();

  // WebSocket Integration for KDS
  useEffect(() => {
    if (!branchId) return;

    const apiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';
    const socket = io(`${apiUrl}/kds`);

    socket.on('connect', () => {
      socket.emit('kds:join-station', {
        branchId,
        stationId: selectedStation || undefined
      });
    });

    socket.on('kds:ticket-new', () => {
      queryClient.invalidateQueries({ queryKey: ['kds-tickets'] });
      // Play a sound if possible
      const audio = new Audio('/notification.mp3');
      audio.play().catch(() => { });
      toast('¡Nuevo Pedido en Cocina!', { icon: '🧑‍🍳' });
    });

    socket.on('kds:ticket-updated', () => {
      queryClient.invalidateQueries({ queryKey: ['kds-tickets'] });
    });

    socket.on('kds:ticket-bumped', () => {
      queryClient.invalidateQueries({ queryKey: ['kds-tickets'] });
    });

    return () => {
      socket.disconnect();
    };
  }, [branchId, selectedStation, queryClient]);

  const { data: stations } = useQuery({
    queryKey: ['kds-stations', branchId],
    queryFn: () => api.get(`/kds/stations?branchId=${branchId}`).then((r) => r.data),
    enabled: !!branchId,
  });

  const { data: tickets } = useQuery({
    queryKey: ['kds-tickets', branchId, selectedStation],
    queryFn: () => {
      const params = new URLSearchParams({ branchId: branchId! });
      if (selectedStation) params.set('stationId', selectedStation);
      return api.get(`/kds/tickets?${params}`).then((r) => r.data);
    },
    enabled: !!branchId,
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/kds/tickets/${id}/status?branchId=${branchId}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kds-tickets'] });
    },
  });

  const bumpTicket = useMutation({
    mutationFn: (id: string) =>
      api.post(`/kds/tickets/${id}/bump?branchId=${branchId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kds-tickets'] });
      toast.success('Ticket completado');
    },
  });

  const activeTickets = tickets?.filter(
    (t: any) => t.status !== 'bumped' && t.status !== 'delivered',
  ) || [];

  const getElapsedMinutes = (createdAt: string) => {
    return Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Station tabs */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setSelectedStation(null)}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${!selectedStation ? 'bg-white text-gray-900' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
        >
          Todas
        </button>
        {stations?.map((station: any) => (
          <button
            key={station.id}
            onClick={() => setSelectedStation(station.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${selectedStation === station.id
              ? 'bg-white text-gray-900'
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
          >
            {station.color && (
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: station.color }} />
            )}
            {station.name}
          </button>
        ))}
      </div>

      {/* Tickets grid */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {activeTickets.map((ticket: any) => {
            const minutes = getElapsedMinutes(ticket.createdAt);
            const isLate = minutes > 15;

            return (
              <div
                key={ticket.id}
                className={`rounded-xl border-l-4 p-4 ${ticketStatusColors[ticket.status] || 'border-gray-300 bg-gray-800'}`}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="font-bold text-lg">#{ticket.order?.orderNumber}</span>
                    {ticket.order?.table && (
                      <span className="ml-2 text-sm text-gray-600">
                        Mesa {ticket.order.table.number}
                      </span>
                    )}
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-medium ${isLate ? 'text-red-600' : 'text-gray-500'}`}>
                    <Clock size={14} />
                    {minutes}m
                  </div>
                </div>

                {/* Station */}
                <div className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                  {ticket.kitchenStation?.color && (
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ticket.kitchenStation.color }} />
                  )}
                  {ticket.kitchenStation?.name}
                </div>

                {/* Items */}
                <div className="space-y-1 mb-3">
                  {ticket.items?.map((item: any) => (
                    <div key={item.id} className="text-sm">
                      <span className="font-medium">
                        {item.orderItem?.quantity}x{' '}
                        {item.orderItem?.productVariant?.product?.name}
                      </span>
                      {item.orderItem?.productVariant?.name !== 'Estándar' && (
                        <span className="text-gray-500 ml-1">
                          ({item.orderItem?.productVariant?.name})
                        </span>
                      )}
                      {item.orderItem?.notes && (
                        <p className="text-xs text-orange-600 italic">{item.orderItem.notes}</p>
                      )}
                      {item.orderItem?.modifiers?.map((m: any) => (
                        <p key={m.id} className="text-xs text-blue-600">{m.modifier?.name}</p>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {ticket.status === 'pending' && (
                    <button
                      onClick={() => updateStatus.mutate({ id: ticket.id, status: 'preparing' })}
                      className="btn-primary flex-1 text-sm py-1.5 flex items-center justify-center gap-1"
                    >
                      <ChefHat size={14} /> Preparar
                    </button>
                  )}
                  {ticket.status === 'preparing' && (
                    <button
                      onClick={() => updateStatus.mutate({ id: ticket.id, status: 'ready' })}
                      className="btn-success flex-1 text-sm py-1.5 flex items-center justify-center gap-1"
                    >
                      <Check size={14} /> Listo
                    </button>
                  )}
                  {ticket.status === 'ready' && (
                    <button
                      onClick={() => bumpTicket.mutate(ticket.id)}
                      className="btn-secondary flex-1 text-sm py-1.5"
                    >
                      Bump
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {activeTickets.length === 0 && (
            <div className="col-span-full text-center py-16 text-gray-500">
              <ChefHat size={48} className="mx-auto mb-4 opacity-50" />
              <p className="text-lg">Sin pedidos pendientes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
