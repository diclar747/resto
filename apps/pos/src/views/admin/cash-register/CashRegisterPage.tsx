import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../stores/auth.store';
import api from '../../../api/client';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { DollarSign, ArrowUpCircle, ArrowDownCircle, Lock, Unlock } from 'lucide-react';

export function CashRegisterPage() {
  const branchId = useAuthStore((s) => s.user?.branchId);
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();
  const [showMovementForm, setShowMovementForm] = useState(false);
  const [movementForm, setMovementForm] = useState({
    type: 'cash_in' as 'cash_in' | 'cash_out',
    amount: '',
    description: '',
  });

  const { data: registers } = useQuery({
    queryKey: ['cash-registers', branchId],
    queryFn: () => api.get(`/cash-register?branchId=${branchId}`).then((r) => r.data),
    enabled: !!branchId,
  });

  const { data: movements } = useQuery({
    queryKey: ['cash-movements', branchId],
    queryFn: () => api.get(`/cash-register/movements?branchId=${branchId}`).then((r) => r.data),
    enabled: !!branchId,
  });

  const openRegister = useMutation({
    mutationFn: (openingAmount: number) =>
      api.post('/cash-register/open', { branchId, openingAmount }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-registers'] });
      toast.success('Caja abierta');
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Error'),
  });

  const closeRegister = useMutation({
    mutationFn: (id: string) => api.post(`/cash-register/${id}/close`, { branchId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-registers'] });
      toast.success('Caja cerrada');
    },
  });

  const addMovement = useMutation({
    mutationFn: (data: any) => api.post('/cash-register/movements', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cash-movements'] });
      queryClient.invalidateQueries({ queryKey: ['cash-registers'] });
      setShowMovementForm(false);
      setMovementForm({ type: 'cash_in', amount: '', description: '' });
      toast.success('Movimiento registrado');
    },
  });

  const activeRegister = registers?.find((r: any) => r.status === 'open');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Caja Registradora</h2>
        <div className="flex gap-2">
          {!activeRegister ? (
            <button
              onClick={() => {
                const amount = prompt('Monto de apertura:');
                if (amount) openRegister.mutate(parseFloat(amount));
              }}
              className="btn-primary flex items-center gap-2"
            >
              <Unlock size={16} /> Abrir Caja
            </button>
          ) : (
            <>
              <button
                onClick={() => setShowMovementForm(true)}
                className="btn-secondary flex items-center gap-2"
              >
                <DollarSign size={16} /> Movimiento
              </button>
              <button
                onClick={() => {
                  if (confirm('¿Cerrar caja?')) closeRegister.mutate(activeRegister.id);
                }}
                className="btn-ghost text-red-600 flex items-center gap-2"
              >
                <Lock size={16} /> Cerrar Caja
              </button>
            </>
          )}
        </div>
      </div>

      {/* Active register status */}
      {activeRegister && (
        <div className="bg-white rounded-xl border p-5 shadow-sm">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-500">Apertura</p>
              <p className="text-xl font-bold">${Number(activeRegister.openingAmount).toLocaleString('es-AR')}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Ventas efectivo</p>
              <p className="text-xl font-bold text-green-600">
                ${Number(activeRegister.cashSales || 0).toLocaleString('es-AR')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Movimientos</p>
              <p className="text-xl font-bold">
                ${Number(activeRegister.currentAmount || activeRegister.openingAmount).toLocaleString('es-AR')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Abierta desde</p>
              <p className="text-xl font-bold">
                {new Date(activeRegister.openedAt).toLocaleTimeString('es-AR', {
                  hour: '2-digit', minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Movement form modal */}
      {showMovementForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Nuevo Movimiento</h3>
            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  onClick={() => setMovementForm({ ...movementForm, type: 'cash_in' })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                    movementForm.type === 'cash_in'
                      ? 'bg-green-100 text-green-700 border-2 border-green-400'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <ArrowUpCircle size={16} className="inline mr-1" /> Ingreso
                </button>
                <button
                  onClick={() => setMovementForm({ ...movementForm, type: 'cash_out' })}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium ${
                    movementForm.type === 'cash_out'
                      ? 'bg-red-100 text-red-700 border-2 border-red-400'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <ArrowDownCircle size={16} className="inline mr-1" /> Retiro
                </button>
              </div>
              <input
                className="input w-full"
                placeholder="Monto"
                type="number"
                value={movementForm.amount}
                onChange={(e) => setMovementForm({ ...movementForm, amount: e.target.value })}
              />
              <input
                className="input w-full"
                placeholder="Descripción"
                value={movementForm.description}
                onChange={(e) => setMovementForm({ ...movementForm, description: e.target.value })}
              />
            </div>
            <div className="flex gap-2 mt-4 justify-end">
              <button className="btn-ghost" onClick={() => setShowMovementForm(false)}>Cancelar</button>
              <button
                className="btn-primary"
                onClick={() =>
                  addMovement.mutate({
                    ...movementForm,
                    amount: parseFloat(movementForm.amount),
                    cashRegisterId: activeRegister?.id,
                    branchId,
                  })
                }
                disabled={!movementForm.amount}
              >
                Registrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Movements history */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h3 className="font-semibold">Movimientos del día</h3>
        </div>
        <table className="w-full">
          <thead className="border-b">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Hora</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Tipo</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Descripción</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Monto</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {movements?.map((m: any) => (
              <tr key={m.id}>
                <td className="px-4 py-3 text-sm">
                  {new Date(m.createdAt).toLocaleTimeString('es-AR', {
                    hour: '2-digit', minute: '2-digit',
                  })}
                </td>
                <td className="px-4 py-3">
                  <span className={`badge ${
                    m.type === 'cash_in' || m.type === 'sale'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {m.type === 'cash_in' ? 'Ingreso' :
                     m.type === 'cash_out' ? 'Retiro' :
                     m.type === 'sale' ? 'Venta' : m.type}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{m.description || '-'}</td>
                <td className={`px-4 py-3 text-right font-bold ${
                  m.type === 'cash_out' ? 'text-red-600' : 'text-green-600'
                }`}>
                  {m.type === 'cash_out' ? '-' : '+'}${Number(m.amount).toLocaleString('es-AR')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!movements || movements.length === 0) && (
          <div className="text-center py-8 text-gray-400">Sin movimientos</div>
        )}
      </div>

      {/* Register history */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b bg-gray-50">
          <h3 className="font-semibold">Historial de cajas</h3>
        </div>
        <table className="w-full">
          <thead className="border-b">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Fecha</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Estado</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Apertura</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">Cierre</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {registers?.map((r: any) => (
              <tr key={r.id}>
                <td className="px-4 py-3 text-sm">
                  {new Date(r.openedAt).toLocaleDateString('es-AR')}
                </td>
                <td className="px-4 py-3">
                  <span className={`badge ${r.status === 'open' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                    {r.status === 'open' ? 'Abierta' : 'Cerrada'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">${Number(r.openingAmount).toLocaleString('es-AR')}</td>
                <td className="px-4 py-3 text-right">
                  {r.closingAmount ? `$${Number(r.closingAmount).toLocaleString('es-AR')}` : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
