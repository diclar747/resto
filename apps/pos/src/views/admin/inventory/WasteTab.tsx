import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../api/client';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { Trash2, AlertCircle, Calendar, Hash, Tag, Search, PlusCircle } from 'lucide-react';

export function WasteTab({ branchId }: { branchId: string }) {
    const queryClient = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [wasteForm, setWasteForm] = useState({ ingredientId: '', quantity: 1, reason: 'DECAY', notes: '' });

    const { data: ingredients } = useQuery({
        queryKey: ['ingredients', branchId],
        queryFn: () => api.get(`/inventory/ingredients?branchId=${branchId}`).then((r) => r.data),
    });

    const { data: wasteRecords } = useQuery({
        queryKey: ['waste', branchId],
        queryFn: () => api.get(`/inventory/waste?branchId=${branchId}`).then((r) => r.data),
    });

    const recordWaste = useMutation({
        mutationFn: (data: any) => api.post('/inventory/waste', { ...data, branchId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['waste'] });
            queryClient.invalidateQueries({ queryKey: ['stock'] });
            setShowForm(false);
            setWasteForm({ ingredientId: '', quantity: 1, reason: 'DECAY', notes: '' });
            toast.success('Mermas registradas con éxito');
        },
    });

    const reasons = [
        { id: 'DECAY', label: 'Vencimiento / Descomposición', color: 'text-amber-600 dark:text-amber-400' },
        { id: 'SPILLAGE', label: 'Derrame / Rotura', color: 'text-blue-600' },
        { id: 'THEFT', label: 'Perdida / Robo', color: 'text-rose-600 dark:text-rose-400' },
        { id: 'ERROR', label: 'Error Preparación', color: 'text-gray-600 dark:text-white/60' },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 border-b border-gray-100 dark:border-white/10 pb-6">
                <div>
                    <h4 className="text-xl font-black text-secondary uppercase tracking-tight italic">Waste <span className="text-rose-500 underline">Analytics</span></h4>
                    <p className="text-[10px] font-bold text-text-secondary mt-1">Control de mermas, desperdicios y pérdidas operativas</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-rose-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-rose-500/20"
                >
                    <Trash2 size={16} /> Registrar Merma
                </button>
            </div>

            <div className="bg-white dark:bg-surface rounded-[32px] overflow-hidden border border-gray-50 dark:border-white/5 shadow-sm">
                <table className="w-full border-collapse text-left">
                    <thead className="bg-gray-50/50 dark:bg-white/5">
                        <tr>
                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 dark:text-white/40 uppercase tracking-widest">Insumo</th>
                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 dark:text-white/40 uppercase tracking-widest">Cantidad</th>
                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 dark:text-white/40 uppercase tracking-widest">Motivo</th>
                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 dark:text-white/40 uppercase tracking-widest">Fecha</th>
                            <th className="px-8 py-5 text-[10px] font-black text-gray-400 dark:text-white/40 uppercase tracking-widest">Notas</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                        {wasteRecords?.map((record: any) => (
                            <tr key={record.id} className="hover:bg-gray-50/30 dark:hover:bg-white/5 transition-colors">
                                <td className="px-8 py-5">
                                    <p className="text-sm font-black text-secondary">{record.ingredient?.name}</p>
                                </td>
                                <td className="px-8 py-5 text-sm font-bold text-secondary">
                                    {record.quantity} {record.ingredient?.unit}
                                </td>
                                <td className="px-8 py-5">
                                    <span className={`text-[10px] font-black uppercase ${reasons.find(r => r.id === record.reason)?.color || 'text-gray-400 dark:text-white/40'}`}>
                                        {reasons.find(r => r.id === record.reason)?.label || record.reason}
                                    </span>
                                </td>
                                <td className="px-8 py-5 text-xs text-text-secondary font-medium">
                                    {new Date(record.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-8 py-5 text-xs text-text-secondary italic max-w-xs truncate">
                                    {record.notes || '—'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showForm && (
                <div className="fixed inset-0 bg-secondary/80 backdrop-blur-sm flex items-center justify-center z-[140] p-4">
                    <div className="bg-white dark:bg-surface rounded-[40px] p-10 w-full max-w-md shadow-2xl border border-white dark:border-white/10">
                        <h3 className="text-2xl font-black text-secondary tracking-tighter mb-8">Loss <span className="text-rose-500">Registration</span></h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-2 block px-2">Insumo Afectado</label>
                                <select
                                    className="w-full px-6 py-4 bg-gray-50 dark:bg-white/5 border-none rounded-2xl text-sm font-bold outline-none dark:bg-surface dark:text-text-main dark:[color-scheme:dark]"
                                    value={wasteForm.ingredientId}
                                    onChange={(e) => setWasteForm({ ...wasteForm, ingredientId: e.target.value })}
                                >
                                    <option value="">Seleccionar Insumo...</option>
                                    {ingredients?.map((ing: any) => (
                                        <option key={ing.id} value={ing.id}>{ing.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-2 block px-2">Cantidad</label>
                                    <input
                                        type="number"
                                        className="w-full px-6 py-4 bg-gray-50 dark:bg-white/5 border-none rounded-2xl text-sm font-bold outline-none dark:text-text-main dark:[color-scheme:dark]"
                                        value={wasteForm.quantity}
                                        onChange={(e) => setWasteForm({ ...wasteForm, quantity: parseFloat(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-2 block px-2">Motivo</label>
                                    <select
                                        className="w-full px-6 py-4 bg-gray-50 dark:bg-white/5 border-none rounded-2xl text-sm font-bold outline-none dark:bg-surface dark:text-text-main dark:[color-scheme:dark]"
                                        value={wasteForm.reason}
                                        onChange={(e) => setWasteForm({ ...wasteForm, reason: e.target.value })}
                                    >
                                        {reasons.map(r => <option key={r.id} value={r.id}>{r.label.split(' ')[0]}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-2 block px-2">Observaciones</label>
                                <textarea
                                    className="w-full px-6 py-4 bg-gray-50 dark:bg-white/5 border-none rounded-2xl text-sm font-bold outline-none min-h-[100px] resize-none dark:text-text-main"
                                    placeholder="Detalles sobre la pérdida..."
                                    value={wasteForm.notes}
                                    onChange={(e) => setWasteForm({ ...wasteForm, notes: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex gap-4 mt-10">
                            <button onClick={() => setShowForm(false)} className="flex-1 py-4 bg-gray-100 dark:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-gray-200">Cerrar</button>
                            <button
                                onClick={() => recordWaste.mutate(wasteForm)}
                                disabled={!wasteForm.ingredientId || !wasteForm.quantity}
                                className="flex-[2] py-4 bg-rose-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-rose-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                            >
                                Confirmar Merma
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
