import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import toast from 'react-hot-toast';
import {
  Store, Plus, Edit3, Trash2, MapPin, Phone, X,
  ToggleLeft, ToggleRight, Search
} from 'lucide-react';

interface Branch {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  whatsapp?: string;
  currency?: string;
  timezone?: string;
  isActive?: boolean;
}

export function RestaurantsPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', address: '', phone: '', whatsapp: '', currency: 'ARS', timezone: 'America/Argentina/Buenos_Aires' });

  const { data: branches, isLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: () => api.get('/marketplace/branches').then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => api.post('/branches', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast.success('Sucursal creada exitosamente');
      closeModal();
    },
    onError: () => toast.error('Error al crear sucursal'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Branch> }) => api.patch(`/branches/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast.success('Sucursal actualizada');
      closeModal();
    },
    onError: () => toast.error('Error al actualizar'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/branches/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branches'] });
      toast.success('Sucursal eliminada');
    },
    onError: () => toast.error('Error al eliminar'),
  });

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setForm({ name: '', address: '', phone: '', whatsapp: '', currency: 'ARS', timezone: 'America/Argentina/Buenos_Aires' });
  };

  const openEdit = (branch: Branch) => {
    setEditing(branch);
    setForm({
      name: branch.name || '',
      address: branch.address || '',
      phone: branch.phone || '',
      whatsapp: branch.whatsapp || '',
      currency: branch.currency || 'ARS',
      timezone: branch.timezone || 'America/Argentina/Buenos_Aires',
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const toggleActive = (branch: Branch) => {
    updateMutation.mutate({ id: branch.id, data: { isActive: !branch.isActive } });
  };

  const filtered = branches?.filter((b: Branch) =>
    b.name?.toLowerCase().includes(search.toLowerCase()) ||
    b.address?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="p-8 space-y-8 bg-[#F4F7FE] min-h-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-secondary tracking-tight">Restaurantes</h1>
          <p className="text-text-secondary font-medium mt-1">Gestión de sucursales del sistema</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-200 hover:scale-105 transition-all"
        >
          <Plus size={16} /> Nueva Sucursal
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar sucursal..."
          className="w-full pl-12 pr-4 py-3 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600/20 transition-all text-sm font-medium"
        />
      </div>

      {/* Branch Grid */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((branch: Branch) => (
            <div key={branch.id} className="bg-white rounded-[32px] p-6 shadow-card hover:scale-[1.02] transition-transform duration-300 group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg ${branch.isActive !== false ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white' : 'bg-gray-200 text-gray-400'}`}>
                    <Store size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-secondary tracking-tight">{branch.name}</h3>
                    <span className={`text-[10px] font-black uppercase tracking-widest ${branch.isActive !== false ? 'text-emerald-500' : 'text-gray-400'}`}>
                      {branch.isActive !== false ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                </div>
              </div>

              {branch.address && (
                <div className="flex items-center gap-2 text-sm text-text-secondary mb-2">
                  <MapPin size={14} /> <span className="truncate">{branch.address}</span>
                </div>
              )}
              {branch.phone && (
                <div className="flex items-center gap-2 text-sm text-text-secondary mb-4">
                  <Phone size={14} /> <span>{branch.phone}</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-4 border-t border-gray-50">
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
                  onClick={() => {
                    if (confirm('¿Eliminar esta sucursal?')) deleteMutation.mutate(branch.id);
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-50 transition-all ml-auto"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[32px] w-full max-w-lg p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-black text-secondary tracking-tight">
                {editing ? 'Editar Sucursal' : 'Nueva Sucursal'}
              </h2>
              <button onClick={closeModal} className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:text-secondary transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-black text-secondary uppercase tracking-widest">Nombre</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
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
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-600/10 text-sm font-medium"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-secondary uppercase tracking-widest">Teléfono</label>
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-600/10 text-sm font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-secondary uppercase tracking-widest">WhatsApp</label>
                  <input
                    type="text"
                    value={form.whatsapp}
                    onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-600/10 text-sm font-medium"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-secondary uppercase tracking-widest">Moneda</label>
                  <select
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-600/10 text-sm font-medium"
                  >
                    <option value="ARS">ARS - Peso Argentino</option>
                    <option value="USD">USD - Dólar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="MXN">MXN - Peso Mexicano</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-secondary uppercase tracking-widest">Zona Horaria</label>
                  <select
                    value={form.timezone}
                    onChange={(e) => setForm({ ...form, timezone: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-600/10 text-sm font-medium"
                  >
                    <option value="America/Argentina/Buenos_Aires">Buenos Aires</option>
                    <option value="America/Mexico_City">Ciudad de México</option>
                    <option value="America/Bogota">Bogotá</option>
                    <option value="America/Santiago">Santiago</option>
                    <option value="Europe/Madrid">Madrid</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={closeModal} className="flex-1 py-3 bg-gray-100 text-secondary rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-200 hover:scale-105 transition-all">
                  {editing ? 'Guardar Cambios' : 'Crear Sucursal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
