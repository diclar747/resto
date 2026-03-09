import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../stores/auth.store';
import api from '../../../api/client';
import toast from 'react-hot-toast';
import { useState } from 'react';
import {
  Trash2, Shield, Mail, Lock, Hash, UserPlus, Search, X,
  Phone, Eye, EyeOff, ToggleLeft, ToggleRight, Edit3,
  CheckCircle, XCircle, ChevronDown, KeyRound, User
} from 'lucide-react';

function getUserName(u: any): string {
  if (u.firstName || u.lastName) return `${u.firstName || ''} ${u.lastName || ''}`.trim();
  return u.name || 'Sin nombre';
}

function getUserRole(u: any): string {
  return u.branches?.[0]?.role?.name || u.role?.name || u.role || '';
}

function getUserRoleId(u: any): string {
  return u.branches?.[0]?.role?.id || '';
}

function getUserInitials(u: any): string {
  const name = getUserName(u);
  return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
}

const roleColors: Record<string, string> = {
  superadmin: 'bg-gradient-to-r from-purple-600 to-fuchsia-600',
  admin: 'bg-gradient-to-r from-rose-500 to-pink-600',
  manager: 'bg-gradient-to-r from-indigo-500 to-blue-600',
  cashier: 'bg-gradient-to-r from-blue-500 to-cyan-500',
  waiter: 'bg-gradient-to-r from-emerald-500 to-green-600',
  kitchen: 'bg-gradient-to-r from-amber-500 to-orange-500',
  driver: 'bg-gradient-to-r from-violet-500 to-purple-600',
};

const roleLabels: Record<string, string> = {
  superadmin: 'Super Admin',
  admin: 'Administrador',
  manager: 'Gerente',
  cashier: 'Cajero/a',
  waiter: 'Mesero/a',
  kitchen: 'Cocina',
  driver: 'Repartidor',
};

const permissionGroups: Record<string, { label: string; permissions: string[] }> = {
  orders: {
    label: 'Pedidos',
    permissions: ['orders.create', 'orders.view', 'orders.edit', 'orders.cancel', 'orders.discount'],
  },
  tables: {
    label: 'Mesas',
    permissions: ['tables.view', 'tables.manage'],
  },
  menu: {
    label: 'Menú',
    permissions: ['menu.view', 'menu.manage'],
  },
  inventory: {
    label: 'Inventario',
    permissions: ['inventory.view', 'inventory.manage'],
  },
  payments: {
    label: 'Pagos',
    permissions: ['payments:process', 'payments:refund', 'cash_register:open', 'cash_register:close', 'cash_register:adjust'],
  },
  reports: {
    label: 'Reportes',
    permissions: ['reports.view'],
  },
  users: {
    label: 'Usuarios',
    permissions: ['users.view', 'users.manage'],
  },
  kds: {
    label: 'Cocina (KDS)',
    permissions: ['kds.view', 'kds.update'],
  },
  delivery: {
    label: 'Delivery',
    permissions: ['delivery.view', 'delivery.manage'],
  },
  settings: {
    label: 'Configuración',
    permissions: ['settings.manage'],
  },
};

type ModalMode = 'create' | 'edit' | 'permissions' | null;

interface UserForm {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  pin: string;
  phone: string;
  roleId: string;
}

const emptyForm: UserForm = {
  firstName: '', lastName: '', email: '', password: '', pin: '', phone: '', roleId: '',
};

export function UsersPage() {
  const branchId = useAuthStore((s) => s.user?.branchId);
  const queryClient = useQueryClient();
  const [modalMode, setModalMode] = useState<ModalMode>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [showPassword, setShowPassword] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [editPermissions, setEditPermissions] = useState<string[]>([]);

  const { data: users, isLoading } = useQuery({
    queryKey: ['users', branchId],
    queryFn: () => api.get('/users').then((r) => r.data),
  });

  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: () => api.get('/users/roles').then((r) => r.data),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['users'] });

  const createUser = useMutation({
    mutationFn: (data: any) => api.post('/users', { ...data, branchId }),
    onSuccess: () => {
      invalidate();
      closeModal();
      toast.success('Miembro creado exitosamente', {
        icon: '🎉',
        style: { borderRadius: '16px', background: '#001F3D', color: '#fff' },
      });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Error al crear usuario'),
  });

  const updateUser = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/users/${id}`, data),
    onSuccess: () => {
      invalidate();
      closeModal();
      toast.success('Perfil actualizado', {
        icon: '✅',
        style: { borderRadius: '16px', background: '#001F3D', color: '#fff' },
      });
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Error al actualizar'),
  });

  const updatePassword = useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      api.patch(`/users/${id}/password`, { password }),
    onSuccess: () => toast.success('Contraseña actualizada'),
    onError: () => toast.error('Error al cambiar contraseña'),
  });

  const updatePin = useMutation({
    mutationFn: ({ id, pin }: { id: string; pin: string }) =>
      api.patch(`/users/${id}/pin`, { pin }),
    onSuccess: () => {
      invalidate();
      toast.success('PIN actualizado');
    },
    onError: () => toast.error('Error al cambiar PIN'),
  });

  const assignRole = useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      api.post(`/users/${userId}/branch`, { branchId, roleId }),
    onSuccess: () => {
      invalidate();
      toast.success('Rol actualizado');
    },
    onError: () => toast.error('Error al cambiar rol'),
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch(`/users/${id}`, { isActive }),
    onSuccess: (_, vars) => {
      invalidate();
      toast.success(vars.isActive ? 'Usuario activado' : 'Usuario desactivado', {
        icon: vars.isActive ? '✅' : '⛔',
        style: { borderRadius: '16px', background: '#001F3D', color: '#fff' },
      });
    },
  });

  const deleteUser = useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      invalidate();
      closeModal();
      toast.success('Usuario eliminado');
    },
  });

  const closeModal = () => {
    setModalMode(null);
    setSelectedUser(null);
    setForm(emptyForm);
    setShowPassword(false);
    setShowPin(false);
    setEditPermissions([]);
  };

  const openCreate = () => {
    setForm(emptyForm);
    setModalMode('create');
  };

  const openEdit = (user: any) => {
    setSelectedUser(user);
    setForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      password: '',
      pin: user.pin || '',
      phone: user.phone || '',
      roleId: getUserRoleId(user),
    });
    setModalMode('edit');
  };

  const openPermissions = (user: any) => {
    setSelectedUser(user);
    const role = user.branches?.[0]?.role;
    setEditPermissions(role?.permissions || []);
    setModalMode('permissions');
  };

  const handleSaveEdit = () => {
    if (!selectedUser) return;
    const data: any = {
      firstName: form.firstName,
      lastName: form.lastName,
      phone: form.phone || undefined,
    };
    if (form.pin && form.pin !== selectedUser.pin) {
      data.pin = form.pin;
    }
    updateUser.mutate({ id: selectedUser.id, data });
    if (form.password) {
      updatePassword.mutate({ id: selectedUser.id, password: form.password });
    }
    if (form.roleId && form.roleId !== getUserRoleId(selectedUser)) {
      assignRole.mutate({ userId: selectedUser.id, roleId: form.roleId });
    }
  };

  const filteredUsers = users?.filter((u: any) => {
    const name = getUserName(u).toLowerCase();
    const email = (u.email || '').toLowerCase();
    const term = searchTerm.toLowerCase();
    const matchSearch = name.includes(term) || email.includes(term);
    const matchRole = filterRole === 'all' || getUserRole(u) === filterRole;
    const matchStatus = filterStatus === 'all'
      || (filterStatus === 'active' && u.isActive !== false)
      || (filterStatus === 'inactive' && u.isActive === false);
    return matchSearch && matchRole && matchStatus;
  });

  const totalUsers = users?.length || 0;
  const activeUsers = users?.filter((u: any) => u.isActive !== false).length || 0;

  return (
    <div className="p-8 space-y-8 bg-[#F4F7FE] min-h-screen">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-secondary tracking-tight">
            Gestión de <span className="text-primary">Equipo</span>
          </h1>
          <p className="text-sm font-medium text-text-secondary mt-1">
            {activeUsers} activos de {totalUsers} miembros del equipo
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={16} />
            <input
              type="text"
              placeholder="Buscar..."
              className="pl-11 pr-4 py-2.5 bg-white border border-gray-100 rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all w-52 shadow-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Role Filter */}
          <div className="relative">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2.5 bg-white border border-gray-100 rounded-2xl text-xs font-bold shadow-sm appearance-none pr-8 outline-none"
            >
              <option value="all">Todos los roles</option>
              {roles?.map((r: any) => (
                <option key={r.id} value={r.name}>{roleLabels[r.name] || r.name}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2.5 bg-white border border-gray-100 rounded-2xl text-xs font-bold shadow-sm appearance-none pr-8 outline-none"
            >
              <option value="all">Todos</option>
              <option value="active">Activos</option>
              <option value="inactive">Inactivos</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>

          {/* Add Button */}
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-primary/20 active:scale-95"
          >
            <UserPlus size={16} /> Nuevo
          </button>
        </div>
      </div>

      {/* Users Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-72 bg-white/60 animate-pulse rounded-[32px]" />
          ))}
        </div>
      ) : filteredUsers?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
          <div className="w-20 h-20 bg-gray-100 rounded-[28px] flex items-center justify-center">
            <Search size={32} className="text-gray-300" />
          </div>
          <p className="text-sm font-bold text-text-secondary">No se encontraron miembros</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredUsers?.map((user: any) => {
            const roleName = getUserRole(user);
            const fullName = getUserName(user);
            const initials = getUserInitials(user);
            const branchName = user.branches?.[0]?.branch?.name;
            const isActive = user.isActive !== false;
            return (
              <div
                key={user.id}
                className={`bg-white rounded-[32px] p-6 shadow-card border-2 hover:-translate-y-1 transition-all group overflow-hidden relative ${
                  isActive ? 'border-transparent hover:border-primary/10' : 'border-transparent opacity-60'
                }`}
              >
                {/* Role glow */}
                <div className={`absolute top-0 right-0 w-40 h-40 -mr-20 -mt-20 rounded-full blur-3xl opacity-[0.06] group-hover:opacity-[0.12] transition-opacity ${roleColors[roleName] || 'bg-gray-500'}`} />

                {/* Header: avatar + role badge */}
                <div className="flex items-start justify-between mb-5 relative">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white text-lg shadow-lg ${roleColors[roleName] || 'bg-gray-400'}`}>
                    {initials}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest text-white shadow ${roleColors[roleName] || 'bg-gray-500'}`}>
                      {roleLabels[roleName] || roleName || 'Sin rol'}
                    </div>
                    {/* Active toggle */}
                    <button
                      onClick={() => toggleActive.mutate({ id: user.id, isActive: !isActive })}
                      className="flex items-center gap-1 group/toggle"
                      title={isActive ? 'Desactivar' : 'Activar'}
                    >
                      {isActive ? (
                        <ToggleRight size={22} className="text-emerald-500 group-hover/toggle:text-emerald-600" />
                      ) : (
                        <ToggleLeft size={22} className="text-gray-300 group-hover/toggle:text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="mb-5">
                  <h4 className="text-base font-black text-secondary truncate leading-tight">{fullName}</h4>
                  <div className="flex items-center gap-1.5 text-text-secondary mt-1.5">
                    <Mail size={11} className="shrink-0" />
                    <span className="text-[11px] font-bold truncate">{user.email}</span>
                  </div>
                  {user.phone && (
                    <div className="flex items-center gap-1.5 text-text-secondary mt-1">
                      <Phone size={11} className="shrink-0" />
                      <span className="text-[11px] font-bold">{user.phone}</span>
                    </div>
                  )}
                  {branchName && (
                    <p className="text-[9px] font-black text-text-secondary mt-2 uppercase tracking-widest bg-gray-50 inline-block px-2 py-0.5 rounded-md">
                      {branchName}
                    </p>
                  )}
                </div>

                {/* Meta: PIN + Status */}
                <div className="grid grid-cols-2 gap-2 mb-5">
                  <div className="bg-[#F4F7FE] p-2.5 rounded-xl">
                    <p className="text-[8px] font-black uppercase text-gray-400 mb-0.5 tracking-wider">PIN</p>
                    <p className="text-xs font-black text-secondary flex items-center gap-1">
                      <KeyRound size={10} className="text-gray-400" />
                      {user.pin ? '••••' : '—'}
                    </p>
                  </div>
                  <div className="bg-[#F4F7FE] p-2.5 rounded-xl">
                    <p className="text-[8px] font-black uppercase text-gray-400 mb-0.5 tracking-wider">Estado</p>
                    <div className="flex items-center gap-1">
                      {isActive ? (
                        <CheckCircle size={12} className="text-emerald-500" />
                      ) : (
                        <XCircle size={12} className="text-rose-400" />
                      )}
                      <span className={`text-[10px] font-black uppercase ${isActive ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => openEdit(user)}
                    className="flex-1 py-2.5 bg-gray-50 hover:bg-primary/5 hover:text-primary rounded-xl text-[10px] font-black uppercase tracking-widest text-secondary transition-all flex items-center justify-center gap-1.5"
                  >
                    <Edit3 size={12} /> Editar
                  </button>
                  <button
                    onClick={() => openPermissions(user)}
                    className="flex-1 py-2.5 bg-gray-50 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest text-secondary transition-all flex items-center justify-center gap-1.5"
                  >
                    <Shield size={12} /> Permisos
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`¿Eliminar a ${fullName} permanentemente?`)) deleteUser.mutate(user.id);
                    }}
                    className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-400 hover:text-rose-600 rounded-xl transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =================== CREATE / EDIT MODAL =================== */}
      {(modalMode === 'create' || modalMode === 'edit') && (
        <div className="fixed inset-0 bg-secondary/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={closeModal}>
          <div className="bg-white rounded-[32px] p-8 w-full max-w-lg shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Close */}
            <button onClick={closeModal} className="absolute top-6 right-6 w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">
              <X size={16} />
            </button>

            {/* Header */}
            <div className="mb-6">
              <h3 className="text-2xl font-black text-secondary tracking-tight">
                {modalMode === 'create' ? 'Nuevo Miembro' : 'Editar Perfil'}
              </h3>
              <p className="text-sm font-medium text-text-secondary mt-1">
                {modalMode === 'create' ? 'Configura las credenciales de acceso' : `Editando a ${getUserName(selectedUser)}`}
              </p>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div className="grid grid-cols-2 gap-3">
                <div className="relative group">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={16} />
                  <input
                    className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 outline-none placeholder:text-gray-400 font-bold"
                    placeholder="Nombre"
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  />
                </div>
                <input
                  className="w-full px-4 py-3.5 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 outline-none placeholder:text-gray-400 font-bold"
                  placeholder="Apellido"
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                />
              </div>

              {/* Email */}
              <div className="relative group">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={16} />
                <input
                  className={`w-full pl-10 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 outline-none placeholder:text-gray-400 font-bold ${modalMode === 'edit' ? 'opacity-60' : ''}`}
                  placeholder="Correo electrónico"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  disabled={modalMode === 'edit'}
                />
              </div>

              {/* Phone */}
              <div className="relative group">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={16} />
                <input
                  className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 outline-none placeholder:text-gray-400 font-bold"
                  placeholder="Teléfono (opcional)"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>

              {/* Password + PIN */}
              <div className="grid grid-cols-2 gap-3">
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={16} />
                  <input
                    className="w-full pl-10 pr-10 py-3.5 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 outline-none placeholder:text-gray-400 font-bold"
                    placeholder={modalMode === 'edit' ? 'Nueva contraseña' : 'Contraseña'}
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <div className="relative group">
                  <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={16} />
                  <input
                    className="w-full pl-10 pr-10 py-3.5 bg-gray-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 outline-none placeholder:text-gray-400 font-bold"
                    placeholder="PIN (4 dígitos)"
                    maxLength={4}
                    type={showPin ? 'text' : 'password'}
                    inputMode="numeric"
                    value={form.pin}
                    onChange={(e) => setForm({ ...form, pin: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPin ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Role selector */}
              <div>
                <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-2 ml-1">Rol del Equipo</p>
                <div className="grid grid-cols-2 gap-2">
                  {roles?.map((r: any) => (
                    <button
                      key={r.id}
                      onClick={() => setForm({ ...form, roleId: r.id })}
                      className={`p-3 rounded-2xl text-left transition-all border-2 ${
                        form.roleId === r.id
                          ? 'border-primary bg-primary/5 shadow-md'
                          : 'border-transparent bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-white text-[8px] font-black ${roleColors[r.name] || 'bg-gray-400'}`}>
                          {r.name.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="text-xs font-black text-secondary uppercase tracking-wider">
                          {roleLabels[r.name] || r.name}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-8">
              <button
                className="flex-1 py-3.5 bg-gray-100 hover:bg-gray-200 text-secondary rounded-2xl text-xs font-black uppercase tracking-widest transition-all"
                onClick={closeModal}
              >
                Cancelar
              </button>
              <button
                className="flex-[2] py-3.5 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-primary/20 hover:scale-[1.02] disabled:opacity-50 active:scale-[0.98]"
                onClick={() => {
                  if (modalMode === 'create') {
                    createUser.mutate(form);
                  } else {
                    handleSaveEdit();
                  }
                }}
                disabled={
                  modalMode === 'create'
                    ? (!form.firstName || !form.email || !form.password || !form.roleId)
                    : (!form.firstName)
                }
              >
                {(createUser.isPending || updateUser.isPending) ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                ) : (
                  modalMode === 'create' ? 'Crear Miembro' : 'Guardar Cambios'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================== PERMISSIONS MODAL =================== */}
      {modalMode === 'permissions' && selectedUser && (
        <div className="fixed inset-0 bg-secondary/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4" onClick={closeModal}>
          <div className="bg-white rounded-[32px] p-8 w-full max-w-2xl shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Close */}
            <button onClick={closeModal} className="absolute top-6 right-6 w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">
              <X size={16} />
            </button>

            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white text-base shadow-lg ${roleColors[getUserRole(selectedUser)] || 'bg-gray-400'}`}>
                {getUserInitials(selectedUser)}
              </div>
              <div>
                <h3 className="text-xl font-black text-secondary tracking-tight">
                  Permisos de {getUserName(selectedUser)}
                </h3>
                <p className="text-xs font-bold text-text-secondary mt-0.5">
                  Rol actual: <span className="text-primary uppercase">{roleLabels[getUserRole(selectedUser)] || getUserRole(selectedUser)}</span>
                </p>
              </div>
            </div>

            <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-4">
              Los permisos se definen por el rol asignado. Cambiá el rol para modificar los accesos.
            </p>

            {/* Role quick switch */}
            <div className="mb-6">
              <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-2">Cambiar Rol</p>
              <div className="flex flex-wrap gap-2">
                {roles?.map((r: any) => {
                  const current = getUserRoleId(selectedUser) === r.id;
                  return (
                    <button
                      key={r.id}
                      onClick={() => {
                        if (!current) {
                          assignRole.mutate({ userId: selectedUser.id, roleId: r.id });
                          setEditPermissions(r.permissions || []);
                        }
                      }}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        current
                          ? `${roleColors[r.name] || 'bg-gray-500'} text-white shadow-lg`
                          : 'bg-gray-50 text-secondary hover:bg-gray-100'
                      }`}
                    >
                      {roleLabels[r.name] || r.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Permissions Grid */}
            <div className="space-y-4">
              {Object.entries(permissionGroups).map(([key, group]) => (
                <div key={key} className="bg-gray-50 rounded-2xl p-4">
                  <h4 className="text-xs font-black text-secondary uppercase tracking-widest mb-3">{group.label}</h4>
                  <div className="flex flex-wrap gap-2">
                    {group.permissions.map((perm) => {
                      const has = editPermissions.includes(perm);
                      return (
                        <div
                          key={perm}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                            has
                              ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                              : 'bg-white text-gray-400 border border-gray-100'
                          }`}
                        >
                          <span className="flex items-center gap-1">
                            {has ? <CheckCircle size={10} /> : <XCircle size={10} />}
                            {perm.replace(/[.:]/g, ' ').replace(/_/g, ' ')}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={closeModal}
              className="w-full mt-6 py-3.5 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
