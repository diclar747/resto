import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../stores/auth.store';
import api from '../../../api/client';
import toast from 'react-hot-toast';
import { useState } from 'react';
import {
  Trash2, Shield, Mail, Lock, Hash, UserPlus, Search
} from 'lucide-react';

function getUserName(user: any): string {
  if (user.firstName || user.lastName) return `${user.firstName || ''} ${user.lastName || ''}`.trim();
  return user.name || 'Sin nombre';
}

function getUserRole(user: any): string {
  return user.branches?.[0]?.role?.name || user.role?.name || user.role || '';
}

function getUserInitials(user: any): string {
  const name = getUserName(user);
  return name.split(' ').map((n: string) => n[0]).join('').toUpperCase();
}

export function UsersPage() {
  const branchId = useAuthStore((s) => s.user?.branchId);
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', password: '', pin: '', roleId: '',
  });

  const { data: users, isLoading } = useQuery({
    queryKey: ['users', branchId],
    queryFn: () => api.get('/users').then((r) => r.data),
  });

  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: () => api.get('/users/roles').then((r) => r.data),
  });

  const createUser = useMutation({
    mutationFn: (data: any) => api.post('/users', { ...data, branchId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowForm(false);
      setForm({ firstName: '', lastName: '', email: '', password: '', pin: '', roleId: '' });
      toast.success('Miembro del equipo añadido con éxito');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Error al añadir miembro');
    },
  });

  const deleteUser = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Acceso revocado correctamente');
    },
  });

  const roleStyles: Record<string, { color: string, icon: any }> = {
    superadmin: { color: 'bg-purple-500', icon: Shield },
    admin: { color: 'bg-rose-500', icon: Shield },
    manager: { color: 'bg-indigo-500', icon: Shield },
    cashier: { color: 'bg-blue-500', icon: Shield },
    waiter: { color: 'bg-emerald-500', icon: Shield },
    kitchen: { color: 'bg-amber-500', icon: Shield },
    driver: { color: 'bg-purple-500', icon: Shield },
  };

  const filteredUsers = users?.filter((u: any) => {
    const name = getUserName(u).toLowerCase();
    const email = (u.email || '').toLowerCase();
    const term = searchTerm.toLowerCase();
    return name.includes(term) || email.includes(term);
  });

  return (
    <div className="p-8 space-y-8 bg-[#F4F7FE] min-h-screen">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/50 backdrop-blur-md p-6 rounded-[32px] border border-white shadow-xl">
        <div>
          <h2 className="text-3xl font-black text-secondary tracking-tight">Staff <span className="text-primary italic">Management</span></h2>
          <p className="text-sm font-medium text-text-secondary mt-1">Gestiona los permisos y accesos de tu equipo</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              className="pl-12 pr-6 py-3 bg-white border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all w-64 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-primary/20 active:scale-95"
          >
            <UserPlus size={16} /> Añadir Miembro
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-64 bg-gray-200 animate-pulse rounded-[32px]" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredUsers?.map((user: any) => {
            const roleName = getUserRole(user);
            const fullName = getUserName(user);
            const initials = getUserInitials(user);
            const branchName = user.branches?.[0]?.branch?.name;
            return (
              <div key={user.id} className="bg-white rounded-[32px] p-6 shadow-xl border border-white hover:-translate-y-1 transition-all group overflow-hidden relative">
                {/* Top gradient blur */}
                <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full blur-3xl opacity-10 transition-opacity group-hover:opacity-20 ${roleStyles[roleName]?.color || 'bg-gray-500'}`} />

                <div className="flex items-start justify-between mb-6 relative">
                  <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center font-black text-secondary text-xl border-2 border-white shadow-inner overflow-hidden uppercase tracking-tighter">
                    {initials}
                  </div>
                  <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg ${roleStyles[roleName]?.color || 'bg-gray-500'}`}>
                    {roleName || 'Sin rol'}
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-lg font-black text-secondary truncate">{fullName}</h4>
                  <div className="flex items-center gap-2 text-text-secondary mt-1">
                    <Mail size={12} />
                    <span className="text-xs font-bold truncate">{user.email}</span>
                  </div>
                  {branchName && (
                    <p className="text-[10px] font-bold text-text-secondary mt-1 uppercase tracking-widest">{branchName}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-[#F4F7FE] p-3 rounded-2xl border border-white/50">
                    <p className="text-[9px] font-black uppercase text-gray-400 mb-1">CÓDIGO PIN</p>
                    <p className="text-xs font-black text-secondary">{user.pin ? '••••' : 'NO SET'}</p>
                  </div>
                  <div className="bg-[#F4F7FE] p-3 rounded-2xl border border-white/50">
                    <p className="text-[9px] font-black uppercase text-gray-400 mb-1">ESTADO</p>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${user.isActive !== false ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      <span className={`text-[10px] font-black uppercase ${user.isActive !== false ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {user.isActive !== false ? 'ACTIVO' : 'INACTIVO'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {/* Edit logic */ }}
                    className="flex-1 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-secondary transition-colors"
                  >
                    Editar Perfil
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`¿Revocar acceso a ${fullName}?`)) deleteUser.mutate(user.id);
                    }}
                    className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-xl transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modern Modal Overlay */}
      {showForm && (
        <div className="fixed inset-0 bg-secondary/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[40px] p-10 w-full max-w-lg shadow-2xl border border-white relative overflow-hidden">
            {/* Modal Header */}
            <div className="relative mb-8">
              <h3 className="text-2xl font-black text-secondary tracking-tight">Nuevo <span className="text-primary">Miembro</span></h3>
              <p className="text-sm font-medium text-text-secondary mt-1">Configura las credenciales del equipo</p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="relative group">
                  <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                  <input
                    className="w-full pl-12 pr-6 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-gray-400 font-bold"
                    placeholder="Nombre"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  />
                </div>
                <div className="relative group">
                  <input
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-gray-400 font-bold"
                    placeholder="Apellido"
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  />
                </div>
              </div>

              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                <input
                  className="w-full pl-12 pr-6 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-gray-400 font-bold"
                  placeholder="Correo electrónico"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                  <input
                    className="w-full pl-12 pr-6 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-gray-400 font-bold"
                    placeholder="Contraseña"
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                </div>
                <div className="relative group">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                  <input
                    className="w-full pl-12 pr-6 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-gray-400 font-bold"
                    placeholder="PIN (4 dig)"
                    maxLength={4}
                    value={form.pin}
                    onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                  />
                </div>
              </div>

              <div className="relative group">
                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
                <select
                  className="w-full pl-12 pr-6 py-4 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all font-bold appearance-none bg-no-repeat"
                  style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'currentColor\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\' /%3E%3C/svg%3E")', backgroundPosition: 'right 1rem center', backgroundSize: '1rem' }}
                  value={form.roleId}
                  onChange={(e) => setForm({ ...form, roleId: e.target.value })}
                >
                  <option value="">Seleccionar rol de equipo</option>
                  {roles?.map((r: any) => (
                    <option key={r.id} value={r.id}>{r.name.toUpperCase()}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-4 mt-10">
              <button
                className="flex-1 py-4 bg-gray-100 hover:bg-gray-200 text-secondary rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                onClick={() => setShowForm(false)}
              >
                Cancelar
              </button>
              <button
                className="flex-[2] py-4 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-primary/20 hover:scale-[1.02] disabled:opacity-50 active:scale-[0.98]"
                onClick={() => createUser.mutate(form)}
                disabled={!form.firstName || !form.email || !form.password || !form.roleId}
              >
                Confirmar Alta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
