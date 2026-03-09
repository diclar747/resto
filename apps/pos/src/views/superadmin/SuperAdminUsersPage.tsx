import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import toast from 'react-hot-toast';
import { Users, Plus, Edit3, Trash2, X, Search, Shield, Mail } from 'lucide-react';

const roleStyles: Record<string, string> = {
  superadmin: 'bg-purple-100 text-purple-700',
  admin: 'bg-blue-100 text-blue-700',
  manager: 'bg-teal-100 text-teal-700',
};

const roleLabels: Record<string, string> = {
  superadmin: 'Super Admin',
  admin: 'Administrador',
  manager: 'Gerente',
};

export function SuperAdminUsersPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', pin: '', role: 'admin', branchId: '' });

  const { data: users, isLoading } = useQuery({
    queryKey: ['superadmin-users'],
    queryFn: () => api.get('/users').then((r) => r.data),
  });

  const { data: branches } = useQuery({
    queryKey: ['branches'],
    queryFn: () => api.get('/marketplace/branches').then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin-users'] });
      toast.success('Usuario creado exitosamente');
      closeModal();
    },
    onError: () => toast.error('Error al crear usuario'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['superadmin-users'] });
      toast.success('Usuario eliminado');
    },
    onError: () => toast.error('Error al eliminar usuario'),
  });

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setForm({ firstName: '', lastName: '', email: '', password: '', pin: '', role: 'admin', branchId: '' });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      const { password, ...updateData } = form;
      const payload = password ? form : updateData;
      api.patch(`/users/${editing.id}`, payload).then(() => {
        queryClient.invalidateQueries({ queryKey: ['superadmin-users'] });
        toast.success('Usuario actualizado');
        closeModal();
      }).catch(() => toast.error('Error al actualizar'));
    } else {
      createMutation.mutate(form);
    }
  };

  // Filter to admin-level roles
  const adminUsers = users?.filter((u: any) =>
    ['superadmin', 'admin', 'manager'].includes(u.role || u.userBranches?.[0]?.role?.name)
  ) || [];

  const filtered = adminUsers.filter((u: any) =>
    `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8 bg-background min-h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-secondary tracking-tight">Administradores</h1>
          <p className="text-text-secondary font-medium mt-1">Gestión de usuarios administrativos</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-200 hover:scale-105 transition-all"
        >
          <Plus size={16} /> Nuevo Administrador
        </button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar usuario..."
          className="w-full pl-12 pr-4 py-3 bg-white dark:bg-surface border border-gray-100 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600/20 transition-all text-sm font-medium"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((user: any) => {
            const role = user.role || user.userBranches?.[0]?.role?.name || 'admin';
            const branchName = user.userBranches?.[0]?.branch?.name || 'Sin asignar';
            return (
              <div key={user.id} className="bg-white dark:bg-surface rounded-[32px] p-6 shadow-card hover:scale-[1.02] transition-transform duration-300">
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-600 shadow-sm">
                    <Users size={22} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-black text-secondary tracking-tight truncate">{user.firstName} {user.lastName}</h3>
                    <div className="flex items-center gap-1 text-text-secondary text-xs mt-0.5">
                      <Mail size={12} /> <span className="truncate">{user.email}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${roleStyles[role] || 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/60'}`}>
                    <Shield size={10} className="inline mr-1" />
                    {roleLabels[role] || role}
                  </span>
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/60">
                    {branchName}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-gray-50 dark:border-white/5">
                  <button
                    onClick={() => {
                      setEditing(user);
                      setForm({
                        firstName: user.firstName || '',
                        lastName: user.lastName || '',
                        email: user.email || '',
                        password: '',
                        pin: user.pin || '',
                        role,
                        branchId: user.userBranches?.[0]?.branchId || '',
                      });
                      setShowModal(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition-all"
                  >
                    <Edit3 size={14} /> Editar
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('¿Eliminar este usuario?')) deleteMutation.mutate(user.id);
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-50 transition-all ml-auto"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-surface rounded-[32px] w-full max-w-lg p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black text-secondary tracking-tight">
                {editing ? 'Editar Administrador' : 'Nuevo Administrador'}
              </h2>
              <button onClick={closeModal} className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400 dark:text-white/40 hover:text-secondary transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-secondary uppercase tracking-widest">Nombre</label>
                  <input type="text" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-600/10 text-sm font-medium" required />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-secondary uppercase tracking-widest">Apellido</label>
                  <input type="text" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-600/10 text-sm font-medium" required />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-secondary uppercase tracking-widest">Email</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-600/10 text-sm font-medium" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-secondary uppercase tracking-widest">{editing ? 'Nueva Contraseña' : 'Contraseña'}</label>
                  <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-600/10 text-sm font-medium" {...(!editing && { required: true })} placeholder={editing ? 'Dejar vacío para mantener' : ''} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-secondary uppercase tracking-widest">PIN</label>
                  <input type="text" value={form.pin} onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, '').slice(0, 4) })} className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-600/10 text-sm font-medium" maxLength={4} placeholder="4 dígitos" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-secondary uppercase tracking-widest">Rol</label>
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-600/10 text-sm font-medium">
                    <option value="superadmin">Super Admin</option>
                    <option value="admin">Administrador</option>
                    <option value="manager">Gerente</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-secondary uppercase tracking-widest">Sucursal</label>
                  <select value={form.branchId} onChange={(e) => setForm({ ...form, branchId: e.target.value })} className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-600/10 text-sm font-medium">
                    <option value="">Seleccionar...</option>
                    {branches?.map((b: any) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="flex-1 py-3 bg-gray-100 dark:bg-white/10 text-secondary rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-white/15 transition-all">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-200 hover:scale-105 transition-all">
                  {editing ? 'Guardar' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
