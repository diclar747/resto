import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../stores/auth.store';
import api from '../../../api/client';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { DollarSign, ArrowUpCircle, ArrowDownCircle, Lock, Unlock, History, Plus, X, Wallet, TrendingUp, TrendingDown, Clock, Calendar } from 'lucide-react';
import { formatCurrency } from '../../../utils/currency';

export function CashRegisterPage() {
  const branchId = useAuthStore((s) => s.user?.branchId);
  const queryClient = useQueryClient();
  const [showMovementForm, setShowMovementForm] = useState(false);
  const [movementForm, setMovementForm] = useState({
    type: 'cash_in' as 'cash_in' | 'cash_out',
    amount: '',
    description: '',
  });

  const userId = useAuthStore((s) => s.user?.id);

  const { data: currentRegister } = useQuery({
    queryKey: ['cash-register-current', branchId],
    queryFn: () => api.get(`/cash-register/current?branchId=${branchId}`).then((r) => r.data).catch((err) => {
      if (err.response?.status === 404) return null;
      throw err;
    }),
    enabled: !!branchId,
    retry: (failureCount, error: any) => error?.response?.status !== 404 && failureCount < 3,
  });

  const { data: movements } = useQuery({
    queryKey: ['cash-movements', currentRegister?.id],
    queryFn: () => api.get(`/cash-register/${currentRegister.id}/movements`).then((r) => r.data),
    enabled: !!currentRegister?.id,
  });

  const registers = currentRegister ? [currentRegister] : [];

  const openRegister = useMutation({
    mutationFn: (openingAmount: number) =>
      api.post('/cash-register/open', { branchId, cashierId: userId, openingBalance: openingAmount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-register-current'] });
      toast.success('Caja abierta');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Error'),
  });

  const closeRegister = useMutation({
    mutationFn: (id: string) => api.post('/cash-register/close', { registerId: id, actualBalance: 0 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-register-current'] });
      toast.success('Caja cerrada');
    },
  });

  const addMovement = useMutation({
    mutationFn: (data: any) => api.post('/cash-register/movement', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-movements'] });
      queryClient.invalidateQueries({ queryKey: ['cash-register-current'] });
      setShowMovementForm(false);
      setMovementForm({ type: 'cash_in', amount: '', description: '' });
      toast.success('Movimiento registrado');
    },
  });

  const activeRegister = currentRegister?.status === 'open' ? currentRegister : null;

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-[var(--text-main)] tracking-tight">Gestión de Caja</h2>
          <p className="text-[var(--text-muted)] mt-1 font-medium">Control de ingresos, gastos y movimientos diarios</p>
        </div>

        <div className="flex items-center gap-3">
          {!activeRegister ? (
            <button
              onClick={() => {
                const amount = prompt('Monto de apertura:');
                if (amount) openRegister.mutate(parseFloat(amount));
              }}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Unlock size={20} />
              <span>Abrir Turno de Caja</span>
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowMovementForm(true)}
                className="flex items-center gap-2 px-5 py-3 bg-white text-[var(--primary)] border border-blue-100 rounded-2xl font-bold hover:bg-blue-50 transition-all shadow-sm"
              >
                <Plus size={20} />
                <span>Movimiento</span>
              </button>
              <button
                onClick={() => {
                  if (confirm('¿Cerrar caja?')) closeRegister.mutate(activeRegister.id);
                }}
                className="flex items-center gap-2 px-5 py-3 bg-white text-[var(--error)] border border-red-50 rounded-2xl font-bold hover:bg-red-50 transition-all shadow-sm"
              >
                <Lock size={20} />
                <span>Cerrar Caja</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Active Register Status Card */}
      {activeRegister && (
        <div className="glass-card overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Wallet size={120} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-white/20">
            <div className="p-8 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--primary)] uppercase tracking-widest">
                <Clock size={14} />
                <span>Estado Actual</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-[var(--text-main)]">Abierta</span>
                <span className="text-xs font-bold text-green-500">Activa</span>
              </div>
              <p className="text-sm text-[var(--text-muted)] font-medium">
                Desde las {new Date(activeRegister.openedAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            <div className="p-8 space-y-2">
              <span className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Apertura</span>
              <div className="text-3xl font-black text-[var(--text-main)] ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
                {formatCurrency(activeRegister.openingAmount)}
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--text-muted)]">
                <Calendar size={14} />
                <span>{new Date(activeRegister.openedAt).toLocaleDateString('es-AR')}</span>
              </div>
            </div>

            <div className="p-8 space-y-2">
              <span className="text-xs font-bold text-green-500 uppercase tracking-widest">Ventas Efectivo</span>
              <div className="text-3xl font-black text-green-600">
                {formatCurrency(activeRegister.cashSales || 0)}
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-green-500/70">
                <TrendingUp size={14} />
                <span>Incremento ventas</span>
              </div>
            </div>

            <div className="p-8 space-y-2 bg-gradient-to-br from-blue-50/50 to-transparent">
              <span className="text-xs font-bold text-[var(--primary)] uppercase tracking-widest">Saldo en Caja</span>
              <div className="text-4xl font-black text-[var(--primary)]">
                {formatCurrency(activeRegister.currentAmount || activeRegister.openingAmount)}
              </div>
              <p className="text-xs font-bold text-[var(--text-muted)]">Actualizado en tiempo real</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Daily Movements Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
              <History size={20} className="text-[var(--primary)]" />
              Movimientos del Día
            </h3>
            <span className="px-3 py-1 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full text-xs font-bold uppercase tracking-wider">
              {movements?.length || 0} Registros
            </span>
          </div>

          <div className="glass-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50 text-left border-b border-white/20">
                  <th className="px-6 py-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Hora</th>
                  <th className="px-6 py-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Tipo</th>
                  <th className="px-6 py-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest">Concepto</th>
                  <th className="px-6 py-4 text-xs font-bold text-[var(--text-muted)] uppercase tracking-widest text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100/30">
                {movements?.map((m: any) => (
                  <tr key={m.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="px-6 py-4 text-sm font-bold text-[var(--text-main)]">
                      {new Date(m.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4">
                      <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${m.type === 'cash_in' || m.type === 'sale'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                        }`}>
                        {m.type === 'cash_out' ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
                        {m.type === 'cash_in' ? 'Ingreso' :
                          m.type === 'cash_out' ? 'Retiro' :
                            m.type === 'sale' ? 'Venta' : m.type}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-[var(--text-muted)] group-hover:text-[var(--text-main)] transition-colors">
                        {m.description || 'Sin descripción'}
                      </p>
                    </td>
                    <td className={`px-6 py-4 text-right font-black text-base ${m.type === 'cash_out' ? 'text-red-500' : 'text-green-600'
                      }`}>
                      {m.type === 'cash_out' ? '-' : '+'}{formatCurrency(m.amount)}
                    </td>
                  </tr>
                ))}
                {(!movements || movements.length === 0) && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center gap-3 text-[var(--text-muted)]">
                        <History size={40} className="opacity-20" />
                        <p className="font-bold">No se han registrado movimientos hoy</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar: Shift History */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-bold text-[var(--text-main)] flex items-center gap-2">
              <Calendar size={20} className="text-[var(--primary)]" />
              Turnos Anteriores
            </h3>
          </div>

          <div className="space-y-3">
            {registers?.filter((r: any) => r.status === 'closed').slice(0, 5).map((r: any) => (
              <div key={r.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-[var(--text-main)]">
                      {new Date(r.openedAt).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'short' })}
                    </span>
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                      Cerrado {new Date(r.closedAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-black rounded-md uppercase tracking-tighter">Cerrada</span>
                </div>

                <div className="flex justify-between items-end mt-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Saldo de Cierre</p>
                    <p className="text-xl font-black text-[var(--text-main)]">
                      {formatCurrency(r.closingAmount || r.openingAmount)}
                    </p>
                  </div>
                  <button className="p-2 text-[var(--primary)] hover:bg-blue-50 rounded-xl transition-colors">
                    <Plus size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Movement Form Modal - Glassmorphism style */}
      {showMovementForm && (
        <div className="fixed inset-0 bg-[var(--text-main)]/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]" />

            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-[var(--text-main)]">Registrar Movimiento</h3>
              <button
                onClick={() => setShowMovementForm(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X size={24} className="text-[var(--text-muted)]" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="flex p-1.5 bg-gray-100 rounded-2xl gap-1.5">
                <button
                  onClick={() => setMovementForm({ ...movementForm, type: 'cash_in' })}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${movementForm.type === 'cash_in'
                      ? 'bg-white text-green-600 shadow-sm'
                      : 'text-gray-500 hover:bg-gray-200'
                    }`}
                >
                  <ArrowUpCircle size={18} />
                  <span>Ingreso</span>
                </button>
                <button
                  onClick={() => setMovementForm({ ...movementForm, type: 'cash_out' })}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${movementForm.type === 'cash_out'
                      ? 'bg-white text-red-600 shadow-sm'
                      : 'text-gray-500 hover:bg-gray-200'
                    }`}
                >
                  <ArrowDownCircle size={18} />
                  <span>Retiro</span>
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest px-1">Monto del Movimiento</label>
                  <div className="relative">
                    <div className="absolute left-5 top-1/2 -translate-y-1/2 text-xl font-bold text-[var(--text-muted)]">₲</div>
                    <input
                      className="w-full pl-12 pr-6 py-4 bg-gray-50 border-2 border-transparent focus:border-[var(--primary)] focus:bg-white rounded-2xl text-2xl font-black outline-none transition-all placeholder:text-gray-300"
                      placeholder="0"
                      inputMode="numeric"
                      value={movementForm.amount}
                      onChange={(e) => setMovementForm({ ...movementForm, amount: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-black text-[var(--text-muted)] uppercase tracking-widest px-1">Concepto / Descripción</label>
                  <textarea
                    className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-[var(--primary)] focus:bg-white rounded-2xl text-base font-bold outline-none transition-all placeholder:text-gray-300 min-h-[100px] resize-none"
                    placeholder="Eje: Pago a proveedor, Venta manual, etc."
                    value={movementForm.description}
                    onChange={(e) => setMovementForm({ ...movementForm, description: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                className="flex-1 py-4 bg-gray-100 text-[var(--text-muted)] rounded-2xl font-bold hover:bg-gray-200 transition-all"
                onClick={() => setShowMovementForm(false)}
              >
                Cancelar
              </button>
              <button
                className="flex-[2] py-4 bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] text-white rounded-2xl font-bold shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                onClick={() =>
                  addMovement.mutate({
                    registerId: activeRegister?.id,
                    type: movementForm.type,
                    amount: parseFloat(movementForm.amount),
                    description: movementForm.description,
                  })
                }
                disabled={!movementForm.amount || addMovement.isPending}
              >
                {addMovement.isPending ? 'Procesando...' : 'Confirmar Registro'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
