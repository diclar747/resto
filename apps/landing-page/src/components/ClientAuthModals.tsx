import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Mail, Phone, Lock, User, UserPlus, LogIn, Utensils, Delete, ArrowLeft, Key } from 'lucide-react';
import api from '../api';
import { useClientAuthStore } from '../stores/clientAuth.store';

interface ClientAuthModalsProps {
    isOpen: boolean;
    onClose: () => void;
    initialMode?: 'login' | 'register' | 'pin';
    isDarkMode: boolean;
    redirectTo?: string | null;
}

export function ClientAuthModals({ isOpen, onClose, initialMode = 'login', isDarkMode, redirectTo = '/marketplace/dashboard' }: ClientAuthModalsProps) {
    const [mode, setMode] = useState<'login' | 'register' | 'pin'>(initialMode);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const setClientAuth = useClientAuthStore((state) => state.setClientAuth);
    const navigate = useNavigate();

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

    const handleDigit = (digit: string) => {
        if (formData.pin.length < 4) {
            const newPin = formData.pin + digit;
            setFormData(prev => ({ ...prev, pin: newPin }));
            if (newPin.length === 4) {
                handlePinSubmit(newPin);
            }
        }
    };

    const handleDelete = () => {
        setFormData(prev => ({ ...prev, pin: prev.pin.slice(0, -1) }));
    };

    const handlePinSubmit = async (pinCode: string) => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await api.post('/marketplace/auth/login-pin', {
                pin: pinCode
            });
            setClientAuth(data.client, data.token);
            onClose();
            if (redirectTo) navigate(redirectTo);
        } catch (err: any) {
            setError(err.response?.data?.message || 'PIN inválido');
            setFormData(prev => ({ ...prev, pin: '' }));
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (mode === 'pin') return; // Handled by handlePinSubmit

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
                if (redirectTo) navigate(redirectTo);
            } else {
                const { data } = await api.post('/marketplace/auth/register', formData);
                setClientAuth(data.client, data.token);
                onClose();
                if (redirectTo) navigate(redirectTo);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Ha ocurrido un error. Intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-secondary/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className={`relative w-full ${mode === 'pin' ? 'max-w-sm' : 'max-w-md'} p-5 sm:p-8 md:p-10 rounded-3xl sm:rounded-[48px] shadow-2xl border ${isDarkMode ? 'bg-secondary border-white/10' : 'bg-white border-gray-100'} animate-in zoom-in-95 duration-300`}>

                {mode === 'pin' ? (
                    <div className="flex items-center gap-4 mb-10">
                        <button
                            type="button"
                            onClick={() => {
                                setMode('login');
                                setError(null);
                                setFormData(prev => ({ ...prev, pin: '' }));
                            }}
                            className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all shadow-sm border ${isDarkMode ? 'bg-white/5 text-white/40 border-transparent hover:bg-white/10' : 'bg-gray-50 text-gray-400 border-gray-100 hover:bg-white hover:border-primary/20'}`}
                        >
                            <ArrowLeft size={18} />
                        </button>
                        <div>
                            <h2 className={`text-xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-secondary'}`}>Acceso Rápido</h2>
                            <p className={`text-[10px] font-black uppercase tracking-widest mt-0.5 ${isDarkMode ? 'text-white/40' : 'text-text-secondary'}`}>Ingresa tu código PIN</p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="ml-auto p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                        >
                            <X size={20} className={isDarkMode ? 'text-white' : 'text-secondary'} />
                        </button>
                    </div>
                ) : (
                    <div className="text-center space-y-2 mb-8">
                        <button
                            type="button"
                            onClick={onClose}
                            className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                        >
                            <X size={20} className={isDarkMode ? 'text-white' : 'text-secondary'} />
                        </button>
                        <div className="w-14 h-14 bg-primary mx-auto rounded-3xl flex items-center justify-center shadow-lg shadow-primary/30 mb-6">
                            <Utensils className="text-white" size={28} />
                        </div>
                        <h2 className={`text-3xl font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-secondary'}`}>
                            {mode === 'login' ? 'Bienvenido de vuelta.' : 'Únete a RestoPOS.'}
                        </h2>
                        <p className={`text-sm font-medium ${isDarkMode ? 'text-white/60' : 'text-text-secondary'}`}>
                            {mode === 'login' ? 'Ingresa para gestionar tus pedidos favoritos.' : 'Crea tu cuenta global para pedir en cualquier sucursal.'}
                        </p>
                    </div>
                )}

                {error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-bold rounded-2xl border border-red-100 dark:border-red-500/20 text-center">
                        {error}
                    </div>
                )}

                {mode === 'pin' ? (
                    <div className="space-y-8">
                        {/* PIN dots */}
                        <div className="flex justify-center gap-4 sm:gap-6 mb-8 sm:mb-12">
                            {[0, 1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className={`w-4 h-4 rounded-full transition-all duration-300 ${i < formData.pin.length
                                        ? 'bg-primary scale-125 shadow-lg shadow-primary/40'
                                        : isDarkMode ? 'bg-white/15' : 'bg-gray-200'
                                        }`}
                                />
                            ))}
                        </div>

                        {/* Number pad */}
                        <div className="grid grid-cols-3 gap-3 sm:gap-6">
                            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'].map((key) => {
                                if (key === '') return <div key="empty" className="h-16 sm:h-20" />;
                                if (key === 'del') {
                                    return (
                                        <button
                                            key="del"
                                            type="button"
                                            onClick={handleDelete}
                                            className={`h-16 sm:h-20 rounded-[28px] border flex items-center justify-center transition-all shadow-sm group active:scale-95 ${isDarkMode ? 'bg-white/5 border-white/10 text-white/40 hover:text-rose-500 hover:bg-rose-500/10 hover:border-rose-500/20' : 'bg-white border-gray-100 text-gray-400 hover:text-rose-500 hover:bg-rose-50 hover:border-rose-100'}`}
                                        >
                                            <Delete size={24} className="group-hover:scale-110 transition-transform" />
                                        </button>
                                    );
                                }
                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => handleDigit(key)}
                                        disabled={loading}
                                        className={`h-16 sm:h-20 rounded-[28px] border flex items-center justify-center text-2xl font-black transition-all shadow-sm active:scale-95 disabled:opacity-50 ${isDarkMode ? 'bg-white/5 border-white/10 text-white hover:text-primary hover:bg-primary/5 hover:border-primary/20' : 'bg-white border-gray-100 text-secondary hover:text-primary hover:bg-primary/5 hover:border-primary/20'}`}
                                    >
                                        {key}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="mt-8 text-center">
                            <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDarkMode ? 'text-white/20' : 'text-text-secondary'}`}>Seguridad por Hardware Encriptada</p>
                        </div>
                    </div>
                ) : (
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

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 py-4 mt-6 bg-primary text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            {loading ? 'Procesando...' : (mode === 'login' ? <><LogIn size={18} /> Iniciar Sesión</> : <><UserPlus size={18} /> Crear Cuenta</>)}
                        </button>
                    </form>
                )}

                {mode !== 'register' && (
                    <div className="mt-8 flex flex-col items-center gap-4">
                        <button
                            type="button"
                            onClick={() => {
                                setMode(mode === 'pin' ? 'login' : 'pin');
                                setError(null);
                                setFormData(prev => ({ ...prev, pin: '' }));
                            }}
                            className={`text-sm font-bold ${isDarkMode ? 'text-white/60 hover:text-white' : 'text-text-secondary hover:text-secondary'} transition-colors flex items-center gap-2`}
                        >
                            {mode === 'pin' ? <LogIn size={14} /> : <Key size={14} />}
                            {mode === 'pin' ? 'Usar Email y Contraseña' : 'Acceso rápido con PIN'}
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setMode('register');
                                setError(null);
                            }}
                            className={`text-sm font-bold ${isDarkMode ? 'text-white/60 hover:text-white' : 'text-text-secondary hover:text-secondary'} transition-colors underline decoration-2 underline-offset-4 decoration-primary/30 hover:decoration-primary`}
                        >
                            ¿No tienes cuenta? Regístrate aquí
                        </button>
                    </div>
                )}

                {mode === 'register' && (
                    <div className="mt-8 text-center">
                        <button
                            type="button"
                            onClick={() => {
                                setMode('login');
                                setError(null);
                            }}
                            className={`text-sm font-bold ${isDarkMode ? 'text-white/60 hover:text-white' : 'text-text-secondary hover:text-secondary'} transition-colors underline decoration-2 underline-offset-4 decoration-primary/30 hover:decoration-primary`}
                        >
                            ¿Ya tienes cuenta? Inicia sesión
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
