import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/auth.store';
import api from '../../api/client';
import {
  Clock, AlertCircle, CheckCircle, ChefHat,
  ShoppingCart, Grid3X3, Receipt, Plus, Bell
} from 'lucide-react';

const statusConfig: Record<string, { color: string; bg: string; icon: any; label: string }> = {
  open: { color: 'text-blue-700', bg: 'bg-blue-100', icon: Clock, label: 'Abierta' },
  in_progress: { color: 'text-orange-700', bg: 'bg-orange-100', icon: ChefHat, label: 'En cocina' },
  ready: { color: 'text-green-700', bg: 'bg-green-100', icon: CheckCircle, label: 'Lista' },
};

const tableStatusColors: Record<string, string> = {
  free: 'bg-emerald-100 border-emerald-300 text-emerald-700',
  occupied: 'bg-blue-100 border-blue-300 text-blue-700',
  waiting_order: 'bg-yellow-100 border-yellow-300 text-yellow-700',
  waiting_food: 'bg-orange-100 border-orange-300 text-orange-700',
  bill_requested: 'bg-rose-100 border-rose-300 text-rose-700',
  reserved: 'bg-purple-100 border-purple-300 text-purple-700',
};

const tableStatusLabels: Record<string, string> = {
  free: 'Libre',
  occupied: 'Ocupada',
  waiting_order: 'Espera orden',
  waiting_food: 'Espera comida',
  bill_requested: 'Pide cuenta',
  reserved: 'Reservada',
};

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
    <div className="p-8 space-y-8 bg-[#F4F7FE] min-h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-secondary tracking-tight">Dashboard Camarero</h1>
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-[32px] p-5 shadow-card relative overflow-hidden group hover:scale-[1.02] transition-transform">
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
        <div className="bg-gradient-to-r from-rose-500 to-pink-500 rounded-[32px] p-6 shadow-lg text-white flex items-center gap-4">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tables Overview */}
        <div className="bg-white rounded-[32px] p-8 shadow-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-cyan-100 rounded-xl flex items-center justify-center text-cyan-600">
              <Grid3X3 size={20} />
            </div>
            <h3 className="text-lg font-black text-secondary tracking-tight">Estado de Mesas</h3>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {tables?.slice(0, 16).map((table: any) => (
              <button
                key={table.id}
                onClick={() => navigate('/pos/tables')}
                className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center text-xs font-black transition-all hover:scale-105 ${tableStatusColors[table.status] || 'bg-gray-50 border-gray-200 text-gray-400'}`}
              >
                <span className="text-lg">{table.number}</span>
                <span className="text-[8px] uppercase tracking-wider mt-0.5">{tableStatusLabels[table.status] || table.status}</span>
              </button>
            )) || (
              <p className="col-span-4 text-center text-sm text-text-secondary py-8">Cargando mesas...</p>
            )}
          </div>
        </div>

        {/* Active Orders */}
        <div className="lg:col-span-2 bg-white rounded-[32px] p-8 shadow-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
              <ShoppingCart size={20} />
            </div>
            <h3 className="text-lg font-black text-secondary tracking-tight">Pedidos Activos</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
            {activeOrders.map((order: any) => {
              const config = statusConfig[order.status] || statusConfig.open;
              const Icon = config.icon;
              return (
                <div key={order.id} className="bg-gray-50 rounded-2xl p-5 hover:bg-gray-100/50 transition-colors">
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
                        <span className={`text-xs font-bold ${item.status === 'ready' ? 'text-green-600' : item.status === 'preparing' ? 'text-orange-600' : 'text-gray-400'}`}>
                          {item.status === 'ready' ? 'Listo' : item.status === 'preparing' ? 'Preparando' : ''}
                        </span>
                      </div>
                    ))}
                    {order.items?.length > 4 && (
                      <p className="text-xs text-text-secondary font-bold">+{order.items.length - 4} más...</p>
                    )}
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-200/50 flex items-center justify-between">
                    <span className="text-xs font-bold text-text-secondary flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(order.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="text-sm font-black text-primary">${Number(order.total).toLocaleString('es-AR')}</span>
                  </div>
                </div>
              );
            })}

            {activeOrders.length === 0 && !isLoading && (
              <div className="col-span-full flex flex-col items-center justify-center py-12 text-center space-y-3">
                <ShoppingCart className="text-gray-200" size={48} />
                <p className="text-sm font-medium text-text-secondary">No hay pedidos activos</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
