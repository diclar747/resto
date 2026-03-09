import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import toast from 'react-hot-toast';
import {
  Store, Plus, Edit3, Trash2, MapPin, Phone, X, Users,
  ToggleLeft, ToggleRight, Search, Eye, EyeOff, ChevronDown, ChevronUp,
  Mail, Shield, Hash,
} from 'lucide-react';

interface BranchUser {
  user: { id: string; firstName: string; lastName: string; email: string; isActive: boolean };
  role: { id: string; name: string };
}

interface Branch {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  whatsapp?: string;
  currency?: string;
  timezone?: string;
  isActive?: boolean;
  users?: BranchUser[];
  _count?: { orders: number; tables: number };
}

const emptyBranchForm = {
  name: '', address: '', phone: '', whatsapp: '',
  currency: 'PYG', timezone: 'America/Asuncion',
};

const emptyAdminForm = {
  email: '', password: '', firstName: '', lastName: '', phone: '', pin: '',
};

export function RestaurantsPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [search, setSearch] = useState('');
  const [expandedBranch, setExpandedBranch] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState(emptyBranchForm);
  const [adminForm, setAdminForm] = useState(emptyAdminForm);

  const { data: branches, isLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: () => api.get('/branches?includeInactive=true').then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/branches', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast.success('Restaurante creado exitosamente');
      closeModal();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || 'Error al crear restaurante'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Branch> }) => api.patch(`/branches/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast.success('Restaurante actualizado');
      closeModal();
    },
    onError: () => toast.error('Error al actualizar'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/branches/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast.success('Restaurante eliminado');
    },
    onError: () => toast.error('Error al eliminar'),
  });

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setForm(emptyBranchForm);
    setAdminForm(emptyAdminForm);
    setShowPassword(false);
  };

  const openEdit = (branch: Branch) => {
    setEditing(branch);
    setForm({
      name: branch.name || '',
      address: branch.address || '',
      phone: branch.phone || '',
      whatsapp: branch.whatsapp || '',
      currency: branch.currency || 'PYG',
      timezone: branch.timezone || 'America/Asuncion',
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: form });
    } else {
      if (!adminForm.email || !adminForm.password || !adminForm.firstName || !adminForm.lastName) {
        toast.error('Completa los datos del administrador');
        return;
      }
      createMutation.mutate({ ...form, admin: adminForm });
    }
  };

  const toggleActive = (branch: Branch) => {
    updateMutation.mutate({ id: branch.id, data: { isActive: !branch.isActive } });
  };

  const filtered = branches?.filter((b: Branch) =>
    b.name?.toLowerCase().includes(search.toLowerCase()) ||
    b.address?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const activeCount = branches?.filter((b: Branch) => b.isActive !== false).length || 0;
  const inactiveCount = branches?.filter((b: Branch) => b.isActive === false).length || 0;

  const getAdminUser = (branch: Branch) =>
    branch.users?.find((u) => u.role.name === 'admin');

  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-8 bg-[#F4F7FE] min-h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-3xl font-black text-secondary tracking-tight">Restaurantes</h1>
          <p className="text-text-secondary font-medium mt-1">
            {activeCount} activos · {inactiveCount} inactivos · {branches?.length || 0} total
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-200 hover:scale-105 transition-all"
        >
          <Plus size={16} /> Nuevo Restaurante
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar restaurante..."
          className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600/20 transition-all text-sm font-medium"
        />
      </div>

      {/* Branch Grid */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Store size={48} className="mx-auto text-gray-200 mb-4" />
          <p className="text-text-secondary font-medium">No se encontraron restaurantes</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filtered.map((branch: Branch) => {
            const admin = getAdminUser(branch);
            const isExpanded = expandedBranch === branch.id;

            return (
              <div key={branch.id} className={`bg-white rounded-[32px] shadow-card transition-all duration-300 overflow-hidden ${branch.isActive === false ? 'opacity-60' : ''}`}>
                {/* Card header */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${branch.isActive !== false ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                        <Store size={22} />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-secondary tracking-tight">{branch.name}</h3>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${branch.isActive !== false ? 'text-emerald-500' : 'text-gray-400'}`}>
                          {branch.isActive !== false ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-text-secondary">
                      <span className="bg-gray-50 px-2 py-1 rounded-lg font-bold">{branch.currency || 'PYG'}</span>
                    </div>
                  </div>

                  {branch.address && (
                    <div className="flex items-center gap-2 text-sm text-text-secondary mb-1.5">
                      <MapPin size={14} className="shrink-0" /> <span className="truncate">{branch.address}</span>
                    </div>
                  )}
                  {branch.phone && (
                    <div className="flex items-center gap-2 text-sm text-text-secondary mb-1.5">
                      <Phone size={14} className="shrink-0" /> <span>{branch.phone}</span>
                    </div>
                  )}

                  {/* Stats row */}
                  <div className="flex items-center gap-4 mt-3 text-xs text-text-secondary">
                    <div className="flex items-center gap-1.5">
                      <Users size={14} />
                      <span className="font-bold">{branch.users?.length || 0} usuarios</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Hash size={14} />
                      <span className="font-bold">{branch._count?.tables || 0} mesas</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold">{branch._count?.orders || 0} órdenes</span>
                    </div>
                  </div>

                  {/* Admin info */}
                  {admin && (
                    <div className="mt-3 p-3 bg-indigo-50 rounded-xl">
                      <div className="flex items-center gap-2 text-xs">
                        <Shield size={14} className="text-indigo-600" />
                        <span className="font-black text-indigo-700">Admin:</span>
                        <span className="font-medium text-indigo-600">
                          {admin.user.firstName} {admin.user.lastName}
                        </span>
                        <span className="text-indigo-400 ml-auto truncate">{admin.user.email}</span>
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center gap-2 pt-4 mt-4 border-t border-gray-50">
                    <button
                      onClick={() => toggleActive(branch)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold hover:bg-gray-50 transition-all"
                      title={branch.isActive !== false ? 'Desactivar' : 'Activar'}
                    >
                      {branch.isActive !== false
                        ? <ToggleRight size={18} className="text-emerald-500" />
                        : <ToggleLeft size={18} className="text-gray-400" />
                      }
                    </button>
                    <button
                      onClick={() => openEdit(branch)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-indigo-600 hover:bg-indigo-50 transition-all"
                    >
                      <Edit3 size={14} /> Editar
                    </button>
                    <button
                      onClick={() => setExpandedBranch(isExpanded ? null : branch.id)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-purple-600 hover:bg-purple-50 transition-all"
                    >
                      <Users size={14} /> Staff
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar "${branch.name}"? Esta acción desactivará el restaurante.`))
                          deleteMutation.mutate(branch.id);
                      }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-50 transition-all ml-auto"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Expanded staff list */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/50 p-5">
                    <h4 className="text-xs font-black text-secondary uppercase tracking-widest mb-3">
                      Personal del restaurante ({branch.users?.length || 0})
                    </h4>
                    {branch.users && branch.users.length > 0 ? (
                      <div className="space-y-2">
                        {branch.users.map((ub) => (
                          <div key={ub.user.id} className="flex items-center gap-3 p-3 bg-white rounded-xl">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-black">
                              {ub.user.firstName[0]}{ub.user.lastName[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-secondary truncate">
                                {ub.user.firstName} {ub.user.lastName}
                              </p>
                              <p className="text-xs text-text-secondary truncate">{ub.user.email}</p>
                            </div>
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                              ub.role.name === 'admin' ? 'bg-indigo-100 text-indigo-700' :
                              ub.role.name === 'cashier' ? 'bg-emerald-100 text-emerald-700' :
                              ub.role.name === 'waiter' ? 'bg-amber-100 text-amber-700' :
                              ub.role.name === 'kitchen' ? 'bg-orange-100 text-orange-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {ub.role.name}
                            </span>
                            <span className={`w-2 h-2 rounded-full ${ub.user.isActive ? 'bg-emerald-400' : 'bg-gray-300'}`} />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-text-secondary italic">Sin personal asignado</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[32px] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-4 md:p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black text-secondary tracking-tight">
                {editing ? 'Editar Restaurante' : 'Nuevo Restaurante'}
              </h2>
              <button onClick={closeModal} className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-secondary transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Branch info section */}
              <div>
                <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Store size={14} /> Datos del Restaurante
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-secondary uppercase tracking-widest">Nombre del Restaurante *</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Ej: Restaurante El Buen Sabor"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-600/10 text-sm font-medium"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-secondary uppercase tracking-widest">Dirección</label>
                    <input
                      type="text"
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      placeholder="Ej: Av. Mariscal López 1234, Asunción"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-600/10 text-sm font-medium"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-secondary uppercase tracking-widest">Teléfono</label>
                      <input
                        type="text"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="Ej: 021-555-1234"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-600/10 text-sm font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-secondary uppercase tracking-widest">WhatsApp</label>
                      <input
                        type="text"
                        value={form.whatsapp}
                        onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                        placeholder="Ej: +595 981 555 123"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-600/10 text-sm font-medium"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-secondary uppercase tracking-widest">Moneda</label>
                      <select
                        value={form.currency}
                        onChange={(e) => setForm({ ...form, currency: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-600/10 text-sm font-medium"
                      >
                        <option value="PYG">PYG - Guaraní</option>
                        <option value="USD">USD - Dólar</option>
                        <option value="ARS">ARS - Peso Argentino</option>
                        <option value="BRL">BRL - Real</option>
                        <option value="EUR">EUR - Euro</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-secondary uppercase tracking-widest">Zona Horaria</label>
                      <select
                        value={form.timezone}
                        onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-600/10 text-sm font-medium"
                      >
                        <option value="America/Asuncion">Asunción (Paraguay)</option>
                        <option value="America/Argentina/Buenos_Aires">Buenos Aires</option>
                        <option value="America/Sao_Paulo">São Paulo</option>
                        <option value="America/Bogota">Bogotá</option>
                        <option value="America/Mexico_City">Ciudad de México</option>
                        <option value="America/Santiago">Santiago</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Admin user section (only for creation) */}
              {!editing && (
                <div>
                  <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Shield size={14} /> Administrador del Restaurante
                  </h3>
                  <p className="text-xs text-text-secondary mb-4">
                    Este usuario será el administrador principal del restaurante. Podrá gestionar personal, menú y configuración.
                  </p>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-secondary uppercase tracking-widest">Nombre *</label>
                        <input
                          type="text"
                          value={adminForm.firstName}
                          onChange={(e) => setAdminForm({ ...adminForm, firstName: e.target.value })}
                          placeholder="Juan"
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-600/10 text-sm font-medium"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-secondary uppercase tracking-widest">Apellido *</label>
                        <input
                          type="text"
                          value={adminForm.lastName}
                          onChange={(e) => setAdminForm({ ...adminForm, lastName: e.target.value })}
                          placeholder="Pérez"
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-600/10 text-sm font-medium"
                          required
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-secondary uppercase tracking-widest flex items-center gap-2">
                        <Mail size={12} /> Email *
                      </label>
                      <input
                        type="email"
                        value={adminForm.email}
                        onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                        placeholder="admin@restaurante.com"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-600/10 text-sm font-medium"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-black text-secondary uppercase tracking-widest">Contraseña *</label>
                        <div className="relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={adminForm.password}
                            onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                            placeholder="Mínimo 6 caracteres"
                            className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-600/10 text-sm font-medium"
                            required
                            minLength={6}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-secondary"
                          >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-black text-secondary uppercase tracking-widest">PIN (4 dígitos)</label>
                        <input
                          type="text"
                          value={adminForm.pin}
                          onChange={(e) => {
                            const v = e.target.value.replace(/\D/g, '').slice(0, 4);
                            setAdminForm({ ...adminForm, pin: v });
                          }}
                          placeholder="1234"
                          inputMode="numeric"
                          maxLength={4}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-600/10 text-sm font-medium"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-secondary uppercase tracking-widest">Teléfono del Admin</label>
                      <input
                        type="text"
                        value={adminForm.phone}
                        onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value })}
                        placeholder="+595 981 555 123"
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-600/10 text-sm font-medium"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Submit buttons */}
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="flex-1 py-3 bg-gray-100 text-secondary rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-200 hover:scale-105 transition-all disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Guardando...'
                    : editing ? 'Guardar Cambios' : 'Crear Restaurante'
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
