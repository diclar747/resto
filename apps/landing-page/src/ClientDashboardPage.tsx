import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
    User, ShoppingBag, Shield, Bell, LogOut, ChevronRight,
    Package, MapPin, Calendar, Phone, Mail, Camera, Save,
    Lock, Smartphone, CheckCircle2, Clock, Utensils, Star, AlertTriangle
} from 'lucide-react';
import api from './api';
import { useClientAuthStore } from './stores/clientAuth.store';

export function ClientDashboardPage({ isDarkMode }: { isDarkMode: boolean }) {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeTab = searchParams.get('tab') || 'overview';
    const navigate = useNavigate();
    const { client, logout } = useClientAuthStore();

    const [profile, setProfile] = useState<any>(null);
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form states
    const [formData, setFormData] = useState<any>({});
    const [securityData, setSecurityData] = useState({ password: '', pin: '' });
    const [notifSettings, setNotifSettings] = useState<any>({});

    useEffect(() => {
        if (!client) {
            navigate('/marketplace');
            return;
        }
        fetchDashboardData();
    }, [client]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [profileRes, ordersRes] = await Promise.all([
                api.get('/marketplace/client/profile'),
                api.get('/marketplace/client/orders')
            ]);
            setProfile(profileRes.data);
            setOrders(ordersRes.data);
            setFormData(profileRes.data);
            setNotifSettings(profileRes.data.settings?.notifications || { email: true, push: true, sms: false });
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            await api.patch('/marketplace/client/profile', formData);
            setProfile({ ...profile, ...formData });
            alert('Perfil actualizado con éxito');
        } catch (error) {
            alert('Error al actualizar el perfil');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateSecurity = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            await api.patch('/marketplace/client/security', securityData);
            setSecurityData({ password: '', pin: '' });
            alert('Seguridad actualizada con éxito');
        } catch (error) {
            alert('Error al actualizar seguridad');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleNotif = async (key: string) => {
        const newSettings = { ...notifSettings, [key]: !notifSettings[key] };
        setNotifSettings(newSettings);
        try {
            await api.patch('/marketplace/client/settings', { notifications: newSettings });
        } catch (e) {
            console.error('Error saving settings');
        }
    };

    if (loading) {
        return (
            <div className={`min-h-screen pt-32 flex justify-center ${isDarkMode ? 'bg-secondary' : 'bg-[#F4F7FE]'}`}>
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const tabs = [
        { id: 'overview', name: 'Resumen', icon: <Package size={20} /> },
        { id: 'orders', name: 'Mis Pedidos', icon: <ShoppingBag size={20} /> },
        { id: 'profile', name: 'Mi Perfil', icon: <User size={20} /> },
        { id: 'security', name: 'Seguridad', icon: <Shield size={20} /> },
        { id: 'notifications', name: 'Notificaciones', icon: <Bell size={20} /> },
    ];

    return (
        <div className={`min-h-screen pt-32 pb-20 px-4 md:px-8 transition-colors duration-500 ${isDarkMode ? 'bg-secondary' : 'bg-[#F4F7FE]'}`}>
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col lg:flex-row gap-4 lg:gap-8">

                    {/* Mobile horizontal tab bar */}
                    <div className="lg:hidden overflow-x-auto no-scrollbar -mx-4 px-4 pb-4">
                        <div className="flex gap-2 w-max">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setSearchParams({ tab: tab.id })}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${activeTab === tab.id
                                            ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                            : isDarkMode ? 'bg-white/5 text-white/60' : 'bg-white text-text-secondary shadow-sm'
                                        }`}
                                >
                                    {tab.icon} {tab.name}
                                </button>
                            ))}
                            <button
                                onClick={() => { logout(); navigate('/marketplace'); }}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold whitespace-nowrap text-rose-500 bg-rose-50 dark:bg-rose-500/10"
                            >
                                <LogOut size={16} /> Salir
                            </button>
                        </div>
                    </div>

                    {/* Sidebar (desktop only) */}
                    <aside className="hidden lg:block w-72 shrink-0">
                        <div className={`p-6 rounded-[32px] border transition-all ${isDarkMode ? 'bg-surface border-white/5' : 'bg-white border-gray-100 shadow-xl shadow-gray-200/50'}`}>
                            <div className="flex items-center gap-4 mb-8 pb-8 border-b border-gray-100 dark:border-white/5">
                                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary overflow-hidden border-2 border-primary/20">
                                    {profile?.avatarUrl ? (
                                        <img src={profile.avatarUrl} className="w-full h-full object-cover" alt="avatar" />
                                    ) : (
                                        <User size={32} />
                                    )}
                                </div>
                                <div>
                                    <h3 className={`font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-secondary'}`}>
                                        {profile?.firstName}
                                    </h3>
                                    <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mt-0.5">Cliente Premium</p>
                                </div>
                            </div>

                            <nav className="space-y-1">
                                {tabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setSearchParams({ tab: tab.id })}
                                        className={`w-full flex items-center justify-between p-4 rounded-2xl font-bold transition-all ${activeTab === tab.id
                                                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                                                : `hover:bg-gray-50 dark:hover:bg-white/5 ${isDarkMode ? 'text-white/60' : 'text-text-secondary'}`
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            {tab.icon}
                                            {tab.name}
                                        </div>
                                        <ChevronRight size={16} className={activeTab === tab.id ? 'opacity-100' : 'opacity-0'} />
                                    </button>
                                ))}
                                <button
                                    onClick={() => { logout(); navigate('/marketplace'); }}
                                    className={`w-full flex items-center gap-3 p-4 rounded-2xl font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all mt-4`}
                                >
                                    <LogOut size={20} />
                                    Cerrar Sesión
                                </button>
                            </nav>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1">
                        <div className={`p-4 sm:p-6 md:p-8 lg:p-12 rounded-3xl sm:rounded-[48px] border transition-all h-full ${isDarkMode ? 'bg-surface border-white/5' : 'bg-white border-gray-100 shadow-2xl shadow-gray-200/50'}`}>

                            {activeTab === 'overview' && (
                                <div className="space-y-12">
                                    <div>
                                        <h2 className={`text-2xl sm:text-3xl font-black mb-2 ${isDarkMode ? 'text-white' : 'text-secondary'}`}>¡Hola, {profile?.firstName}! 👋</h2>
                                        <p className="text-text-secondary font-medium">Gestiona tus pedidos y tu cuenta desde aquí.</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-primary/10 border-primary/20' : 'bg-primary/5 border-primary/10'}`}>
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                                                    <ShoppingBag size={24} />
                                                </div>
                                                <div>
                                                    <div className="text-[10px] font-black uppercase text-primary tracking-widest">Total Pedidos</div>
                                                    <div className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-secondary'}`}>{orders.length}</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-amber-400/10 border-amber-400/20' : 'bg-amber-400/5 border-amber-400/10'}`}>
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="w-12 h-12 bg-amber-400 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-400/20">
                                                    <Star size={24} />
                                                </div>
                                                <div>
                                                    <div className="text-[10px] font-black uppercase text-amber-500 tracking-widest">Puntos Resto</div>
                                                    <div className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-secondary'}`}>{profile?.loyaltyPoints || 0}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-8">
                                            <h3 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-secondary'}`}>Pedido Reciente</h3>
                                            <button onClick={() => setSearchParams({ tab: 'orders' })} className="text-primary font-black text-sm hover:underline">Ver todos</button>
                                        </div>
                                        {orders.length > 0 ? (
                                            <div className={`p-6 rounded-3xl border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-xl bg-white dark:bg-black/20 flex items-center justify-center text-primary shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden">
                                                            {orders[0].branch.settings?.logoUrl ? (
                                                                <img src={orders[0].branch.settings.logoUrl} className="w-full h-full object-cover" alt="local" />
                                                            ) : (
                                                                <Utensils size={24} />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className={`font-black ${isDarkMode ? 'text-white' : 'text-secondary'}`}>{orders[0].branch.name}</div>
                                                            <div className="text-xs font-bold text-text-secondary">{new Date(orders[0].createdAt).toLocaleDateString()}</div>
                                                        </div>
                                                    </div>
                                                    <div className="px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                                                        {orders[0].status}
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/5">
                                                    <div className="text-xs font-bold text-text-secondary">{orders[0].items.length} productos</div>
                                                    <div className="text-lg font-black text-primary">Gs. {Number(orders[0].total).toLocaleString()}</div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 opacity-50">No has realizado pedidos aún.</div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'orders' && (
                                <div className="space-y-8">
                                    <h2 className={`text-2xl sm:text-3xl font-black ${isDarkMode ? 'text-white' : 'text-secondary'}`}>Historial de Pedidos</h2>
                                    <div className="space-y-4">
                                        {orders.map(order => (
                                            <div key={order.id} className={`p-6 rounded-3xl border transition-all hover:-translate-y-1 ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100 shadow-sm'}`}>
                                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-14 h-14 rounded-2xl bg-white dark:bg-black/20 flex items-center justify-center shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden">
                                                            {order.branch.settings?.logoUrl ? (
                                                                <img src={order.branch.settings.logoUrl} className="w-full h-full object-cover" alt="local" />
                                                            ) : (
                                                                <Utensils size={28} />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <div className={`font-black text-lg ${isDarkMode ? 'text-white' : 'text-secondary'}`}>{order.branch.name}</div>
                                                            <div className="flex items-center gap-2 text-xs font-bold text-text-secondary">
                                                                <Calendar size={12} /> {new Date(order.createdAt).toLocaleDateString()}
                                                                <Clock size={12} className="ml-2" /> {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="px-4 py-2 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest w-max">
                                                        {order.status}
                                                    </div>
                                                </div>

                                                <div className="space-y-3 mb-6 bg-gray-50 dark:bg-black/20 p-4 rounded-2xl">
                                                    {order.items.map((item: any) => (
                                                        <div key={item.id} className="flex justify-between items-center text-sm">
                                                            <span className={`font-bold ${isDarkMode ? 'text-white/80' : 'text-secondary/80'}`}>
                                                                <span className="text-primary">{item.quantity}x</span> {item.productVariant.product.name}
                                                            </span>
                                                            <span className="font-black">Gs. {(Number(item.unitPrice) * item.quantity).toLocaleString()}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/5">
                                                    <div className={`text-sm font-bold opacity-60 ${isDarkMode ? 'text-white' : 'text-secondary'}`}>Total Pagado</div>
                                                    <div className="text-2xl font-black text-primary">Gs. {Number(order.total).toLocaleString()}</div>
                                                </div>
                                            </div>
                                        ))}
                                        {orders.length === 0 && <div className="text-center py-20 opacity-50">No hay pedidos registrados.</div>}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'profile' && (
                                <div className="space-y-12">
                                    <h2 className={`text-2xl sm:text-3xl font-black ${isDarkMode ? 'text-white' : 'text-secondary'}`}>Editar Perfil</h2>

                                    <form onSubmit={handleUpdateProfile} className="space-y-8">
                                        <div className="flex flex-col md:flex-row items-center gap-8">
                                            <div className="relative group">
                                                <div className="w-32 h-32 rounded-[32px] bg-primary/10 flex items-center justify-center text-primary overflow-hidden border-4 border-white dark:border-surface shadow-xl">
                                                    {formData.avatarUrl ? (
                                                        <img src={formData.avatarUrl} className="w-full h-full object-cover" alt="avatar" />
                                                    ) : (
                                                        <User size={48} />
                                                    )}
                                                </div>
                                                <button type="button" className="absolute bottom-1 right-1 w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all">
                                                    <Camera size={20} />
                                                </button>
                                            </div>
                                            <div className="flex-1 space-y-2 text-center md:text-left">
                                                <h4 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-secondary'}`}>{profile?.firstName} {profile?.lastName}</h4>
                                                <p className="text-text-secondary font-medium">Sube una foto para personalizar tu cuenta en el marketplace.</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className={`text-sm font-black uppercase tracking-widest ${isDarkMode ? 'text-white/40' : 'text-secondary/40'}`}>Nombre</label>
                                                <div className="relative">
                                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                    <input
                                                        type="text"
                                                        value={formData.firstName || ''}
                                                        onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                                        className={`w-full pl-12 pr-4 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary/40 font-bold border transition-all ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-100'}`}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className={`text-sm font-black uppercase tracking-widest ${isDarkMode ? 'text-white/40' : 'text-secondary/40'}`}>Apellido</label>
                                                <div className="relative">
                                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                    <input
                                                        type="text"
                                                        value={formData.lastName || ''}
                                                        onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                                        className={`w-full pl-12 pr-4 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary/40 font-bold border transition-all ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-100'}`}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className={`text-sm font-black uppercase tracking-widest ${isDarkMode ? 'text-white/40' : 'text-secondary/40'}`}>Teléfono</label>
                                                <div className="relative">
                                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                    <input
                                                        type="tel"
                                                        value={formData.phone || ''}
                                                        onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                                        className={`w-full pl-12 pr-4 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary/40 font-bold border transition-all ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-100'}`}
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className={`text-sm font-black uppercase tracking-widest ${isDarkMode ? 'text-white/40' : 'text-secondary/40'}`}>Dirección</label>
                                                <div className="relative">
                                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                                    <input
                                                        type="text"
                                                        value={formData.address || ''}
                                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                                        className={`w-full pl-12 pr-4 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary/40 font-bold border transition-all ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-100'}`}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="px-8 py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3"
                                        >
                                            <Save size={20} />
                                            {saving ? 'Guardando...' : 'Guardar Cambios'}
                                        </button>
                                    </form>
                                </div>
                            )}

                            {activeTab === 'security' && (
                                <div className="space-y-12">
                                    <h2 className={`text-2xl sm:text-3xl font-black ${isDarkMode ? 'text-white' : 'text-secondary'}`}>Seguridad</h2>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12">
                                        <form onSubmit={handleUpdateSecurity} className="space-y-6 p-4 sm:p-8 rounded-3xl border border-dashed border-gray-200 dark:border-white/10">
                                            <div className="flex items-center gap-3 mb-2">
                                                <Lock className="text-primary" size={24} />
                                                <h3 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-secondary'}`}>Cambiar Contraseña</h3>
                                            </div>
                                            <p className="text-xs font-bold text-text-secondary">Usa una contraseña fuerte para proteger tu cuenta.</p>

                                            <div className="space-y-2">
                                                <input
                                                    type="password"
                                                    placeholder="Nueva Contraseña"
                                                    value={securityData.password}
                                                    onChange={e => setSecurityData({ ...securityData, password: e.target.value })}
                                                    className={`w-full px-6 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary/40 font-bold border transition-all ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-100'}`}
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={saving || !securityData.password}
                                                className="w-full py-4 bg-primary text-white font-black rounded-2xl shadow-lg hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-50"
                                            >
                                                Actualizar Contraseña
                                            </button>
                                        </form>

                                        <form onSubmit={handleUpdateSecurity} className="space-y-6 p-4 sm:p-8 rounded-3xl border border-dashed border-gray-200 dark:border-white/10">
                                            <div className="flex items-center gap-3 mb-2">
                                                <Smartphone className="text-secondary dark:text-white" size={24} />
                                                <h3 className={`text-xl font-black ${isDarkMode ? 'text-white' : 'text-secondary'}`}>PIN de Acceso</h3>
                                            </div>
                                            <p className="text-xs font-bold text-text-secondary">Establece un código numérico para ingresos rápidos.</p>

                                            <div className="space-y-2">
                                                <input
                                                    type="text"
                                                    maxLength={6}
                                                    placeholder="Código PIN (4-6 dígitos)"
                                                    value={securityData.pin}
                                                    onChange={e => setSecurityData({ ...securityData, pin: e.target.value.replace(/\D/g, '') })}
                                                    className={`w-full px-6 py-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary/40 font-bold border transition-all text-center tracking-[0.5em] text-2xl ${isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-100'}`}
                                                />
                                            </div>
                                            <button
                                                type="submit"
                                                disabled={saving || securityData.pin.length < 4}
                                                className={`w-full py-4 font-black rounded-2xl shadow-lg hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-50 ${isDarkMode ? 'bg-white text-secondary' : 'bg-secondary text-white'}`}
                                            >
                                                Configurar PIN
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'notifications' && (
                                <div className="space-y-12">
                                    <h2 className={`text-2xl sm:text-3xl font-black ${isDarkMode ? 'text-white' : 'text-secondary'}`}>Notificaciones</h2>

                                    <div className="space-y-6">
                                        {[
                                            { id: 'email', name: 'Alertas por Email', desc: 'Recibe resúmenes de tus pedidos por correo.', icon: <Mail size={24} /> },
                                            { id: 'push', name: 'Notificaciones Push', desc: 'Alertas inmediatas en el navegador sobre el estado del pedido.', icon: <Bell size={24} /> },
                                            { id: 'sms', name: 'Mensajes SMS', desc: 'Notificaciones vía texto cuando tu repartidor esté cerca.', icon: <Smartphone size={24} /> },
                                        ].map(item => (
                                            <div key={item.id} className={`p-6 rounded-3xl border flex items-center justify-between transition-all ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-white border-gray-100'}`}>
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-gray-100 dark:bg-white/5 rounded-2xl flex items-center justify-center text-primary">
                                                        {item.icon}
                                                    </div>
                                                    <div>
                                                        <h4 className={`font-black ${isDarkMode ? 'text-white' : 'text-secondary'}`}>{item.name}</h4>
                                                        <p className="text-xs font-bold text-text-secondary">{item.desc}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleToggleNotif(item.id)}
                                                    className={`w-14 h-8 rounded-full relative transition-all duration-300 ${notifSettings[item.id] ? 'bg-primary' : 'bg-gray-300 dark:bg-white/20'}`}
                                                >
                                                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-all duration-300 ${notifSettings[item.id] ? 'left-7' : 'left-1'}`} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    <div className={`p-8 rounded-[32px] bg-primary/5 border border-primary/10 flex flex-col md:flex-row items-center gap-6`}>
                                        <div className="w-16 h-16 bg-primary text-white rounded-full flex items-center justify-center shrink-0">
                                            <CheckCircle2 size={32} />
                                        </div>
                                        <div className="text-center md:text-left">
                                            <h4 className="text-lg font-black text-primary">Preferencias de Marketing</h4>
                                            <p className="text-sm font-bold text-text-secondary">También te enviaremos ofertas exclusivas de tus restaurantes favoritos una vez por semana.</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
