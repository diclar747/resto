import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../stores/auth.store';
import api from '../../../api/client';
import toast from 'react-hot-toast';
import { useState } from 'react';
import {
    Globe, Layout, Share2, MessageCircle, Save,
    Image as ImageIcon, Star, Settings, ExternalLink,
    CheckCircle2, Zap
} from 'lucide-react';

export function StoreBrandingPage() {
    const branchId = useAuthStore((s) => s.user?.branchId);
    const queryClient = useQueryClient();
    const [activeTab, setActiveTab] = useState<'profile' | 'marketplace' | 'specials'>('profile');

    const { data: branch, isLoading } = useQuery({
        queryKey: ['branch', branchId],
        queryFn: () => api.get(`/branches/${branchId}`).then((r) => r.data),
        enabled: !!branchId,
    });

    const [form, setForm] = useState({
        name: '', bannerUrl: '', whatsappNumber: '', logoUrl: '', description: ''
    });

    // Sync state with branch data when it loads
    if (branch && !form.name) {
        setForm({
            name: branch.name || '',
            bannerUrl: branch.bannerUrl || '',
            whatsappNumber: branch.whatsappNumber || '',
            logoUrl: branch.logoUrl || '',
            description: branch.description || ''
        });
    }

    const updateBranch = useMutation({
        mutationFn: (data: any) => api.put(`/branches/${branchId}`, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['branch'] });
            toast.success('Configuración de marca actualizada');
        },
    });

    return (
        <div className="p-8 space-y-8 bg-[#F4F7FE] min-h-screen font-outfit">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-secondary tracking-tighter">Store <span className="text-primary italic">Identity</span></h2>
                    <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] mt-1">Branding, Marketplace and Customer Reach</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex p-1.5 bg-white dark:bg-surface rounded-2xl shadow-sm border border-gray-100 dark:border-white/10">
                        {[
                            { id: 'profile', icon: Layout, label: 'Visuals' },
                            { id: 'marketplace', icon: Globe, label: 'Market' },
                            { id: 'specials', icon: Star, label: 'Specials' }
                        ].map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setActiveTab(t.id as any)}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === t.id ? 'bg-secondary text-white shadow-lg' : 'text-text-secondary hover:text-secondary'
                                    }`}
                            >
                                <t.icon size={14} /> {t.label}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => updateBranch.mutate(form)}
                        className="px-6 py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                    >
                        <Save size={16} className="inline mr-2" /> Save Config
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Form Settings */}
                <div className="lg:col-span-7 space-y-8">
                    {activeTab === 'profile' && (
                        <div className="bg-white dark:bg-surface rounded-[40px] p-10 shadow-card space-y-8 animate-in fade-in duration-500">
                            <div className="space-y-6">
                                <h3 className="text-2xl font-black text-secondary tracking-tight">Identity <span className="text-primary">& Visuals</span></h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 dark:text-white/40 uppercase tracking-widest ml-2">Store Name</label>
                                        <input
                                            className="w-full px-6 py-4 bg-[#F4F7FE] border-none rounded-[24px] text-sm font-bold outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                                            value={form.name}
                                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 dark:text-white/40 uppercase tracking-widest ml-2">WhatsApp Direct</label>
                                        <div className="relative">
                                            <MessageCircle className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-500" size={18} />
                                            <input
                                                className="w-full pl-14 pr-6 py-4 bg-[#F4F7FE] border-none rounded-[24px] text-sm font-bold outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                                                placeholder="+595 9xx xxx xxx"
                                                value={form.whatsappNumber}
                                                onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 dark:text-white/40 uppercase tracking-widest ml-2">Brand Brief</label>
                                    <textarea
                                        className="w-full px-6 py-4 bg-[#F4F7FE] border-none rounded-[24px] text-sm font-bold outline-none focus:ring-4 focus:ring-primary/5 transition-all min-h-[120px] resize-none"
                                        placeholder="Cuéntale a tus clientes sobre tu restaurante..."
                                        value={form.description}
                                        onChange={(e) => setForm({ ...form, description: e.target.value })}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 dark:text-white/40 uppercase tracking-widest ml-2">Logo Illustration URL</label>
                                        <div className="relative">
                                            <ImageIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                            <input
                                                className="w-full pl-14 pr-6 py-4 bg-[#F4F7FE] border-none rounded-[24px] text-sm font-bold outline-none"
                                                value={form.logoUrl}
                                                onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 dark:text-white/40 uppercase tracking-widest ml-2">Marketplace Banner URL</label>
                                        <div className="relative">
                                            <ImageIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                                            <input
                                                className="w-full pl-14 pr-6 py-4 bg-[#F4F7FE] border-none rounded-[24px] text-sm font-bold outline-none"
                                                value={form.bannerUrl}
                                                onChange={(e) => setForm({ ...form, bannerUrl: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'marketplace' && (
                        <div className="bg-white dark:bg-surface rounded-[40px] p-10 shadow-card space-y-8 animate-in fade-in duration-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-2xl font-black text-secondary tracking-tight">Sync <span className="text-primary">Status</span></h3>
                                    <p className="text-[10px] font-black text-gray-400 dark:text-white/40 uppercase tracking-widest mt-1 italic">Conectado a Resto Market Hub</p>
                                </div>
                                <div className="px-5 py-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center gap-2">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">En Línea</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-6 bg-[#F4F7FE] rounded-[32px] border border-transparent hover:border-primary/20 transition-all cursor-pointer group">
                                    <div className="w-12 h-12 bg-white dark:bg-surface rounded-2xl flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform">
                                        <Share2 className="text-primary" size={24} />
                                    </div>
                                    <h4 className="text-sm font-black text-secondary uppercase">Social Sync</h4>
                                    <p className="text-[10px] font-medium text-gray-400 dark:text-white/40 mt-2">Sincroniza automáticamente tu menú con Facebook & Instagram Catalog.</p>
                                    <div className="mt-4 flex items-center gap-2 text-primary">
                                        <span className="text-[9px] font-black uppercase tracking-widest">Configurar</span>
                                        <ChevronRight size={14} />
                                    </div>
                                </div>
                                <div className="p-6 bg-[#F4F7FE] rounded-[32px] border border-transparent hover:border-primary/20 transition-all cursor-pointer group">
                                    <div className="w-12 h-12 bg-white dark:bg-surface rounded-2xl flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform">
                                        <Zap className="text-amber-500 dark:text-amber-400" size={24} />
                                    </div>
                                    <h4 className="text-sm font-black text-secondary uppercase">Market SEO</h4>
                                    <p className="text-[10px] font-medium text-gray-400 dark:text-white/40 mt-2">Optimiza tu visibilidad en los buscadores del marketplace.</p>
                                    <div className="mt-4 flex items-center gap-2 text-primary">
                                        <span className="text-[9px] font-black uppercase tracking-widest">Gestionar Tags</span>
                                        <ChevronRight size={14} />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-secondary p-8 rounded-[32px] text-white flex items-center justify-between">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Marketplace Link</p>
                                    <p className="text-lg font-black tracking-tight mt-1">resto.market/{form.name.toLowerCase().replace(/\s/g, '-')}</p>
                                </div>
                                <button className="p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all"><ExternalLink size={20} /></button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'specials' && (
                        <div className="bg-white dark:bg-surface rounded-[40px] p-10 shadow-card space-y-8 animate-in fade-in duration-500">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-2xl font-black text-secondary tracking-tight italic text-primary">Plato <span className="text-secondary underline font-black">del Día</span></h3>
                                    <p className="text-[10px] font-black text-gray-400 dark:text-white/40 uppercase tracking-widest mt-1 italic">Promociones destacadas en portada</p>
                                </div>
                                <button className="p-3 bg-secondary text-white rounded-xl shadow-lg shadow-secondary/20 hover:scale-110 active:scale-90 transition-all"><Plus size={20} /></button>
                            </div>

                            <div className="space-y-4">
                                {[
                                    { day: 'Lunes', dish: 'Tallarines con Albóndigas', price: '25.000', active: true },
                                    { day: 'Martes', dish: 'Asado a la Olla', price: '35.000', active: true },
                                    { day: 'Miércoles', dish: 'Vatapa Especial', price: '28.000', active: false },
                                ].map((s, i) => (
                                    <div key={i} className={`p-6 bg-[#F4F7FE] rounded-[32px] flex items-center justify-between group transition-all ${!s.active ? 'opacity-50 grayscale' : ''}`}>
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 bg-white dark:bg-surface rounded-2xl flex items-center justify-center font-black text-secondary shadow-sm">
                                                {s.day[0]}
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-gray-400 dark:text-white/40 uppercase tracking-[0.2em]">{s.day}</p>
                                                <p className="text-sm font-black text-secondary italic">{s.dish}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <p className="text-lg font-black text-primary">$ {s.price}</p>
                                            <div className="w-10 h-6 bg-gray-200 rounded-full relative cursor-pointer">
                                                <div className={`absolute top-1 w-4 h-4 rounded-full transition-all ${s.active ? 'right-1 bg-primary' : 'left-1 bg-white'}`} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Preview */}
                <div className="lg:col-span-5 space-y-8">
                    <div className="sticky top-8 space-y-6">
                        <h4 className="text-[10px] font-black text-gray-400 dark:text-white/40 uppercase tracking-[0.3em] ml-2">Marketplace Preview</h4>

                        <div className="bg-white dark:bg-surface rounded-[40px] shadow-2xl overflow-hidden border border-white dark:border-white/10">
                            {/* Mock Mobile View */}
                            <div className="h-20 bg-emerald-500/10 p-6 flex items-center justify-between border-b border-white/20">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white dark:bg-surface rounded-full p-2 shadow-inner">
                                        {form.logoUrl ? <img src={form.logoUrl} className="w-full h-full object-contain" /> : <ImageIcon className="text-gray-200" />}
                                    </div>
                                    <h5 className="font-black text-secondary text-sm italic">{form.name || 'Your Resto'}</h5>
                                </div>
                                <div className="w-10 h-10 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                                    <MessageCircle size={20} />
                                </div>
                            </div>

                            <div className="aspect-video relative overflow-hidden">
                                {form.bannerUrl ? (
                                    <img src={form.bannerUrl} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-300">
                                        <ImageIcon size={48} />
                                    </div>
                                )}
                                <div className="absolute inset-x-0 bottom-0 p-8 bg-gradient-to-t from-black/80 to-transparent text-white">
                                    <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-emerald-400 mb-1">
                                        <CheckCircle2 size={12} /> Resto Verified
                                    </div>
                                    <h5 className="text-2xl font-black tracking-tighter italic">{form.name || 'Restaurante Name'}</h5>
                                    <p className="text-xs font-medium opacity-80 line-clamp-2 mt-2">{form.description || 'Describe your passion for food here...'}</p>
                                </div>
                            </div>

                            <div className="p-8 space-y-6">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-white/40">Featured Today</span>
                                    <span className="text-[10px] font-black uppercase text-primary underline">Ver Menú Completo</span>
                                </div>

                                <div className="p-6 bg-[#F4F7FE] rounded-[32px] border border-transparent shadow-sm flex items-center gap-4">
                                    <div className="w-14 h-14 bg-white dark:bg-surface rounded-2xl shadow-inner" />
                                    <div className="flex-1">
                                        <p className="text-sm font-black text-secondary italic">Plato Especial Resto</p>
                                        <p className="text-[9px] font-bold text-gray-400 dark:text-white/40 uppercase tracking-widest mt-1">Lunes de Tradición</p>
                                    </div>
                                    <p className="text-lg font-black text-primary">$ 25.000</p>
                                </div>
                            </div>

                            <div className="p-8 pt-0">
                                <button className="w-full py-5 bg-secondary text-white rounded-[28px] text-[11px] font-black uppercase tracking-[0.2em] shadow-xl shadow-secondary/30">
                                    Hacer Pedido vía WhatsApp
                                </button>
                            </div>
                        </div>

                        <div className="p-6 bg-white dark:bg-surface rounded-[32px] border border-white dark:border-white/10 shadow-xl flex items-center gap-4">
                            <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/30 text-amber-500 dark:text-amber-400 rounded-2xl flex items-center justify-center">
                                <Zap size={24} />
                            </div>
                            <div>
                                <p className="text-sm font-black text-secondary uppercase italic">Turbo Boost Active</p>
                                <p className="text-[10px] font-medium text-gray-400 dark:text-white/40">Tu restaurante está destacado en el radio local de 5km.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

const ChevronRight = ({ size }: { size: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-right"><path d="m9 18 6-6-6-6" /></svg>
);

const Plus = ({ size }: { size: number }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
);
