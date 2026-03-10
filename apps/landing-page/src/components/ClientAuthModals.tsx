import { useState } from 'react';
import { X, Mail, Phone, Lock, User, UserPlus, LogIn, Utensils } from 'lucide-react';
import api from '../api';
import { useClientAuthStore } from '../stores/clientAuth.store';

interface ClientAuthModalsProps {
    isOpen: boolean;
    onClose: () => void;
    initialMode?: 'login' | 'register' | 'pin';
    isDarkMode: boolean;
}

export function ClientAuthModals({ isOpen, onClose, initialMode = 'login', isDarkMode }: ClientAuthModalsProps) {
    const [mode, setMode] = useState<'login' | 'register' | 'pin'>(initialMode);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const setClientAuth = useClientAuthStore((state) => state.setClientAuth);

    // Form states
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        password: '',
        pin: ''
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (mode === 'login') {
                const { data } = await api.post('/marketplace/auth/login', {
                    identifier: formData.email || formData.phone,
                    password: formData.password
                });
                setClientAuth(data.client, data.token);
                onClose();
            } else if (mode === 'pin') {
                const { data } = await api.post('/marketplace/auth/login-pin', {
                    pin: formData.pin
                });
                setClientAuth(data.client, data.token);
                onClose();
            } else {
                const { data } = await api.post('/marketplace/auth/register', formData);
                setClientAuth(data.client, data.token);
                onClose();
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Ha ocurrido un error. Intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-secondary/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className={`relative w-full max-w-md p-8 rounded-[48px] shadow-2xl border ${isDarkMode ? 'bg-secondary border-white/10' : 'bg-white border-gray-100'} animate-in zoom-in-95 duration-300`}>
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                >
                    <X size={20} className={isDarkMode ? 'text-white' : 'text-secondary'} />
                </button>

                <div className="text-center space-y-2 mb-8">
                    <div className="w-14 h-14 bg-primary mx-auto rounded-3xl flex items-center justify-center shadow-lg shadow-primary/30 mb-6">
                        <Utensils className="text-white" size={28} />
                    </div>
                    <h2 className={`text-3xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-secondary'}`}>
                        {mode === 'login' ? 'Bienvenido de vuelta.' : mode === 'pin' ? 'Ingreso con PIN' : 'Únete a RestoPOS.'}
                    </h2>
                    <p className={`text-sm font-medium ${isDarkMode ? 'text-white/60' : 'text-text-secondary'}`}>
                        {mode === 'login' ? 'Ingresa para gestionar tus pedidos favoritos.' : mode === 'pin' ? 'Ingresa tu PIN personal de 4 dígitos.' : 'Crea tu cuenta global para pedir en cualquier sucursal.'}
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-bold rounded-2xl border border-red-100 dark:border-red-500/20 text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === 'register' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className={`text-xs font-black uppercase tracking-widest ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Nombre</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        required
                                        className={`w-full pl-12 pr-4 py-3 rounded-2xl font-medium focus:ring-2 focus:ring-primary outline-none transition-all ${isDarkMode ? 'bg-white/5 text-white border border-white/10' : 'bg-gray-50 border border-gray-100'}`}
                                        value={formData.firstName}
                                        onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                        placeholder="Ej. Juan"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className={`text-xs font-black uppercase tracking-widest ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Apellido</label>
                                <input
                                    type="text"
                                    required
                                    className={`w-full px-4 py-3 rounded-2xl font-medium focus:ring-2 focus:ring-primary outline-none transition-all ${isDarkMode ? 'bg-white/5 text-white border border-white/10' : 'bg-gray-50 border border-gray-100'}`}
                                    value={formData.lastName}
                                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                    placeholder="Ej. Pérez"
                                />
                            </div>
                        </div>
                    )}

                    {mode === 'pin' ? (
                        <div className="space-y-2">
                            <label className={`text-xs font-black uppercase tracking-widest ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>PIN de Acceso</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="password"
                                    required
                                    maxLength={4}
                                    className={`w-full pl-12 pr-4 py-3 rounded-2xl font-medium focus:ring-2 focus:ring-primary outline-none transition-all text-center text-2xl tracking-[1em] ${isDarkMode ? 'bg-white/5 text-white border border-white/10' : 'bg-gray-50 border border-gray-100'}`}
                                    value={formData.pin}
                                    onChange={e => setFormData({ ...formData, pin: e.target.value.replace(/\D/g, '') })}
                                    placeholder="••••"
                                />
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <label className={`text-xs font-black uppercase tracking-widest ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>
                                    {mode === 'login' ? 'Email o Teléfono' : 'Email'}
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type={mode === 'login' ? 'text' : 'email'}
                                        required
                                        className={`w-full pl-12 pr-4 py-3 rounded-2xl font-medium focus:ring-2 focus:ring-primary outline-none transition-all ${isDarkMode ? 'bg-white/5 text-white border border-white/10' : 'bg-gray-50 border border-gray-100'}`}
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        placeholder={mode === 'login' ? 'tucorreo@ejemplo.com' : 'tucorreo@ejemplo.com'}
                                    />
                                </div>
                            </div>

                            {mode === 'register' && (
                                <div className="space-y-2">
                                    <label className={`text-xs font-black uppercase tracking-widest ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Teléfono (Opcional)</label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="tel"
                                            className={`w-full pl-12 pr-4 py-3 rounded-2xl font-medium focus:ring-2 focus:ring-primary outline-none transition-all ${isDarkMode ? 'bg-white/5 text-white border border-white/10' : 'bg-gray-50 border border-gray-100'}`}
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="+123456789"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className={`text-xs font-black uppercase tracking-widest ${isDarkMode ? 'text-white/40' : 'text-gray-400'}`}>Contraseña</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="password"
                                        required
                                        minLength={6}
                                        className={`w-full pl-12 pr-4 py-3 rounded-2xl font-medium focus:ring-2 focus:ring-primary outline-none transition-all ${isDarkMode ? 'bg-white/5 text-white border border-white/10' : 'bg-gray-50 border border-gray-100'}`}
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        </>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 py-4 mt-6 bg-primary text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-[0.98] disabled:opacity-50"
                    >
                        {loading ? 'Procesando...' : (mode === 'login' ? <><LogIn size={18} /> Iniciar Sesión</> : mode === 'pin' ? <><Lock size={18} /> Acceder con PIN</> : <><UserPlus size={18} /> Crear Cuenta</>)}
                    </button>
                </form>

                <div className="mt-8 flex flex-col items-center gap-4">
                    <button
                        type="button"
                        onClick={() => {
                            setMode(mode === 'pin' ? 'login' : 'pin');
                            setError(null);
                        }}
                        className={`text-sm font-bold ${isDarkMode ? 'text-white/60 hover:text-white' : 'text-text-secondary hover:text-secondary'} transition-colors`}
                    >
                        {mode === 'pin' ? 'Usar Email y Contraseña' : '¿Prefieres usar tu PIN?'}
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setMode(mode === 'login' || mode === 'pin' ? 'register' : 'login');
                            setError(null);
                        }}
                        className={`text-sm font-bold ${isDarkMode ? 'text-white/60 hover:text-white' : 'text-text-secondary hover:text-secondary'} transition-colors underline decoration-2 underline-offset-4 decoration-primary/30 hover:decoration-primary`}
                    >
                        {mode === 'login' || mode === 'pin' ? '¿No tienes cuenta? Regístrate aquí' : '¿Ya tienes cuenta? Inicia sesión'}
                    </button>
                </div>
            </div>
        </div>
    );
}
