import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../api/client';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { Plus, User, Mail, Phone, MapPin, Trash2, Edit3, Search } from 'lucide-react';

export function SuppliersTab({ branchId }: { branchId: string }) {
    const queryClient = useQueryClient();
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [form, setForm] = useState({
        name: '', contactName: '', email: '', phone: '', address: '', taxId: '', notes: ''
    });

    const { data: suppliers, isLoading } = useQuery({
        queryKey: ['suppliers', branchId],
        queryFn: () => api.get(`/suppliers?branchId=${branchId}`).then((r) => r.data),
    });

    const createSupplier = useMutation({
        mutationFn: (data: any) => api.post('/suppliers', { ...data, branchIds: [branchId] }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            setShowForm(false);
            setForm({ name: '', contactName: '', email: '', phone: '', address: '', taxId: '', notes: '' });
            toast.success('Proveedor registrado');
        },
    });

    const deleteSupplier = useMutation({
        mutationFn: (id: string) => api.delete(`/suppliers/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['suppliers'] });
            toast.success('Proveedor eliminado');
        },
    });

    const filteredSuppliers = suppliers?.filter((s: any) =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.contactName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar proveedores..."
                        className="w-full pl-12 pr-6 py-3 bg-white dark:bg-surface border border-gray-100 dark:border-white/10 rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 outline-none dark:text-text-main"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="flex items-center gap-2 px-6 py-3 bg-secondary text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-secondary/20"
                >
                    <Plus size={16} /> Nuevo Proveedor
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredSuppliers?.map((s: any) => (
                    <div key={s.id} className="bg-white dark:bg-surface rounded-[32px] p-6 shadow-sm border border-gray-50 dark:border-white/5 hover:shadow-md transition-shadow group">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center font-black text-lg">
                                {s.name[0]}
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-2 text-gray-400 dark:text-white/40 hover:text-primary"><Edit3 size={16} /></button>
                                <button
                                    onClick={() => { if (confirm('¿Eliminar?')) deleteSupplier.mutate(s.id); }}
                                    className="p-2 text-gray-400 dark:text-white/40 hover:text-rose-500"
                                ><Trash2 size={16} /></button>
                            </div>
                        </div>

                        <h4 className="text-lg font-black text-secondary mb-1">{s.name}</h4>
                        <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-[11px] font-bold text-text-secondary">
                                <User size={12} /> {s.contactName || 'Sin contacto'}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] font-bold text-text-secondary">
                                <Mail size={12} /> {s.email || 'Sin email'}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] font-bold text-text-secondary">
                                <Phone size={12} /> {s.phone || 'Sin teléfono'}
                            </div>
                        </div>

                        <button className="w-full py-2 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-secondary transition-colors">
                            Ver Historial Compras
                        </button>
                    </div>
                ))}
            </div>

            {showForm && (
                <div className="fixed inset-0 bg-secondary/80 backdrop-blur-sm flex items-center justify-center z-[120] p-4">
                    <div className="bg-white dark:bg-surface rounded-[40px] p-10 w-full max-w-lg shadow-2xl border border-white dark:border-white/10">
                        <h3 className="text-2xl font-black text-secondary tracking-tighter mb-8">Registry <span className="text-primary">Supplier</span></h3>
                        <div className="space-y-4">
                            <input
                                className="w-full px-6 py-4 bg-gray-50 dark:bg-white/5 border-none rounded-2xl text-sm font-bold outline-none dark:text-text-main"
                                placeholder="Nombre Comercial"
                                value={form.name}
                                onChange={(e) => setForm({ ...form, name: e.target.value })}
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <input
                                    className="w-full px-6 py-4 bg-gray-50 dark:bg-white/5 border-none rounded-2xl text-sm font-bold outline-none dark:text-text-main"
                                    placeholder="Contacto"
                                    value={form.contactName}
                                    onChange={(e) => setForm({ ...form, contactName: e.target.value })}
                                />
                                <input
                                    className="w-full px-6 py-4 bg-gray-50 dark:bg-white/5 border-none rounded-2xl text-sm font-bold outline-none dark:text-text-main"
                                    placeholder="Teléfono"
                                    value={form.phone}
                                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                />
                            </div>
                            <input
                                className="w-full px-6 py-4 bg-gray-50 dark:bg-white/5 border-none rounded-2xl text-sm font-bold outline-none dark:text-text-main"
                                placeholder="Email"
                                type="email"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                            />
                            <input
                                className="w-full px-6 py-4 bg-gray-50 dark:bg-white/5 border-none rounded-2xl text-sm font-bold outline-none dark:text-text-main"
                                placeholder="ID Fiscal / Tax ID"
                                value={form.taxId}
                                onChange={(e) => setForm({ ...form, taxId: e.target.value })}
                            />
                            <input
                                className="w-full px-6 py-4 bg-gray-50 dark:bg-white/5 border-none rounded-2xl text-sm font-bold outline-none dark:text-text-main"
                                placeholder="Dirección"
                                value={form.address}
                                onChange={(e) => setForm({ ...form, address: e.target.value })}
                            />
                        </div>
                        <div className="flex gap-4 mt-10">
                            <button onClick={() => setShowForm(false)} className="flex-1 py-4 bg-gray-100 dark:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-gray-200">Cancelar</button>
                            <button
                                onClick={() => createSupplier.mutate(form)}
                                disabled={!form.name}
                                className="flex-[2] py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                            >
                                Registrar Proveedor
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
