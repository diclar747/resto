import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import { useCartStore } from '../../stores/cart.store';
import api from '../../api/client';
import toast from 'react-hot-toast';
import { useState } from 'react';
import {
  Users, Clock, ClipboardList, Receipt,
  Loader2, ShoppingCart, X, Plus,
  CreditCard, Ban, Bell, Unlock, CalendarCheck
} from 'lucide-react';
import { PaymentModal } from '../pos/components/PaymentModal';
import { formatCurrency } from '../../utils/currency';

const statusColors: Record<string, { bg: string; text: string; border: string; glow: string; chair: string }> = {
  free: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', glow: '#10b981', chair: '#10b981' },
  occupied: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200', glow: '#f43f5e', chair: '#f43f5e' },
  waiting_order: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', glow: '#f59e0b', chair: '#f59e0b' },
  waiting_food: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200', glow: '#f97316', chair: '#f97316' },
  bill_requested: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200', glow: '#6366f1', chair: '#6366f1' },
  reserved: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', glow: '#a855f7', chair: '#a855f7' },
};

const statusLabels: Record<string, string> = {
  free: 'Disponible',
  occupied: 'Ocupada',
  waiting_order: 'Esperando Orden',
  waiting_food: 'En Cocina',
  bill_requested: 'Pide Cuenta',
  reserved: 'Reservada',
};

// SVG Table with chairs illustration
function TableIllustration({ capacity, status, number }: { capacity: number; status: string; number: number }) {
  const color = statusColors[status]?.chair || '#9ca3af';
  const chairCount = Math.min(capacity || 4, 8);
  const isFree = status === 'free';

  return (
    <svg viewBox="0 0 200 200" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="100" cy="170" rx="65" ry="12" fill="black" opacity="0.05" />
      <ellipse cx="100" cy="100" rx="52" ry="52"
        fill={isFree ? '#f0fdf4' : '#fff5f5'}
        stroke={color} strokeWidth="3" opacity="0.9"
      />
      <ellipse cx="88" cy="88" rx="20" ry="15" fill="white" opacity="0.4" transform="rotate(-30, 88, 88)" />
      <text x="100" y="96" textAnchor="middle" fontWeight="900" fontSize="28" fill={color} fontFamily="system-ui">{number}</text>
      <text x="100" y="115" textAnchor="middle" fontWeight="700" fontSize="9" fill={color} opacity="0.7" fontFamily="system-ui" letterSpacing="2">MESA</text>
      {Array.from({ length: chairCount }).map((_, i) => {
        const angle = (i * (360 / chairCount) - 90) * (Math.PI / 180);
        const cx = 100 + Math.cos(angle) * 78;
        const cy = 100 + Math.sin(angle) * 78;
        const rotation = (i * (360 / chairCount));
        return (
          <g key={i} transform={`translate(${cx}, ${cy}) rotate(${rotation})`}>
            <rect x="-10" y="-10" width="20" height="20" rx="6" fill={color} opacity={isFree ? 0.15 : 0.25} stroke={color} strokeWidth="1.5" />
            <rect x="-8" y="-14" width="16" height="5" rx="2.5" fill={color} opacity={isFree ? 0.3 : 0.5} />
          </g>
        );
      })}
      <circle cx="140" cy="60" r="8" fill={color} opacity="0.9" />
      <circle cx="140" cy="60" r="4" fill="white" />
      {!isFree && (
        <circle cx="140" cy="60" r="8" fill={color} opacity="0.4">
          <animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
        </circle>
      )}
    </svg>
  );
}

export function TablesPage() {
  const navigate = useNavigate();
  const branchId = useAuthStore((s) => s.user?.branchId);
  const { setTable, setActiveOrder, setOrderType } = useCartStore();
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const queryClient = useQueryClient();

  const { data: tables, isLoading } = useQuery({
    queryKey: ['tables', branchId],
    queryFn: () => api.get(`/tables?branchId=${branchId}`).then((r) => r.data),
    enabled: !!branchId,
    refetchInterval: 10000,
  });

  const { data: activeOrder, refetch: refetchOrder } = useQuery({
    queryKey: ['active-order', selectedTable?.id],
    queryFn: () => api.get(`/orders/active?tableId=${selectedTable.id}`).then((r) => r.data),
    enabled: !!selectedTable && selectedTable.status !== 'free' && selectedTable.status !== 'reserved',
  });

  const changeStatusMutation = useMutation({
    mutationFn: ({ tableId, status }: { tableId: string; status: string }) =>
      api.patch(`/tables/${tableId}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tables'] });
    },
  });

  const refetchAll = () => {
    queryClient.invalidateQueries({ queryKey: ['tables'] });
    queryClient.invalidateQueries({ queryKey: ['active-order'] });
  };

  // === ACTION HANDLERS ===

  const handleOpenSession = () => {
    setTable(selectedTable.id);
    setOrderType('dine_in');
    setSelectedTable(null);
    toast.success(`Mesa ${selectedTable.number} seleccionada`, {
      icon: '🍽️',
      style: { borderRadius: '16px', background: '#001F3D', color: '#fff' }
    });
    navigate('/pos');
  };

  const handleAddMore = () => {
    setTable(selectedTable.id);
    setOrderType('dine_in');
    if (activeOrder?.id) {
      setActiveOrder(activeOrder.id);
    }
    setSelectedTable(null);
    navigate('/pos');
  };

  const handleRequestBill = async () => {
    try {
      await changeStatusMutation.mutateAsync({ tableId: selectedTable.id, status: 'bill_requested' });
      setSelectedTable({ ...selectedTable, status: 'bill_requested' });
      toast.success('Cuenta solicitada', {
        icon: '🔔',
        style: { borderRadius: '16px', background: '#001F3D', color: '#fff' }
      });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al solicitar cuenta');
    }
  };

  const handlePaymentComplete = async (paymentData: any) => {
    if (!activeOrder?.id) return;
    setActionLoading(true);
    try {
      await api.post('/payments', {
        orderId: activeOrder.id,
        method: paymentData.method,
        amount: paymentData.amount,
        receivedAmount: paymentData.receivedAmount,
      });
      await api.post(`/orders/${activeOrder.id}/close`);

      toast.success(`Mesa ${selectedTable.number} cobrada y liberada`, {
        icon: '💰',
        style: { borderRadius: '16px', background: '#001F3D', color: '#fff' }
      });
      setShowPayment(false);
      setSelectedTable(null);
      refetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al procesar pago');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFreeTable = async () => {
    const orderTotal = activeOrder?.total ? Number(activeOrder.total) : 0;
    const msg = orderTotal > 0
      ? `¿Anular pedido de ${formatCurrency(orderTotal)} y liberar Mesa ${selectedTable.number}?`
      : `¿Liberar Mesa ${selectedTable.number}?`;

    if (!confirm(msg)) return;

    setActionLoading(true);
    try {
      if (activeOrder?.id) {
        await api.post(`/orders/${activeOrder.id}/void`);
      } else {
        await changeStatusMutation.mutateAsync({ tableId: selectedTable.id, status: 'free' });
      }
      toast.success(`Mesa ${selectedTable.number} liberada`, {
        icon: '✅',
        style: { borderRadius: '16px', background: '#001F3D', color: '#fff' }
      });
      setSelectedTable(null);
      refetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al liberar mesa');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenReserved = async () => {
    try {
      await changeStatusMutation.mutateAsync({ tableId: selectedTable.id, status: 'occupied' });
      setTable(selectedTable.id);
      setOrderType('dine_in');
      setSelectedTable(null);
      toast.success(`Mesa ${selectedTable.number} abierta`, {
        style: { borderRadius: '16px', background: '#001F3D', color: '#fff' }
      });
      navigate('/pos');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al abrir mesa');
    }
  };

  const handleCancelReservation = async () => {
    if (!confirm(`¿Cancelar reserva de Mesa ${selectedTable.number}?`)) return;
    try {
      await changeStatusMutation.mutateAsync({ tableId: selectedTable.id, status: 'free' });
      toast.success('Reserva cancelada');
      setSelectedTable(null);
      refetchAll();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  // === COMPUTED ===
  const zones = ['all', ...Array.from(new Set(tables?.map((t: any) => t.zone || 'General') || []))] as string[];
  const filteredTables = selectedZone === 'all'
    ? tables
    : tables?.filter((t: any) => (t.zone || 'General') === selectedZone);
  const totalTables = tables?.length || 0;
  const freeTables = tables?.filter((t: any) => t.status === 'free').length || 0;
  const occupiedTables = totalTables - freeTables;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
        <p className="text-xs font-black text-secondary uppercase tracking-[0.3em]">Cargando Planta...</p>
      </div>
    );
  }

  const isOccupied = selectedTable && selectedTable.status !== 'free' && selectedTable.status !== 'reserved';
  const isReserved = selectedTable?.status === 'reserved';

  return (
    <div className="h-full bg-background overflow-hidden relative">
      <div className={`h-full flex flex-col p-3 md:p-6 space-y-3 md:space-y-6 transition-all duration-300 ${selectedTable ? 'blur-sm opacity-40 pointer-events-none' : ''}`}>
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-3xl font-black text-secondary tracking-tight">Gestión de <span className="text-primary italic">Mesas</span></h2>
            <p className="text-text-secondary font-medium text-sm mt-1">Plano del restaurante en tiempo real</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3 mr-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-xl">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-xs font-bold text-emerald-700">{freeTables} libres</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 rounded-xl">
                <div className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="text-xs font-bold text-rose-700">{occupiedTables} ocupadas</span>
              </div>
            </div>

            <div className="flex p-1 bg-white rounded-2xl shadow-sm border border-gray-100">
              {zones.map((zone: string) => (
                <button
                  key={zone}
                  onClick={() => setSelectedZone(zone)}
                  className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    selectedZone === zone
                      ? 'bg-primary text-white shadow-lg shadow-primary/20'
                      : 'text-text-secondary hover:text-primary'
                  }`}
                >
                  {zone === 'all' ? 'Todas' : zone}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tables Grid */}
        <div className="flex-1 overflow-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-5">
            {filteredTables?.map((table: any) => {
              const style = statusColors[table.status] || statusColors.free;
              return (
                <button
                  key={table.id}
                  onClick={() => setSelectedTable(table)}
                  className={`relative bg-white rounded-[28px] p-4 shadow-sm border-2 ${style.border} transition-all group overflow-hidden hover:shadow-xl hover:-translate-y-1 active:scale-95`}
                >
                  <div className="w-full aspect-square mb-3">
                    <TableIllustration capacity={table.capacity || 4} status={table.status} number={table.number} />
                  </div>
                  <div className="space-y-2">
                    <div className={`w-full text-center px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${style.bg} ${style.text}`}>
                      {statusLabels[table.status]}
                    </div>
                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center gap-1 text-[10px] font-bold text-text-secondary">
                        <Users size={11} /> {table.capacity || 4} asientos
                      </div>
                      <span className="text-[10px] font-bold text-text-secondary">{table.zone || 'General'}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========== TABLE DETAIL MODAL ========== */}
      {selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-secondary/50 backdrop-blur-md" onClick={() => { setSelectedTable(null); setShowPayment(false); }} />

          <div className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-50 bg-background/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14">
                    <TableIllustration capacity={selectedTable.capacity || 4} status={selectedTable.status} number={selectedTable.number} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-secondary tracking-tight">Mesa {selectedTable.number}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${statusColors[selectedTable.status]?.bg} ${statusColors[selectedTable.status]?.text}`}>
                        {statusLabels[selectedTable.status]}
                      </span>
                      <span className="text-[10px] font-bold text-text-secondary">{selectedTable.zone || 'General'} • {selectedTable.capacity || 4} asientos</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => { setSelectedTable(null); setShowPayment(false); }}
                  className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 hover:text-secondary hover:bg-gray-200 transition-all"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">

              {/* ===== FREE TABLE ===== */}
              {selectedTable.status === 'free' && (
                <div className="flex flex-col items-center text-center py-8 space-y-5">
                  <div className="w-24 h-24">
                    <TableIllustration capacity={selectedTable.capacity || 4} status="free" number={selectedTable.number} />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-secondary">Mesa Disponible</h4>
                    <p className="text-sm text-text-secondary mt-1">Iniciar una nueva sesión para esta mesa</p>
                  </div>
                  <button
                    onClick={handleOpenSession}
                    className="w-full py-4 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Plus size={16} /> Abrir Sesión
                  </button>
                </div>
              )}

              {/* ===== RESERVED TABLE ===== */}
              {isReserved && (
                <div className="flex flex-col items-center text-center py-6 space-y-5">
                  <div className="w-24 h-24">
                    <TableIllustration capacity={selectedTable.capacity || 4} status="reserved" number={selectedTable.number} />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-secondary">Mesa Reservada</h4>
                    <p className="text-sm text-text-secondary mt-1">Esta mesa tiene una reserva activa</p>
                  </div>
                  <div className="w-full grid grid-cols-2 gap-3">
                    <button
                      onClick={handleCancelReservation}
                      className="py-3.5 bg-gray-100 text-secondary rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                    >
                      <Ban size={14} /> Cancelar
                    </button>
                    <button
                      onClick={handleOpenReserved}
                      className="py-3.5 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <CalendarCheck size={14} /> Abrir Mesa
                    </button>
                  </div>
                </div>
              )}

              {/* ===== OCCUPIED TABLE (any non-free/non-reserved) ===== */}
              {isOccupied && (
                <>
                  {/* Order Summary Card */}
                  <div className="bg-gradient-to-br from-primary to-secondary rounded-2xl p-6 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <ClipboardList size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-70">Cuenta Actual</span>
                      </div>
                      {activeOrder?.orderNumber && (
                        <span className="text-[10px] font-black bg-white/15 px-3 py-1 rounded-lg">
                          #{activeOrder.orderNumber}
                        </span>
                      )}
                    </div>
                    <p className="text-2xl md:text-4xl font-black tracking-tight">
                      {activeOrder?.total ? formatCurrency(activeOrder.total) : '₲ 0'}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-xs font-medium opacity-60">
                        {activeOrder?.items?.length || 0} items
                      </span>
                      {activeOrder?.createdAt && (
                        <span className="text-xs font-medium opacity-60 flex items-center gap-1">
                          <Clock size={10} />
                          {new Date(activeOrder.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Items list */}
                  {activeOrder?.items && activeOrder.items.length > 0 && (
                    <div>
                      <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-3">Consumo Detallado</p>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {activeOrder.items.map((item: any) => (
                          <div key={item.id} className="flex items-center justify-between p-3 bg-background rounded-xl">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-black text-xs">
                                {item.quantity}x
                              </div>
                              <div>
                                <p className="text-sm font-bold text-secondary">{item.productVariant?.product?.name}</p>
                                {item.productVariant?.name && item.productVariant?.name !== 'Estándar' && (
                                  <p className="text-[10px] text-text-secondary">{item.productVariant.name}</p>
                                )}
                              </div>
                            </div>
                            <p className="text-sm font-black text-secondary">{formatCurrency(item.subtotal || 0)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No order yet */}
                  {!activeOrder && (
                    <div className="flex flex-col items-center text-center py-4 space-y-2">
                      <ShoppingCart className="text-gray-200" size={40} />
                      <p className="text-sm font-bold text-text-secondary">Sin pedido activo</p>
                      <p className="text-xs text-text-secondary">Añade productos desde el POS</p>
                    </div>
                  )}

                  {/* Action Buttons Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleAddMore}
                      className="flex flex-col items-center gap-2 p-4 bg-background border border-gray-100 rounded-2xl hover:border-primary/20 hover:bg-primary/5 transition-all group"
                    >
                      <div className="p-2.5 bg-amber-100 text-amber-600 rounded-xl group-hover:scale-110 transition-transform">
                        <ShoppingCart size={20} />
                      </div>
                      <span className="text-[10px] font-black text-secondary uppercase tracking-widest">Añadir Más</span>
                    </button>

                    {selectedTable.status !== 'bill_requested' && (
                      <button
                        onClick={handleRequestBill}
                        className="flex flex-col items-center gap-2 p-4 bg-background border border-gray-100 rounded-2xl hover:border-indigo-200 hover:bg-indigo-50/50 transition-all group"
                      >
                        <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl group-hover:scale-110 transition-transform">
                          <Bell size={20} />
                        </div>
                        <span className="text-[10px] font-black text-secondary uppercase tracking-widest">Pedir Cuenta</span>
                      </button>
                    )}

                    {selectedTable.status === 'bill_requested' && (
                      <div className="flex flex-col items-center gap-2 p-4 bg-indigo-50 border-2 border-indigo-200 rounded-2xl">
                        <div className="p-2.5 bg-indigo-500 text-white rounded-xl animate-pulse">
                          <Bell size={20} />
                        </div>
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Cuenta Pedida</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Footer Actions for Occupied Tables */}
            {isOccupied && (
              <div className="p-4 md:p-6 border-t border-gray-50 flex gap-3">
                <button
                  onClick={handleFreeTable}
                  disabled={actionLoading}
                  className="flex-1 py-3.5 bg-gray-100 text-secondary rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Unlock size={14} /> Liberar
                </button>
                <button
                  onClick={() => setShowPayment(true)}
                  disabled={actionLoading || !activeOrder?.total || Number(activeOrder.total) <= 0}
                  className="flex-[2] py-3.5 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <CreditCard size={14} /> Registrar Pago
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPayment && activeOrder && (
        <PaymentModal
          total={Number(activeOrder.total)}
          onClose={() => setShowPayment(false)}
          onComplete={handlePaymentComplete}
        />
      )}
    </div>
  );
}
