import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/auth.store';
import { useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import api from '../../api/client';
import toast from 'react-hot-toast';
import {
  Clock, Check, ChefHat, Bell, X, MapPin, Truck,
  UtensilsCrossed, AlertTriangle, Volume2, VolumeX
} from 'lucide-react';

interface NewOrderAlert {
  ticket: any;
  id: string;
}

const ticketStatusColors: Record<string, string> = {
  pending: 'border-red-500 bg-red-50',
  preparing: 'border-amber-500 bg-amber-50',
  ready: 'border-green-500 bg-green-50',
};

const ticketStatusLabels: Record<string, string> = {
  pending: 'Nuevo',
  preparing: 'Preparando',
  ready: 'Listo',
};

export function KdsPage() {
  const branchId = useAuthStore((s) => s.user?.branchId);
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [newOrderAlerts, setNewOrderAlerts] = useState<NewOrderAlert[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const queryClient = useQueryClient();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Create audio element for notifications
  useEffect(() => {
    audioRef.current = new Audio('/notification.mp3');
    audioRef.current.volume = 0.7;
    return () => { audioRef.current = null; };
  }, []);

  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return;
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
    }
  }, [soundEnabled]);

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

    socket.on('kds:ticket-new', (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['kds-tickets'] });
      playNotificationSound();
      setUnreadCount(prev => prev + 1);

      // If we receive ticket data from socket, show alert immediately
      if (data?.ticket || data?.id) {
        const alertId = `alert-${Date.now()}-${Math.random()}`;
        setNewOrderAlerts(prev => [...prev, { ticket: data.ticket || data, id: alertId }]);
      } else {
        // Refetch and show alert for the newest ticket
        api.get(`/kds/tickets?branchId=${branchId}${selectedStation ? `&stationId=${selectedStation}` : ''}`)
          .then(res => {
            const tickets = res.data;
            const newest = tickets?.find((t: any) => t.status === 'pending');
            if (newest) {
              const alertId = `alert-${Date.now()}-${Math.random()}`;
              setNewOrderAlerts(prev => [...prev, { ticket: newest, id: alertId }]);
            }
          })
          .catch(() => {});
      }
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
  }, [branchId, selectedStation, queryClient, playNotificationSound]);

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
    refetchInterval: 10000,
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

  const pendingCount = activeTickets.filter((t: any) => t.status === 'pending').length;

  const getElapsedMinutes = (createdAt: string) => {
    return Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
  };

  const dismissAlert = (alertId: string) => {
    setNewOrderAlerts(prev => prev.filter(a => a.id !== alertId));
  };

  const acceptOrder = (alertId: string, ticketId: string) => {
    updateStatus.mutate({ id: ticketId, status: 'preparing' });
    dismissAlert(alertId);
    setUnreadCount(prev => Math.max(0, prev - 1));
    toast.success('Pedido aceptado - En preparación', {
      icon: '👨‍🍳',
      style: { borderRadius: '16px', background: '#1a1a2e', color: '#fff' }
    });
  };

  const clearNotifications = () => setUnreadCount(0);

  return (
    <div className="h-full flex flex-col relative">
      {/* Top bar with station tabs, notification bell and sound toggle */}
      <div className="flex items-center justify-between mb-4 gap-4">
        {/* Station tabs */}
        <div className="flex gap-2 flex-1 overflow-x-auto">
          <button
            onClick={() => setSelectedStation(null)}
            className={`px-4 py-2 rounded-xl text-sm font-black uppercase tracking-wider transition-all whitespace-nowrap ${
              !selectedStation
                ? 'bg-white dark:bg-surface text-gray-900 dark:text-text-main shadow-lg'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            Todas
          </button>
          {stations?.map((station: any) => (
            <button
              key={station.id}
              onClick={() => setSelectedStation(station.id)}
              className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
                selectedStation === station.id
                  ? 'bg-white dark:bg-surface text-gray-900 dark:text-text-main shadow-lg'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {station.color && (
                <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: station.color }} />
              )}
              {station.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Sound toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl transition-all ${
              soundEnabled ? 'bg-amber-500/20 text-amber-400' : 'bg-gray-800 text-gray-500 dark:text-white/40'
            }`}
            title={soundEnabled ? 'Sonido activado' : 'Sonido desactivado'}
          >
            {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
          </button>

          {/* Notification Bell */}
          <button
            onClick={clearNotifications}
            className="relative p-2 rounded-xl bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-amber-400 transition-all"
          >
            <Bell size={18} />
            {(unreadCount > 0 || pendingCount > 0) && (
              <span className="absolute -top-1 -right-1 min-w-[20px] h-5 flex items-center justify-center px-1 bg-red-500 text-white text-[10px] font-black rounded-full shadow-lg shadow-red-500/40 animate-pulse">
                {unreadCount > 0 ? unreadCount : pendingCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Pending orders banner */}
      {pendingCount > 0 && (
        <div className="mb-4 bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-2xl px-5 py-3 flex items-center gap-3 animate-pulse">
          <AlertTriangle size={20} className="text-red-400 shrink-0" />
          <p className="text-sm font-bold text-red-300">
            {pendingCount} pedido{pendingCount > 1 ? 's' : ''} nuevo{pendingCount > 1 ? 's' : ''} esperando ser aceptado{pendingCount > 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Tickets grid */}
      <div className="flex-1 overflow-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {activeTickets.map((ticket: any) => {
            const minutes = getElapsedMinutes(ticket.createdAt);
            const isLate = minutes > 15;
            const orderType = ticket.order?.orderType;
            const isDelivery = orderType === 'delivery';

            return (
              <div
                key={ticket.id}
                className={`rounded-2xl border-l-4 p-4 shadow-lg transition-all hover:scale-[1.02] ${
                  ticketStatusColors[ticket.status] || 'border-gray-300 bg-gray-800'
                } ${ticket.status === 'pending' ? 'ring-2 ring-red-400/50 animate-[pulse_3s_ease-in-out_infinite]' : ''}`}
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="font-black text-lg text-gray-900">#{ticket.order?.orderNumber}</span>
                  </div>
                  <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
                    isLate ? 'bg-red-100 text-red-600' : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-white/40'
                  }`}>
                    <Clock size={12} />
                    {minutes}m
                  </div>
                </div>

                {/* Order type & table */}
                <div className="flex items-center gap-2 mb-3">
                  {ticket.order?.table && (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-widest">
                      <MapPin size={10} /> Mesa {ticket.order.table.number}
                    </span>
                  )}
                  {isDelivery && (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-100 text-purple-700 text-[10px] font-black uppercase tracking-widest">
                      <Truck size={10} /> Delivery
                    </span>
                  )}
                  {orderType === 'takeaway' && (
                    <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-100 text-orange-700 text-[10px] font-black uppercase tracking-widest">
                      Para llevar
                    </span>
                  )}
                  <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                    ticket.status === 'pending' ? 'bg-red-100 text-red-700' :
                    ticket.status === 'preparing' ? 'bg-amber-100 text-amber-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {ticketStatusLabels[ticket.status]}
                  </span>
                </div>

                {/* Station */}
                {ticket.kitchenStation?.name && (
                  <div className="text-[10px] font-bold text-gray-500 dark:text-white/40 mb-2 flex items-center gap-1.5 uppercase tracking-widest">
                    {ticket.kitchenStation?.color && (
                      <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: ticket.kitchenStation.color }} />
                    )}
                    {ticket.kitchenStation.name}
                  </div>
                )}

                {/* Items */}
                <div className="space-y-1.5 mb-4 border-t border-gray-200/50 dark:border-white/15 pt-3">
                  {ticket.items?.map((item: any) => (
                    <div key={item.id} className="text-sm">
                      <div className="flex items-start justify-between">
                        <span className="font-bold text-gray-800">
                          <span className="text-amber-600 font-black">{item.orderItem?.quantity}x</span>{' '}
                          {item.orderItem?.productVariant?.product?.name}
                        </span>
                      </div>
                      {item.orderItem?.productVariant?.name && item.orderItem?.productVariant?.name !== 'Estándar' && (
                        <span className="text-xs text-gray-500 dark:text-white/40 ml-4">
                          ({item.orderItem.productVariant.name})
                        </span>
                      )}
                      {item.orderItem?.notes && (
                        <p className="text-xs text-orange-600 font-bold ml-4 mt-0.5">
                          ⚠ {item.orderItem.notes}
                        </p>
                      )}
                      {item.orderItem?.modifiers?.map((m: any) => (
                        <p key={m.id} className="text-xs text-blue-600 font-medium ml-4">+ {m.modifier?.name}</p>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {ticket.status === 'pending' && (
                    <button
                      onClick={() => {
                        updateStatus.mutate({ id: ticket.id, status: 'preparing' });
                        toast.success('Pedido aceptado', { icon: '👨‍🍳' });
                      }}
                      className="flex-1 py-2.5 bg-amber-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                    >
                      <ChefHat size={14} /> Aceptar
                    </button>
                  )}
                  {ticket.status === 'preparing' && (
                    <button
                      onClick={() => updateStatus.mutate({ id: ticket.id, status: 'ready' })}
                      className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Check size={14} /> Listo
                    </button>
                  )}
                  {ticket.status === 'ready' && (
                    <button
                      onClick={() => bumpTicket.mutate(ticket.id)}
                      className="flex-1 py-2.5 bg-gray-700 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-gray-600 transition-all"
                    >
                      Bump
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {activeTickets.length === 0 && (
            <div className="col-span-full text-center py-20">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gray-800 flex items-center justify-center">
                <ChefHat size={36} className="text-gray-600 dark:text-white/60" />
              </div>
              <p className="text-lg font-black text-gray-500 dark:text-white/40 uppercase tracking-widest">Sin pedidos pendientes</p>
              <p className="text-sm text-gray-600 dark:text-white/60 mt-1">Los nuevos pedidos aparecerán aquí automáticamente</p>
            </div>
          )}
        </div>
      </div>

      {/* New Order Alert Modals */}
      {newOrderAlerts.map((alert, index) => (
        <NewOrderAlertModal
          key={alert.id}
          alert={alert}
          index={index}
          onAccept={(ticketId) => acceptOrder(alert.id, ticketId)}
          onDismiss={() => dismissAlert(alert.id)}
        />
      ))}
    </div>
  );
}

// New Order Alert Modal Component
function NewOrderAlertModal({
  alert,
  index,
  onAccept,
  onDismiss,
}: {
  alert: NewOrderAlert;
  index: number;
  onAccept: (ticketId: string) => void;
  onDismiss: () => void;
}) {
  const ticket = alert.ticket;
  const order = ticket?.order || ticket;
  const orderNumber = order?.orderNumber || ticket?.order?.orderNumber || '??';
  const tableName = order?.table?.number || ticket?.order?.table?.number;
  const orderType = order?.orderType || ticket?.order?.orderType;
  const isDelivery = orderType === 'delivery';
  const isTakeaway = orderType === 'takeaway';
  const items = ticket?.items || order?.items || [];
  const stationName = ticket?.kitchenStation?.name;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ zIndex: 200 + index }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onDismiss} />

      {/* Modal */}
      <div className="relative bg-gray-900 border-2 border-amber-500/50 rounded-[32px] w-full max-w-lg shadow-2xl shadow-amber-500/20 overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        {/* Pulsing top bar */}
        <div className="h-1.5 bg-gradient-to-r from-red-500 via-amber-500 to-red-500 animate-pulse" />

        {/* Header */}
        <div className="px-4 md:px-8 pt-4 md:pt-6 pb-3 md:pb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/30 animate-bounce">
              <Bell size={28} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight">Nuevo Pedido</h2>
              <p className="text-amber-400 font-black text-sm uppercase tracking-widest">#{orderNumber}</p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center text-gray-500 dark:text-white/40 hover:text-white hover:bg-gray-700 transition-all"
          >
            <X size={20} />
          </button>
        </div>

        {/* Order Info Tags */}
        <div className="px-4 md:px-8 pb-4 flex flex-wrap gap-2">
          {tableName && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/20 text-blue-400 text-xs font-black uppercase tracking-widest">
              <MapPin size={12} /> Mesa {tableName}
            </span>
          )}
          {isDelivery && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/20 text-purple-400 text-xs font-black uppercase tracking-widest">
              <Truck size={12} /> Delivery
            </span>
          )}
          {isTakeaway && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/20 text-orange-400 text-xs font-black uppercase tracking-widest">
              <UtensilsCrossed size={12} /> Para Llevar
            </span>
          )}
          {!tableName && !isDelivery && !isTakeaway && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 text-cyan-400 text-xs font-black uppercase tracking-widest">
              <UtensilsCrossed size={12} /> Dine In
            </span>
          )}
          {stationName && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-700 text-gray-300 text-xs font-bold">
              {ticket?.kitchenStation?.color && (
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ticket.kitchenStation.color }} />
              )}
              {stationName}
            </span>
          )}
        </div>

        {/* Items List */}
        <div className="px-4 md:px-8 pb-4">
          <div className="bg-gray-800 rounded-2xl p-4 max-h-[200px] md:max-h-[300px] overflow-y-auto custom-scrollbar">
            <p className="text-[10px] font-black text-gray-500 dark:text-white/40 uppercase tracking-widest mb-3">Detalle del Pedido</p>
            <div className="space-y-3">
              {items.length > 0 ? items.map((item: any, i: number) => {
                // Handle both ticket items and order items format
                const orderItem = item.orderItem || item;
                const productName = orderItem?.productVariant?.product?.name || orderItem?.product?.name || 'Producto';
                const variantName = orderItem?.productVariant?.name || orderItem?.variant?.name;
                const quantity = orderItem?.quantity || 1;
                const notes = orderItem?.notes;
                const modifiers = orderItem?.modifiers || [];

                return (
                  <div key={item.id || i} className="flex items-start gap-3 p-2 rounded-xl hover:bg-gray-700/50 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 text-sm font-black shrink-0">
                      {quantity}x
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white">{productName}</p>
                      {variantName && variantName !== 'Estándar' && (
                        <p className="text-xs text-gray-400 dark:text-white/40">Variante: {variantName}</p>
                      )}
                      {modifiers.map((m: any, j: number) => (
                        <p key={j} className="text-xs text-blue-400">+ {m.modifier?.name || m.name}</p>
                      ))}
                      {notes && (
                        <p className="text-xs text-orange-400 font-bold mt-0.5">⚠ {notes}</p>
                      )}
                    </div>
                  </div>
                );
              }) : (
                <p className="text-sm text-gray-500 dark:text-white/40 text-center py-4">Cargando detalle...</p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-4 md:px-8 pb-5 md:pb-8 flex gap-3">
          <button
            onClick={onDismiss}
            className="flex-1 py-4 bg-gray-800 text-gray-300 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-700 transition-all"
          >
            Cerrar
          </button>
          <button
            onClick={() => onAccept(ticket.id)}
            className="flex-[2] py-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-amber-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <ChefHat size={18} /> Aceptar Pedido
          </button>
        </div>
      </div>
    </div>
  );
}
