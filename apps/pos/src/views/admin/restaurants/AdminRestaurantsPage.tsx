import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../api/client';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../../stores/auth.store';
import {
    Store, Plus, Search, Edit3, Trash2, CheckCircle,
    XCircle, ToggleLeft, ToggleRight, MapPin, X, ExternalLink
} from 'lucide-react';

export function AdminRestaurantsPage() {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState<string | null>(null);
    const [form, setForm] = useState({
        name: '', address: '', phone: '', whatsapp: '', bannerUrl: ''
    });

    const { data: branches, isLoading } = useQuery({
        queryKey: ['admin-branches'],
        queryFn: () => api.get('/branches?includeInactive=true').then(r => r.data),
    });

    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-branches'] });
    const invalidateMarketplace = () => queryClient.invalidateQueries({ queryKey: ['marketplace-branches'] });

    const createBranch = useMutation({
        mutationFn: (data: any) => api.post('/branches', data),
        onSuccess: () => {
            invalidate();
            closeModal();
            toast.success('Restaurante creado exitosamente');
        },
        onError: (err: any) => toast.error(err.response?.data?.message || 'Error al crear'),
    });

    const updateBranch = useMutation({
        mutationFn: ({ id, data }: { id: string, data: any }) => api.patch(`/branches/${id}`, data),
        onSuccess: () => {
            invalidate();
            invalidateMarketplace();
            closeModal();
            toast.success('Restaurante actualizado');
        },
    });

    const toggleStatus = useMutation({
        mutationFn: ({ id, isActive }: { id: string, isActive: boolean }) => api.patch(`/branches/${id}`, { isActive }),
        onSuccess: (_, vars) => {
            invalidate();
            invalidateMarketplace();
            toast.success(vars.isActive ? 'Restaurante activado y visible' : 'Restaurante pausado');
        }
    });

    const deleteBranch = useMutation({
        mutationFn: (id: string) => api.delete(`/branches/${id}`),
        onSuccess: () => {
            invalidate();
            invalidateMarketplace();
            toast.success('Restaurante eliminado');
        }
    });

    const openCreate = () => {
        setForm({ name: '', address: '', phone: '', whatsapp: '', bannerUrl: '' });
        setEditMode(null);
        setShowModal(true);
    };

    const openEdit = (branch: any) => {
        setForm({
            name: branch.name || '',
            address: branch.address || '',
            phone: branch.phone || '',
            whatsapp: branch.whatsapp || '',
            bannerUrl: branch.bannerUrl || ''
        });
        setEditMode(branch.id);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditMode(null);
    };

    const handleSave = () => {
        if (editMode) {
            updateBranch.mutate({ id: editMode, data: form });
        } else {
            createBranch.mutate(form);
        }
    };

    const filteredBranches = branches?.filter((b: any) =>
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.address || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-4 md:p-8 space-y-8 bg-background min-h-screen">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-secondary tracking-tight">Gestión de <span className="text-primary italic">Restaurantes</span></h1>
                    <p className="text-sm font-medium text-text-secondary mt-1">
                        Administra los locales y su visibilidad en el Marketplace
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40 group-focus-within:text-primary transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar sucursal..."
                            className="pl-12 pr-6 py-3 bg-white dark:bg-surface border border-gray-100 dark:border-white/10 rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm w-64"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-primary/20"
                    >
                        <Plus size={16} /> Nuevo
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <div key={i} className="h-64 bg-white/60 animate-pulse rounded-[32px]" />)}
                </div>
            ) : filteredBranches?.length === 0 ? (
                <div className="text-center py-20 text-gray-400">No hay restaurantes registrados.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredBranches?.map((branch: any) => {
                        const isActive = branch.isActive;
                        return (
                            <div key={branch.id} className={`bg-white dark:bg-surface rounded-[32px] p-6 shadow-card border-none transition-all group overflow-hidden relative ${!isActive && 'opacity-70'}`}>
                                {/* Image Banner */}
                                <div className="w-full h-32 bg-gray-100 dark:bg-white/5 rounded-2xl mb-5 overflow-hidden flex items-center justify-center relative">
                                    {branch.bannerUrl ? (
                                        <img src={branch.bannerUrl} alt={branch.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <Store size={40} className="text-gray-300 dark:text-white/20" />
                                    )}
                                    {/* Status Overlay */}
                                    <div className="absolute top-3 right-3">
                                        <button
                                            onClick={() => toggleStatus.mutate({ id: branch.id, isActive: !isActive })}
                                            title={isActive ? 'Ocultar del Marketplace' : 'Publicar en Marketplace'}
                                            className="bg-white/90 dark:bg-surface/90 backdrop-blur-sm p-1.5 rounded-xl shadow-lg hover:scale-110 transition-transform"
                                        >
                                            {isActive ? (
                                                <ToggleRight size={24} className="text-emerald-500" />
                                            ) : (
                                                <ToggleLeft size={24} className="text-gray-400" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-xl font-black text-secondary dark:text-white tracking-tight leading-none mb-1">{branch.name}</h3>
                                        <div className="flex items-center gap-1.5 text-xs text-text-secondary mt-2">
                                            <MapPin size={12} />
                                            <span className="truncate max-w-[200px]">{branch.address || 'Sin dirección'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 mt-6">
                                    <a
                                        href={`/marketplace`}
                                        target="_blank"
                                        className="flex-1 py-3 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-center transition-colors flex items-center justify-center gap-1.5"
                                    >
                                        <ExternalLink size={12} /> Tienda
                                    </a>
                                    <button
                                        onClick={() => openEdit(branch)}
                                        className="flex-1 py-3 bg-gray-50 dark:bg-white/5 text-secondary dark:text-white hover:bg-primary/10 hover:text-primary rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5"
                                    >
                                        <Edit3 size={12} /> Editar
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (confirm('¿Eliminar ' + branch.name + '? (Esto lo ocultará definitivamente)')) {
                                                deleteBranch.mutate(branch.id);
                                            }
                                        }}
                                        className="w-12 h-10 flex items-center justify-center bg-rose-50 dark:bg-rose-500/10 text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-500/20 rounded-xl transition-colors shrink-0"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {showModal && (
                <div className="fixed inset-0 bg-secondary/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                    <div className="bg-white dark:bg-surface rounded-[40px] p-8 md:p-10 w-full max-w-lg shadow-2xl relative">
                        <button onClick={closeModal} className="absolute top-6 right-6 p-2 bg-gray-100 dark:bg-white/10 hover:bg-gray-200 rounded-xl transition-colors">
                            <X size={16} />
                        </button>

                        <h3 className="text-2xl font-black text-secondary tracking-tight mb-2">
                            {editMode ? 'Editar Restaurante' : 'Nuevo Restaurante'}
                        </h3>
                        <p className="text-xs text-text-secondary uppercase tracking-widest mb-8">Información pública del comercio</p>

                        <div className="space-y-4">
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-2 mb-2 block">Nombre del Local</label>
                                <input className="w-full px-5 py-4 bg-gray-50 dark:bg-white/5 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej. Resto Centro" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-2 mb-2 block">Dirección Física</label>
                                <input className="w-full px-5 py-4 bg-gray-50 dark:bg-white/5 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} placeholder="Ej. Av. Principal 123" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-2 mb-2 block">Teléfono Gral.</label>
                                    <input className="w-full px-5 py-4 bg-gray-50 dark:bg-white/5 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Ej. 112345678" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-2 mb-2 block">WhatsApp</label>
                                    <input className="w-full px-5 py-4 bg-gray-50 dark:bg-white/5 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20" value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} placeholder="Ej. 549112345678" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase tracking-widest text-text-secondary ml-2 mb-2 block">Branding (URL Imagen)</label>
                                <input className="w-full px-5 py-4 bg-gray-50 dark:bg-white/5 border-none rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20" value={form.bannerUrl} onChange={e => setForm({ ...form, bannerUrl: e.target.value })} placeholder="https://..." />
                            </div>
                        </div>

                        <div className="flex gap-4 mt-8">
                            <button onClick={closeModal} className="flex-1 py-4 bg-gray-100 dark:bg-white/10 text-secondary dark:text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-colors">Cancelar</button>
                            <button
                                onClick={handleSave}
                                disabled={!form.name || createBranch.isPending || updateBranch.isPending}
                                className="flex-[2] py-4 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                            >
                                {editMode ? 'Guardar Cambios' : 'Añadir Restaurante'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
