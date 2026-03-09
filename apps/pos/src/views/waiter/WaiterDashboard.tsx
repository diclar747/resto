import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import api from '../../api/client';
import {
  Clock, AlertCircle, CheckCircle, ChefHat,
  ShoppingCart, Grid3X3, Receipt, Plus, Bell
} from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

const statusConfig: Record<string, { color: string; bg: string; icon: any; label: string }> = {
  open: { color: 'text-blue-700', bg: 'bg-blue-100', icon: Clock, label: 'Abierta' },
  in_progress: { color: 'text-orange-700', bg: 'bg-orange-100', icon: ChefHat, label: 'En cocina' },
  ready: { color: 'text-green-700', bg: 'bg-green-100', icon: CheckCircle, label: 'Lista' },
};

const tableStatusColors: Record<string, { bg: string; text: string; border: string; chair: string }> = {
  free: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200', chair: '#10b981' },
  occupied: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-200', chair: '#f43f5e' },
  waiting_order: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', chair: '#f59e0b' },
  waiting_food: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-200', chair: '#f97316' },
  bill_requested: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200', chair: '#6366f1' },
  reserved: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', chair: '#a855f7' },
};

const tableStatusLabels: Record<string, string> = {
  free: 'Libre',
  occupied: 'Ocupada',
  waiting_order: 'Espera orden',
  waiting_food: 'Espera comida',
  bill_requested: 'Pide cuenta',
  reserved: 'Reservada',
};

function MiniTableSVG({ number, capacity, status }: { number: number; capacity: number; status: string }) {
  const color = tableStatusColors[status]?.chair || '#9ca3af';
  const chairCount = Math.min(capacity || 4, 8);
  const isFree = status === 'free';
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="50" r="26" fill={isFree ? '#f0fdf4' : '#fff5f5'} stroke={color} strokeWidth="2" />
      <text x="50" y="54" textAnchor="middle" fontWeight="900" fontSize="16" fill={color} fontFamily="system-ui">{number}</text>
      {Array.from({ length: chairCount }).map((_, i) => {
        const angle = (i * (360 / chairCount) - 90) * (Math.PI / 180);
        const cx = 50 + Math.cos(angle) * 40;
        const cy = 50 + Math.sin(angle) * 40;
        return (
          <circle key={i} cx={cx} cy={cy} r="5" fill={color} opacity={isFree ? 0.2 : 0.4} stroke={color} strokeWidth="1" />
        );
      })}
      {!isFree && (
        <circle cx="72" cy="28" r="5" fill={color} opacity="0.8">
          <animate attributeName="r" values="5;7;5" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.8;0.3;0.8" dur="2s" repeatCount="indefinite" />
        </circle>
      )}
    </svg>
  );
}

export function WaiterDashboard() {
  const navigate = useNavigate();
  const branchId = useAuthStore((s) => s.user?.branchId);

  const { data: orders, isLoading } = useQuery({
    queryKey: ['waiter-orders', branchId],
    queryFn: () =>
      api.get('/orders?status=open&status=in_progress&status=ready').then((r) => r.data),
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

  const billRequested = tables?.filter((t: any) => t.status === 'bill_requested') || [];
  const occupiedTables = tables?.filter((t: any) => t.status !== 'free' && t.status !== 'reserved') || [];
  const readyOrders = activeOrders.filter((o: any) => o.status === 'ready');

  const stats = [
    { label: 'Pedidos Activos', value: activeOrders.length, icon: ShoppingCart, color: 'from-blue-600 to-indigo-600' },
    { label: 'Mesas Ocupadas', value: occupiedTables.length, icon: Grid3X3, color: 'from-cyan-500 to-blue-500' },
    { label: 'Listos para Servir', value: readyOrders.length, icon: CheckCircle, color: 'from-emerald-500 to-teal-500' },
    { label: 'Cuentas Pendientes', value: billRequested.length, icon: Receipt, color: 'from-rose-500 to-pink-500' },
  ];

  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-8 bg-background min-h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-3xl font-black text-secondary tracking-tight">Dashboard Camarero</h1>
          <p className="text-text-secondary font-medium mt-1">
            Gestión de mesas y pedidos en tiempo real
          </p>
        </div>
        <button
          onClick={() => navigate('/pos')}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all"
        >
          <Plus size={16} /> Nuevo Pedido
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white dark:bg-surface rounded-[32px] p-3 md:p-5 shadow-card relative overflow-hidden group hover:scale-[1.02] transition-transform">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.color} text-white shadow-lg`}>
                  <Icon size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.1em]">{stat.label}</p>
                  <p className="text-2xl font-black text-secondary tracking-tight">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bill Requested Alert */}
      {billRequested.length > 0 && (
        <div className="bg-gradient-to-r from-rose-500 to-pink-500 rounded-[32px] p-3 md:p-6 shadow-lg text-white flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <Bell size={24} />
          </div>
          <div className="flex-1">
            <p className="font-black text-lg">Cuenta Solicitada</p>
            <p className="text-white/80 font-bold text-sm">
              Mesa(s): {billRequested.map((t: any) => t.number).join(', ')}
            </p>
          </div>
          <AlertCircle size={24} className="animate-pulse" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
        {/* Tables Overview */}
        <div className="bg-white dark:bg-surface rounded-[32px] p-4 md:p-8 shadow-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center text-cyan-600">
              <Grid3X3 size={20} />
            </div>
            <h3 className="text-lg font-black text-secondary tracking-tight">Estado de Mesas</h3>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 md:gap-3">
            {tables?.slice(0, 16).map((table: any) => {
              const style = tableStatusColors[table.status] || tableStatusColors.free;
              return (
                <button
                  key={table.id}
                  onClick={() => navigate('/pos/tables')}
                  className={`rounded-2xl border-2 ${style.border} ${style.bg} p-2 flex flex-col items-center transition-all hover:scale-105 hover:shadow-md`}
                >
                  <div className="w-full aspect-square">
                    <MiniTableSVG number={table.number} capacity={table.capacity || 4} status={table.status} />
                  </div>
                  <span className={`text-[8px] font-black uppercase tracking-wider ${style.text}`}>
                    {tableStatusLabels[table.status] || table.status}
                  </span>
                </button>
              );
            }) || (
              <p className="col-span-4 text-center text-sm text-text-secondary py-8">Cargando mesas...</p>
            )}
          </div>
        </div>

        {/* Active Orders */}
        <div className="lg:col-span-2 bg-white dark:bg-surface rounded-[32px] p-4 md:p-8 shadow-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
              <ShoppingCart size={20} />
            </div>
            <h3 className="text-lg font-black text-secondary tracking-tight">Pedidos Activos</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[300px] md:max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
            {activeOrders.map((order: any) => {
              const config = statusConfig[order.status] || statusConfig.open;
              const Icon = config.icon;
              return (
                <div key={order.id} className="bg-gray-50 dark:bg-white/5 rounded-2xl p-5 hover:bg-gray-100/50 dark:hover:bg-white/10 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <span className="text-lg font-black text-secondary">#{order.orderNumber}</span>
                      {order.table && (
                        <span className="ml-2 text-sm font-bold text-text-secondary">Mesa {order.table.number}</span>
                      )}
                    </div>
                    <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${config.bg} ${config.color}`}>
                      <Icon size={12} />
                      {config.label}
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    {order.items?.slice(0, 4).map((item: any) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="font-medium text-secondary">
                          {item.quantity}x {item.productVariant?.product?.name}
                          <span className="text-text-secondary ml-1 text-xs">({item.productVariant?.name})</span>
                        </span>
                        <span className={`text-xs font-bold ${item.status === 'ready' ? 'text-green-600' : item.status === 'preparing' ? 'text-orange-600' : 'text-gray-400 dark:text-white/40'}`}>
                          {item.status === 'ready' ? 'Listo' : item.status === 'preparing' ? 'Preparando' : ''}
                        </span>
                      </div>
                    ))}
                    {order.items?.length > 4 && (
                      <p className="text-xs text-text-secondary font-bold">+{order.items.length - 4} más...</p>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-200/50 dark:border-white/15 flex items-center justify-between">
                    <span className="text-xs font-bold text-text-secondary flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(order.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-sm font-black text-primary">{formatCurrency(order.total)}</span>
                  </div>
                </div>
              );
            })}

            {activeOrders.length === 0 && !isLoading && (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-center space-y-3">
                <ShoppingCart className="text-gray-200 dark:text-white/15" size={48} />
                <p className="text-sm font-medium text-text-secondary">No hay pedidos activos</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
