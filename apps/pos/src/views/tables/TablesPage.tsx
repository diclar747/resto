import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/auth.store';
import { useCartStore } from '../../stores/cart.store';
import api from '../../api/client';
import toast from 'react-hot-toast';
import { useState } from 'react';
import {
  Users, User, Clock, DollarSign, ChevronRight,
  MapPin, ClipboardList, Receipt, MoreVertical,
  LayoutGrid, Search, Loader2, ArrowLeft,
  ShoppingCart
} from 'lucide-react';

const statusColors: Record<string, { bg: string, text: string, border: string, icon: string }> = {
  free: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', icon: 'bg-emerald-500' },
  occupied: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', icon: 'bg-rose-500' },
  waiting_order: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100', icon: 'bg-amber-500' },
  waiting_food: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100', icon: 'bg-orange-500' },
  bill_requested: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100', icon: 'bg-indigo-500' },
  reserved: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100', icon: 'bg-purple-500' },
};

const statusLabels: Record<string, string> = {
  free: 'Disponible',
  occupied: 'Ocupada',
  waiting_order: 'Pendiente Pedido',
  waiting_food: 'En Cocina',
  bill_requested: 'Cuenta Solicitada',
  reserved: 'Reservada',
};

export function TablesPage() {
  const branchId = useAuthStore((s) => s.user?.branchId);
  const setTable = useCartStore((s) => s.setTable);
  const [selectedZone, setSelectedZone] = useState<string>('all');
  const [selectedTable, setSelectedTable] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: tables, isLoading } = useQuery({
    queryKey: ['tables', branchId],
    queryFn: () => api.get(`/tables?branchId=${branchId}`).then((r) => r.data),
    enabled: !!branchId,
    refetchInterval: 10000,
  });

  const { data: activeOrder } = useQuery({
    queryKey: ['active-order', selectedTable?.id],
    queryFn: () => api.get(`/orders/active?tableId=${selectedTable.id}`).then((r) => r.data),
    enabled: !!selectedTable && selectedTable.status !== 'free',
  });

  const handleSelectTable = (table: any) => {
    setSelectedTable(table);
    if (table.status === 'free') {
      // Direct access to cart if free
      // setTable(table.id);
    }
  };

  const zones = ['all', ...Array.from(new Set(tables?.map((t: any) => t.zone || 'General') || []))] as string[];
  const filteredTables = selectedZone === 'all'
    ? tables
    : tables?.filter((t: any) => (t.zone || 'General') === selectedZone);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-4 animate-pulse">
        <Loader2 className="animate-spin text-primary" size={48} />
        <p className="text-xs font-black text-secondary uppercase tracking-[0.3em]">Cargando Planta...</p>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-[#F4F7FE] overflow-hidden font-outfit relative">
      {/* Left Column: Tables Grid */}
      <div className={`flex-1 p-8 space-y-8 transition-all duration-500 ${selectedTable ? 'filter blur-[2px] opacity-40 scale-[0.98]' : 'opacity-100'}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-black text-secondary tracking-tighter">Table <span className="text-primary italic">Manager</span></h2>
            <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mt-1">Gestión de salón y sesiones en tiempo real</p>
          </div>

          <div className="flex p-1.5 bg-white rounded-2xl shadow-sm border border-gray-100">
            {(zones as string[]).map((zone: string) => (
              <button
                key={zone}
                onClick={() => setSelectedZone(zone)}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedZone === zone ? 'bg-secondary text-white shadow-lg scale-105' : 'text-text-secondary hover:text-secondary'
                  }`}
              >
                {zone === 'all' ? 'Ver Todo' : zone}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredTables?.map((table: any) => (
            <button
              key={table.id}
              onClick={() => handleSelectTable(table)}
              className={`relative bg-white rounded-[32px] p-6 shadow-sm border-2 transition-all group overflow-hidden ${statusColors[table.status].border
                } hover:shadow-xl hover:-translate-y-1 active:scale-95`}
            >
              {/* Status Glow */}
              <div className={`absolute top-0 right-0 w-20 h-20 -mr-10 -mt-10 rounded-full blur-2xl opacity-10 ${statusColors[table.status].icon}`} />

              <div className="flex items-start justify-between mb-4">
                <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${statusColors[table.status].bg} ${statusColors[table.status].text}`}>
                  {statusLabels[table.status]}
                </div>
                <div className="text-gray-300 group-hover:text-primary transition-colors">
                  <Users size={18} />
                </div>
              </div>

              <div className="space-y-1 text-left">
                <h4 className="text-3xl font-black text-secondary tracking-tighter italic">Mesa {table.number}</h4>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{table.zone || 'General Area'}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[10px] font-black text-text-secondary">
                  <User size={12} /> {table.capacity}p
                </div>
                {table.status !== 'free' && (
                  <div className="flex items-center gap-1.5 text-[10px] font-black text-rose-500 animate-pulse">
                    <Clock size={12} /> 42 min
                  </div>
                )}
              </div>

              {/* Selection Ring */}
              <div className={`absolute inset-0 border-4 rounded-[32px] transition-all duration-300 pointer-events-none ${selectedTable?.id === table.id ? 'border-primary opacity-100 scale-100' : 'border-transparent opacity-0 scale-105'
                }`} />
            </button>
          ))}
        </div>
      </div>

      {/* Session Details Sidebar / Modal */}
      {selectedTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-end animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-secondary/40 backdrop-blur-sm" onClick={() => setSelectedTable(null)} />

          <div className="relative w-full max-w-lg h-full bg-white shadow-2xl animate-in slide-in-from-right duration-500 border-l border-gray-100 flex flex-col">
            {/* Sidebar Header */}
            <div className="p-8 border-b border-gray-50 flex items-center justify-between bg-[#F4F7FE]/50">
              <button onClick={() => setSelectedTable(null)} className="p-3 bg-white hover:bg-gray-100 rounded-2xl transition-all shadow-sm">
                <ArrowLeft size={20} className="text-secondary" />
              </button>
              <div className="text-center">
                <h3 className="text-2xl font-black text-secondary tracking-tighter italic leading-none">Session <span className="text-primary">Detail</span></h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2 px-4 py-1 bg-white rounded-full shadow-sm inline-block">Mesa {selectedTable.number} • {selectedTable.zone || 'General'}</p>
              </div>
              <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100">
                <MoreVertical size={20} className="text-gray-300" />
              </div>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
              {selectedTable.status === 'free' ? (
                <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
                  <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[40px] flex items-center justify-center">
                    <LayoutGrid size={48} />
                  </div>
                  <div>
                    <h4 className="text-xl font-black text-secondary">Mesa Disponible</h4>
                    <p className="text-sm font-medium text-text-secondary max-w-xs mx-auto mt-2">¿Deseas abrir una nueva sesión para esta mesa?</p>
                  </div>
                  <button
                    onClick={() => {
                      setTable(selectedTable.id);
                      toast.success('Sesión iniciada');
                      setSelectedTable(null);
                    }}
                    className="w-full py-5 bg-primary text-white rounded-[24px] text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    Abrir Sesión
                  </button>
                </div>
              ) : (
                <>
                  {/* Active Order Summary */}
                  <div className="bg-indigo-600 rounded-[32px] p-8 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-xl"><ClipboardList size={20} /></div>
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Cuenta Parcial</span>
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">Ocupada</span>
                    </div>
                    <p className="text-5xl font-black tracking-tighter mb-1">$ 14.500</p>
                    <p className="text-[11px] font-bold opacity-70">Atendido por: <span className="underline italic">Carlos Waiter</span></p>
                  </div>

                  {/* Detailed Items List */}
                  <div className="space-y-4">
                    <h5 className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] px-2">Consumo Detallado</h5>
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between p-5 bg-[#F4F7FE]/50 rounded-[24px] border border-transparent hover:border-primary/20 transition-all group">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-primary shadow-sm">1</div>
                            <div>
                              <p className="text-sm font-black text-secondary italic">Hamburguesa Doble {i}</p>
                              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Sin Cebolla • Término Medio</p>
                            </div>
                          </div>
                          <p className="text-sm font-black text-secondary">$ 4.500</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <button className="flex flex-col items-center justify-center gap-2 p-6 bg-white border border-gray-100 rounded-[32px] hover:bg-gray-50 transition-all group">
                      <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl group-hover:scale-110 transition-transform"><ShoppingCart size={24} /></div>
                      <span className="text-[10px] font-black text-secondary uppercase tracking-widest">Añadir Items</span>
                    </button>
                    <button className="flex flex-col items-center justify-center gap-2 p-6 bg-white border border-gray-100 rounded-[32px] hover:bg-gray-50 transition-all group">
                      <div className="p-3 bg-indigo-50 text-indigo-500 rounded-2xl group-hover:scale-110 transition-transform"><Receipt size={24} /></div>
                      <span className="text-[10px] font-black text-secondary uppercase tracking-widest">Ver Cuenta</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Footer Actions */}
            {selectedTable.status !== 'free' && (
              <div className="p-8 border-t border-gray-50 flex gap-4">
                <button className="flex-1 py-5 bg-gray-100 text-secondary rounded-[24px] text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-all">Liberar Mesa</button>
                <button className="flex-[2] py-5 bg-secondary text-white rounded-[24px] text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-secondary/20 hover:scale-[1.02] active:scale-95 transition-all">Registar Pago</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
