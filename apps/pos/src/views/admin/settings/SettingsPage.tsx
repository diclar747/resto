import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../api/client';
import { useAuthStore } from '../../../stores/auth.store';
import { useThemeStore } from '../../../stores/theme.store';
import toast from 'react-hot-toast';
import {
  User, Lock, Bell, Shield, Camera, Save, Eye, EyeOff,
  Mail, Phone, Key, Settings, Palette, Store, ChevronRight,
  Sun, Moon, Monitor,
} from 'lucide-react';

type Tab = 'profile' | 'security' | 'notifications' | 'system';

export function SettingsPage() {
  const { user: authUser } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.get('/auth/me').then((r) => r.data),
  });

  const tabs = [
    { id: 'profile' as Tab, label: 'Mi Perfil', icon: User, desc: 'Datos personales y foto' },
    { id: 'security' as Tab, label: 'Seguridad', icon: Lock, desc: 'Contraseña y PIN' },
    { id: 'notifications' as Tab, label: 'Notificaciones', icon: Bell, desc: 'Alertas y avisos' },
    { id: 'system' as Tab, label: 'Sistema', icon: Settings, desc: 'Configuración general' },
  ];

  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-8 bg-background min-h-full">
      {/* Header */}
      <div>
        <h1 className="text-xl md:text-3xl font-black text-secondary tracking-tight">Configuración</h1>
        <p className="text-text-secondary font-medium mt-1">Gestiona tu perfil, seguridad y preferencias</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 md:gap-6">
        {/* Sidebar tabs */}
        <div className="lg:w-72 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 md:px-5 md:py-4 rounded-2xl text-left whitespace-nowrap lg:whitespace-normal transition-all duration-200 min-w-fit lg:min-w-0 ${
                activeTab === tab.id
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'bg-white dark:bg-surface text-text-secondary hover:bg-gray-50 dark:hover:bg-white/5'
              }`}
            >
              <tab.icon size={18} />
              <div className="flex-1">
                <p className="text-xs md:text-sm font-black">{tab.label}</p>
                <p className={`text-[10px] hidden lg:block ${activeTab === tab.id ? 'text-white/70' : 'text-text-secondary'}`}>{tab.desc}</p>
              </div>
              <ChevronRight size={14} className="hidden lg:block opacity-50" />
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {activeTab === 'profile' && <ProfileSection profile={profile} queryClient={queryClient} />}
              {activeTab === 'security' && <SecuritySection />}
              {activeTab === 'notifications' && <NotificationsSection />}
              {activeTab === 'system' && <SystemSection profile={profile} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ PROFILE SECTION ═══════════════ */
function ProfileSection({ profile, queryClient }: { profile: any; queryClient: any }) {
  const [form, setForm] = useState({
    firstName: '', lastName: '', phone: '', avatarUrl: '', pin: '',
  });
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (profile && !initialized) {
      setForm({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        phone: profile.phone || '',
        avatarUrl: profile.avatarUrl || '',
        pin: '',
      });
      setInitialized(true);
    }
  }, [profile, initialized]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.patch('/auth/profile', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Perfil actualizado');
    },
    onError: () => toast.error('Error al actualizar perfil'),
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const data: any = { firstName: form.firstName, lastName: form.lastName, phone: form.phone, avatarUrl: form.avatarUrl };
    if (form.pin) data.pin = form.pin;
    updateMutation.mutate(data);
  };

  const initials = `${profile?.firstName?.[0] || ''}${profile?.lastName?.[0] || ''}`.toUpperCase();

  return (
    <form onSubmit={handleSave} className="space-y-4 md:space-y-6">
      {/* Avatar card */}
      <div className="bg-white dark:bg-surface rounded-[28px] p-5 md:p-8 shadow-card">
        <h2 className="text-sm font-black text-secondary uppercase tracking-widest mb-6 flex items-center gap-2">
          <Camera size={16} className="text-primary" /> Foto de Perfil
        </h2>
        <div className="flex flex-col sm:flex-row items-center gap-6">
          <div className="relative group">
            {form.avatarUrl ? (
              <img src={form.avatarUrl} alt="Avatar" className="w-24 h-24 rounded-2xl object-cover shadow-lg" />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-2xl font-black shadow-lg">
                {initials}
              </div>
            )}
          </div>
          <div className="flex-1 w-full">
            <label className="text-xs font-black text-secondary uppercase tracking-widest mb-2 block">URL de imagen</label>
            <input
              type="url"
              value={form.avatarUrl}
              onChange={(e) => setForm({ ...form, avatarUrl: e.target.value })}
              placeholder="https://ejemplo.com/mi-foto.jpg"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 text-sm font-medium"
            />
            <p className="text-[10px] text-text-secondary mt-1.5">Pega la URL de tu foto de perfil</p>
          </div>
        </div>
      </div>

      {/* Personal info */}
      <div className="bg-white dark:bg-surface rounded-[28px] p-5 md:p-8 shadow-card">
        <h2 className="text-sm font-black text-secondary uppercase tracking-widest mb-6 flex items-center gap-2">
          <User size={16} className="text-primary" /> Información Personal
        </h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-secondary uppercase tracking-widest">Nombre</label>
              <input
                type="text"
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 text-sm font-medium"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-secondary uppercase tracking-widest">Apellido</label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 text-sm font-medium"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-secondary uppercase tracking-widest flex items-center gap-2">
              <Mail size={12} /> Email
            </label>
            <input
              type="email"
              value={profile?.email || ''}
              disabled
              className="w-full px-4 py-3 bg-gray-100 dark:bg-white/10 border border-gray-100 dark:border-white/10 rounded-2xl text-sm font-medium text-gray-400 dark:text-white/40 cursor-not-allowed"
            />
            <p className="text-[10px] text-text-secondary">El email no se puede cambiar</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-secondary uppercase tracking-widest flex items-center gap-2">
                <Phone size={12} /> Teléfono
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+595 981 555 123"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 text-sm font-medium"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-secondary uppercase tracking-widest flex items-center gap-2">
                <Key size={12} /> PIN rápido
              </label>
              <input
                type="text"
                value={form.pin}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, '').slice(0, 4);
                  setForm({ ...form, pin: v });
                }}
                placeholder="Dejar vacío para no cambiar"
                inputMode="numeric"
                maxLength={4}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 text-sm font-medium"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Role info (read-only) */}
      <div className="bg-white dark:bg-surface rounded-[28px] p-5 md:p-8 shadow-card">
        <h2 className="text-sm font-black text-secondary uppercase tracking-widest mb-4 flex items-center gap-2">
          <Shield size={16} className="text-primary" /> Rol y Sucursal
        </h2>
        <div className="space-y-3">
          {profile?.branches?.map((ub: any) => (
            <div key={ub.id || ub.branchId} className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white">
                <Store size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-secondary truncate">{ub.branch?.name || 'Sucursal'}</p>
                <p className="text-[10px] font-black text-primary uppercase tracking-widest">{ub.role?.name}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Save button */}
      <button
        type="submit"
        disabled={updateMutation.isPending}
        className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all disabled:opacity-50"
      >
        <Save size={16} />
        {updateMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
      </button>
    </form>
  );
}

/* ═══════════════ SECURITY SECTION ═══════════════ */
function SecuritySection() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const changePwMutation = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) => api.patch('/auth/password', data),
    onSuccess: () => {
      toast.success('Contraseña actualizada correctamente');
      setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Error al cambiar contraseña'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.newPassword.length < 6) {
      toast.error('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    changePwMutation.mutate({ currentPassword: form.currentPassword, newPassword: form.newPassword });
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="bg-white dark:bg-surface rounded-[28px] p-5 md:p-8 shadow-card">
        <h2 className="text-sm font-black text-secondary uppercase tracking-widest mb-6 flex items-center gap-2">
          <Lock size={16} className="text-primary" /> Cambiar Contraseña
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
          <div className="space-y-2">
            <label className="text-xs font-black text-secondary uppercase tracking-widest">Contraseña Actual</label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={form.currentPassword}
                onChange={(e) => setForm({ ...form, currentPassword: e.target.value })}
                className="w-full px-4 py-3 pr-12 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 text-sm font-medium"
                required
              />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40 hover:text-secondary">
                {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-secondary uppercase tracking-widest">Nueva Contraseña</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={form.newPassword}
                onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-4 py-3 pr-12 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 text-sm font-medium"
                required
                minLength={6}
              />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40 hover:text-secondary">
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-secondary uppercase tracking-widest">Confirmar Contraseña</label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-4 focus:ring-primary/10 text-sm font-medium"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={changePwMutation.isPending}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all disabled:opacity-50"
          >
            <Lock size={14} />
            {changePwMutation.isPending ? 'Cambiando...' : 'Cambiar Contraseña'}
          </button>
        </form>
      </div>

      {/* Security tips */}
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-[28px] p-5 md:p-8">
        <h3 className="text-sm font-black text-amber-800 dark:text-amber-400 uppercase tracking-widest mb-3 flex items-center gap-2">
          <Shield size={16} /> Consejos de Seguridad
        </h3>
        <ul className="text-xs text-amber-700 dark:text-amber-300/80 space-y-2">
          <li>Usa una contraseña de al menos 8 caracteres con letras y números</li>
          <li>No compartas tu contraseña ni tu PIN con nadie</li>
          <li>Cambia tu contraseña regularmente</li>
          <li>Cierra sesión cuando no uses el sistema</li>
        </ul>
      </div>
    </div>
  );
}

/* ═══════════════ NOTIFICATIONS SECTION ═══════════════ */
function NotificationsSection() {
  const [prefs, setPrefs] = useState({
    newOrders: true,
    orderReady: true,
    lowStock: true,
    dailySummary: false,
    billRequested: true,
    newDelivery: true,
    soundEnabled: true,
    vibrationEnabled: true,
  });

  const togglePref = (key: keyof typeof prefs) => {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  };

  const notifGroups = [
    {
      title: 'Pedidos',
      items: [
        { key: 'newOrders' as const, label: 'Nuevos pedidos', desc: 'Recibir alerta cuando entra un nuevo pedido' },
        { key: 'orderReady' as const, label: 'Pedido listo', desc: 'Cuando cocina marca un pedido como listo' },
        { key: 'billRequested' as const, label: 'Cuenta solicitada', desc: 'Cuando un mesero solicita la cuenta' },
      ],
    },
    {
      title: 'Operaciones',
      items: [
        { key: 'lowStock' as const, label: 'Stock bajo', desc: 'Alerta cuando un ingrediente está por debajo del mínimo' },
        { key: 'newDelivery' as const, label: 'Nuevo delivery', desc: 'Cuando se crea un pedido de delivery' },
        { key: 'dailySummary' as const, label: 'Resumen diario', desc: 'Recibir resumen de ventas al cierre del día' },
      ],
    },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      {notifGroups.map((group) => (
        <div key={group.title} className="bg-white dark:bg-surface rounded-[28px] p-5 md:p-8 shadow-card">
          <h2 className="text-sm font-black text-secondary uppercase tracking-widest mb-5 flex items-center gap-2">
            <Bell size={16} className="text-primary" /> {group.title}
          </h2>
          <div className="space-y-1">
            {group.items.map((item) => (
              <div key={item.key} className="flex items-center justify-between p-3 md:p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                <div className="flex-1 min-w-0 mr-4">
                  <p className="text-sm font-bold text-secondary">{item.label}</p>
                  <p className="text-[11px] text-text-secondary">{item.desc}</p>
                </div>
                <button
                  onClick={() => togglePref(item.key)}
                  className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${
                    prefs[item.key] ? 'bg-primary' : 'bg-gray-200 dark:bg-white/15'
                  }`}
                >
                  <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${
                    prefs[item.key] ? 'left-6' : 'left-1'
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Sound & Vibration */}
      <div className="bg-white dark:bg-surface rounded-[28px] p-5 md:p-8 shadow-card">
        <h2 className="text-sm font-black text-secondary uppercase tracking-widest mb-5 flex items-center gap-2">
          <Settings size={16} className="text-primary" /> Preferencias
        </h2>
        <div className="space-y-1">
          {[
            { key: 'soundEnabled' as const, label: 'Sonido', desc: 'Reproducir sonido en alertas' },
            { key: 'vibrationEnabled' as const, label: 'Vibración', desc: 'Vibrar en dispositivos móviles' },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between p-3 md:p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
              <div>
                <p className="text-sm font-bold text-secondary">{item.label}</p>
                <p className="text-[11px] text-text-secondary">{item.desc}</p>
              </div>
              <button
                onClick={() => togglePref(item.key)}
                className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${
                  prefs[item.key] ? 'bg-primary' : 'bg-gray-200 dark:bg-white/15'
                }`}
              >
                <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-200 ${
                  prefs[item.key] ? 'left-6' : 'left-1'
                }`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <p className="text-[10px] text-text-secondary text-center">
        Las preferencias de notificación se guardan localmente en este dispositivo
      </p>
    </div>
  );
}

/* ═══════════════ SYSTEM SECTION ═══════════════ */
function SystemSection({ profile }: { profile: any }) {
  const branch = profile?.branches?.[0]?.branch;
  const role = profile?.branches?.[0]?.role;
  const { mode: themeMode, setMode } = useThemeStore();

  const themeOptions = [
    { mode: 'light' as const, icon: Sun, label: 'Claro' },
    { mode: 'dark' as const, icon: Moon, label: 'Oscuro' },
    { mode: 'system' as const, icon: Monitor, label: 'Sistema' },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Theme selector */}
      <div className="bg-white dark:bg-surface rounded-[28px] p-5 md:p-8 shadow-card">
        <h2 className="text-sm font-black text-secondary uppercase tracking-widest mb-5 flex items-center gap-2">
          <Palette size={16} className="text-primary" /> Apariencia
        </h2>
        <p className="text-xs text-text-secondary mb-4">Selecciona el tema visual de la aplicación</p>
        <div className="flex gap-3">
          {themeOptions.map(({ mode: m, icon: Icon, label }) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 flex flex-col items-center gap-2 px-4 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-200 ${
                themeMode === m
                  ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105'
                  : 'bg-gray-50 dark:bg-white/5 text-text-secondary hover:bg-gray-100 dark:hover:bg-white/10'
              }`}
            >
              <Icon size={22} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Branch info */}
      <div className="bg-white dark:bg-surface rounded-[28px] p-5 md:p-8 shadow-card">
        <h2 className="text-sm font-black text-secondary uppercase tracking-widest mb-5 flex items-center gap-2">
          <Store size={16} className="text-primary" /> Sucursal Actual
        </h2>
        {branch ? (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoField label="Nombre" value={branch.name} />
              <InfoField label="Moneda" value={branch.currency || 'PYG'} />
              <InfoField label="Zona Horaria" value={branch.timezone || 'America/Asuncion'} />
              <InfoField label="Estado" value={branch.isActive ? 'Activa' : 'Inactiva'} />
            </div>
            {branch.address && <InfoField label="Dirección" value={branch.address} />}
            {branch.phone && <InfoField label="Teléfono" value={branch.phone} />}
          </div>
        ) : (
          <p className="text-sm text-text-secondary">Sin sucursal asignada</p>
        )}
      </div>

      {/* Account info */}
      <div className="bg-white dark:bg-surface rounded-[28px] p-5 md:p-8 shadow-card">
        <h2 className="text-sm font-black text-secondary uppercase tracking-widest mb-5 flex items-center gap-2">
          <Shield size={16} className="text-primary" /> Información de Cuenta
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoField label="ID de usuario" value={profile?.id} />
          <InfoField label="Rol" value={role?.name?.toUpperCase() || 'N/A'} />
          <InfoField label="Email" value={profile?.email} />
          <InfoField label="Miembro desde" value={profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('es-PY', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'} />
        </div>
      </div>

      {/* App info */}
      <div className="bg-white dark:bg-surface rounded-[28px] p-5 md:p-8 shadow-card">
        <h2 className="text-sm font-black text-secondary uppercase tracking-widest mb-5 flex items-center gap-2">
          <Settings size={16} className="text-primary" /> Aplicación
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoField label="Versión" value="1.0.0" />
          <InfoField label="Plataforma" value="Web (PWA)" />
        </div>
      </div>
    </div>
  );
}

function InfoField({ label, value }: { label: string; value?: string }) {
  return (
    <div className="p-3 bg-gray-50 dark:bg-white/5 rounded-xl">
      <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">{label}</p>
      <p className="text-sm font-medium text-secondary truncate">{value || '—'}</p>
    </div>
  );
}
