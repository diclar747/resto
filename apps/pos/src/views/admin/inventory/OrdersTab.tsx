import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../api/client';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { Plus, ShoppingCart, Calendar, Clock, CheckCircle, XCircle, Search, Eye, PackageCheck } from 'lucide-react';

export function OrdersTab({ branchId }: { branchId: string }) {
    const queryClient = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const { data: orders, isLoading } = useQuery({
        queryKey: ['purchase-orders', branchId],
        queryFn: () => api.get(`/suppliers/purchase-orders?branchId=${branchId}`).then((r) => r.data),
    });

    const { data: suppliers } = useQuery({
        queryKey: ['suppliers', branchId],
        queryFn: () => api.get(`/suppliers?branchId=${branchId}`).then((r) => r.data),
    });

    const { data: ingredients } = useQuery({
        queryKey: ['ingredients', branchId],
        queryFn: () => api.get(`/inventory/ingredients?branchId=${branchId}`).then((r) => r.data),
    });

    const [orderForm, setOrderForm] = useState({
        supplierId: '',
        items: [{ ingredientId: '', quantity: 1, unitPrice: 0 }],
        notes: '',
        expectedDate: ''
    });

    const createOrder = useMutation({
        mutationFn: (data: any) => api.post('/suppliers/purchase-orders', { ...data, branchId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
            setShowForm(false);
            setOrderForm({ supplierId: '', items: [{ ingredientId: '', quantity: 1, unitPrice: 0 }], notes: '', expectedDate: '' });
            toast.success('Orden de compra generada');
        },
    });

    const receiveOrder = useMutation({
        mutationFn: ({ id, items }: { id: string, items: any[] }) =>
            api.post(`/suppliers/purchase-orders/${id}/receive`, { items }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
            queryClient.invalidateQueries({ queryKey: ['stock'] });
            toast.success('Mercadería recibida e inventario actualizado');
        },
    });

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'PENDING': return 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400';
            case 'RECEIVED': return 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400';
            case 'CANCELLED': return 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400';
            default: return 'bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-white/60';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4 border-b border-gray-100 dark:border-white/10 pb-6">
                <div>
                    <h4 className="text-xl font-black text-secondary uppercase tracking-tight italic">Procurement <span className="text-primary underline">Pipeline</span></h4>
                    <p className="text-[10px] font-bold text-text-secondary mt-1">Órdenes de compra y recepción de insumos</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-primary/20 shadow-xl"
                >
                    <ShoppingCart size={16} /> Crear Orden
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {orders?.map((order: any) => (
                    <div key={order.id} className="bg-white dark:bg-surface rounded-[32px] p-6 shadow-sm border border-gray-50 dark:border-white/5 flex flex-col lg:flex-row lg:items-center justify-between gap-6 group">
                        <div className="flex items-center gap-6">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${getStatusStyle(order.status)}`}>
                                <ShoppingCart size={24} />
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h5 className="text-sm font-black text-secondary uppercase">Order #{order.id.slice(-6)}</h5>
                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${getStatusStyle(order.status)}`}>
                                        {order.status}
                                    </span>
                                </div>
                                <p className="text-xs font-bold text-text-secondary mt-1">
                                    Proveedor: <span className="text-secondary">{order.supplier?.name}</span>
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-8">
                            <div className="flex items-center gap-2">
                                <Calendar size={14} className="text-gray-400 dark:text-white/40" />
                                <div>
                                    <p className="text-[9px] font-black text-gray-400 dark:text-white/40 uppercase">Solicitado</p>
                                    <p className="text-[11px] font-bold text-secondary">{new Date(order.createdAt).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock size={14} className="text-gray-400 dark:text-white/40" />
                                <div>
                                    <p className="text-[9px] font-black text-gray-400 dark:text-white/40 uppercase">Esperado</p>
                                    <p className="text-[11px] font-bold text-secondary">{order.expectedDate ? new Date(order.expectedDate).toLocaleDateString() : 'N/A'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <PackageCheck size={14} className="text-primary" />
                                <div>
                                    <p className="text-[9px] font-black text-gray-400 dark:text-white/40 uppercase">Total Items</p>
                                    <p className="text-[11px] font-bold text-secondary">{order.items?.length || 0} Insumos</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => { /* View details */ }}
                                className="p-3 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 dark:text-white/40 hover:text-secondary rounded-2xl transition-all"
                            >
                                <Eye size={18} />
                            </button>
                            {order.status === 'PENDING' && (
                                <button
                                    onClick={() => {
                                        const receivedItems = order.items.map((i: any) => ({ ingredientId: i.ingredientId, receivedQty: i.quantity }));
                                        if (confirm('¿Confirmar recepción total de mercadería?')) receiveOrder.mutate({ id: order.id, items: receivedItems });
                                    }}
                                    className="px-6 py-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                                >
                                    Recibir Mercadería
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {showForm && (
                <div className="fixed inset-0 bg-secondary/80 backdrop-blur-sm flex items-center justify-center z-[130] p-4">
                    <div className="bg-white dark:bg-surface rounded-[40px] p-10 w-full max-w-2xl shadow-2xl border border-white dark:border-white/10 max-h-[90vh] overflow-y-auto no-scrollbar">
                        <h3 className="text-2xl font-black text-secondary tracking-tighter mb-8">New <span className="text-primary">Purchase Order</span></h3>

                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-2 block px-2">Seleccionar Proveedor</label>
                                <select
                                    className="w-full px-6 py-4 bg-gray-50 dark:bg-white/5 border-none rounded-2xl text-sm font-bold outline-none appearance-none dark:bg-surface dark:text-text-main dark:[color-scheme:dark]"
                                    value={orderForm.supplierId}
                                    onChange={(e) => setOrderForm({ ...orderForm, supplierId: e.target.value })}
                                >
                                    <option value="">Buscar Proveedor Corporate...</option>
                                    {suppliers?.map((s: any) => (
                                        <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2 px-2">
                                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Insumos a Solicitar</label>
                                    <button
                                        onClick={() => setOrderForm({ ...orderForm, items: [...orderForm.items, { ingredientId: '', quantity: 1, unitPrice: 0 }] })}
                                        className="text-[10px] font-black text-primary uppercase"
                                    >
                                        + Añadir Ítem
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {orderForm.items.map((item, i) => (
                                        <div key={i} className="flex gap-3 bg-gray-50 dark:bg-white/5 p-4 rounded-[24px]">
                                            <select
                                                className="flex-1 bg-white dark:bg-surface px-4 py-3 rounded-xl text-xs font-bold outline-none border-none dark:text-text-main dark:[color-scheme:dark]"
                                                value={item.ingredientId}
                                                onChange={(e) => {
                                                    const items = [...orderForm.items];
                                                    items[i].ingredientId = e.target.value;
                                                    setOrderForm({ ...orderForm, items });
                                                }}
                                            >
                                                <option value="">Insumo...</option>
                                                {ingredients?.map((ing: any) => (
                                                    <option key={ing.id} value={ing.id}>{ing.name}</option>
                                                ))}
                                            </select>
                                            <input
                                                type="number"
                                                placeholder="Cant"
                                                className="w-24 bg-white dark:bg-surface px-4 py-3 rounded-xl text-xs font-bold outline-none border-none dark:text-text-main"
                                                value={item.quantity}
                                                onChange={(e) => {
                                                    const items = [...orderForm.items];
                                                    items[i].quantity = parseFloat(e.target.value);
                                                    setOrderForm({ ...orderForm, items });
                                                }}
                                            />
                                            <input
                                                type="number"
                                                placeholder="Precio"
                                                className="w-24 bg-white dark:bg-surface px-4 py-3 rounded-xl text-xs font-bold outline-none border-none dark:text-text-main"
                                                value={item.unitPrice}
                                                onChange={(e) => {
                                                    const items = [...orderForm.items];
                                                    items[i].unitPrice = parseFloat(e.target.value);
                                                    setOrderForm({ ...orderForm, items });
                                                }}
                                            />
                                            <button
                                                onClick={() => setOrderForm({ ...orderForm, items: orderForm.items.filter((_, idx) => idx !== i) })}
                                                className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-2 block px-2">Fecha Estimada</label>
                                    <input
                                        type="date"
                                        className="w-full px-6 py-4 bg-gray-50 dark:bg-white/5 border-none rounded-2xl text-sm font-bold outline-none dark:text-text-main dark:[color-scheme:dark]"
                                        value={orderForm.expectedDate}
                                        onChange={(e) => setOrderForm({ ...orderForm, expectedDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-2 block px-2">Notas</label>
                                    <input
                                        className="w-full px-6 py-4 bg-gray-50 dark:bg-white/5 border-none rounded-2xl text-sm font-bold outline-none dark:text-text-main"
                                        placeholder="Observaciones de entrega..."
                                        value={orderForm.notes}
                                        onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4 mt-10">
                            <button onClick={() => setShowForm(false)} className="flex-1 py-4 bg-gray-100 dark:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-gray-200">Cancelar</button>
                            <button
                                onClick={() => createOrder.mutate(orderForm)}
                                disabled={!orderForm.supplierId || orderForm.items.length === 0}
                                className="flex-[2] py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                            >
                                Generar Orden
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const Trash2 = ({ size }: { size: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /><line x1="10" x2="10" y1="11" y2="17" /><line x1="14" x2="14" y1="11" y2="17" /></svg>
);
