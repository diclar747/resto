import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../stores/auth.store';
import api from '../../../api/client';
import toast from 'react-hot-toast';
import { useState } from 'react';
import {
  Plus, AlertTriangle, Package, Search, History, Layers, Boxes, Edit3, Trash2
} from 'lucide-react';

export function InventoryPage() {
  const branchId = useAuthStore((s) => s.user?.branchId);
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'stock' | 'ingredients' | 'waste'>('stock');
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [ingredientForm, setIngredientForm] = useState({ name: '', unit: 'kg', minStock: '0' });

  const { data: ingredients } = useQuery({
    queryKey: ['ingredients', branchId],
    queryFn: () => api.get(`/inventory/ingredients?branchId=${branchId}`).then((r) => r.data),
    enabled: !!branchId,
  });

  const { data: stockItems } = useQuery({
    queryKey: ['stock', branchId],
    queryFn: () => api.get(`/inventory/stock?branchId=${branchId}`).then((r) => r.data),
    enabled: !!branchId,
  });

  const { data: wasteRecords } = useQuery({
    queryKey: ['waste', branchId],
    queryFn: () => api.get(`/inventory/waste?branchId=${branchId}`).then((r) => r.data),
    enabled: !!branchId && tab === 'waste',
  });

  const createIngredient = useMutation({
    mutationFn: (data: any) => api.post('/inventory/ingredients', { ...data, branchId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ingredients'] });
      setShowAddForm(false);
      setIngredientForm({ name: '', unit: 'kg', minStock: '0' });
      toast.success('Ingrediente registrado correctamente');
    },
  });

  const lowStockItems = stockItems?.filter((s: any) => {
    const ingredient = ingredients?.find((i: any) => i.id === s.ingredientId);
    return ingredient && s.currentStock <= ingredient.minStock;
  }) || [];

  const filteredItems = (tab === 'stock' ? stockItems : ingredients)?.filter((item: any) => {
    const name = item.name || ingredients?.find((i: any) => i.id === item.ingredientId)?.name || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="p-8 space-y-8 bg-[#F4F7FE] min-h-full font-outfit">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-secondary tracking-tight">Control de Inventario</h2>
          <p className="text-text-secondary font-medium mt-1 uppercase text-[10px] tracking-widest">Gestión de insumos y mermas</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddForm(true)}
            className="px-6 py-3 bg-primary text-white rounded-2xl font-black text-xs shadow-lg shadow-primary/20 hover:scale-[1.05] transition-all flex items-center gap-2 uppercase tracking-widest"
          >
            <Plus size={18} /> Nuevo Insumo
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-[32px] p-6 shadow-card border-none flex items-center gap-5">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
            <Package size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Items Totales</p>
            <p className="text-2xl font-black text-secondary">{stockItems?.length || 0}</p>
          </div>
        </div>
        <div className="bg-white rounded-[32px] p-6 shadow-card border-none flex items-center gap-5 relative overflow-hidden group">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${lowStockItems.length > 0 ? 'bg-rose-50 text-rose-500 animate-pulse' : 'bg-success/10 text-success'}`}>
            <AlertTriangle size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Stock Crítico</p>
            <p className={`text-2xl font-black ${lowStockItems.length > 0 ? 'text-rose-500' : 'text-secondary'}`}>{lowStockItems.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-[32px] p-6 shadow-card border-none flex items-center gap-5">
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
            <History size={28} />
          </div>
          <div>
            <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Sincronizado</p>
            <p className="text-2xl font-black text-secondary">Ayer</p>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-[40px] p-8 shadow-card border-none space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-gray-50 pb-8">
          <div className="flex p-1.5 bg-gray-50 rounded-2xl w-fit">
            {[
              { id: 'stock', label: 'Estatus Stock', icon: Boxes },
              { id: 'ingredients', label: 'Catálogo', icon: Layers },
              { id: 'waste', label: 'Mermas', icon: Trash2 }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as any)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black transition-all uppercase tracking-widest ${tab === t.id ? 'bg-white text-primary shadow-sm scale-105' : 'text-text-secondary hover:text-secondary'
                  }`}
              >
                <t.icon size={16} /> {t.label}
              </button>
            ))}
          </div>

          <div className="relative group max-w-sm w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary transition-colors" size={18} />
            <input
              type="text"
              placeholder="Buscar insumo..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all text-xs font-bold"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-[32px] border border-gray-50">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="text-left px-8 py-5 text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Insumo</th>
                <th className="text-left px-8 py-5 text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Unidad</th>
                <th className="text-center px-8 py-5 text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Stock Actual</th>
                <th className="text-center px-8 py-5 text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Mínimo</th>
                <th className="text-right px-8 py-5 text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {tab === 'stock' && filteredItems?.map((stock: any) => {
                const ingredient = ingredients?.find((i: any) => i.id === stock.ingredientId);
                const isLow = ingredient && stock.currentStock <= ingredient.minStock;
                return (
                  <tr key={stock.id} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${isLow ? 'bg-rose-50 text-rose-500' : 'bg-primary/5 text-primary'}`}>
                          {ingredient?.name?.[0]?.toUpperCase() || 'I'}
                        </div>
                        <div>
                          <p className="text-sm font-black text-secondary italic">{ingredient?.name || 'Item Desconocido'}</p>
                          <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Ref: {stock.id.slice(-6)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-xs font-bold text-text-secondary uppercase">{ingredient?.unit || 'kg'}</span>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <p className={`text-lg font-black tracking-tight ${isLow ? 'text-rose-500' : 'text-secondary'}`}>
                        {Number(stock.currentStock).toLocaleString()}
                      </p>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className="text-xs font-black text-text-secondary opacity-60">{ingredient?.minStock}</span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button className="p-2.5 text-gray-400 hover:text-primary hover:bg-white hover:shadow-sm rounded-xl transition-all"><Edit3 size={16} /></button>
                        <button className="p-2.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {/* ... other tabs would follow similar premium patterns ... */}
            </tbody>
          </table>

          {filteredItems?.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="w-20 h-20 bg-gray-50 rounded-[32px] flex items-center justify-center text-gray-200">
                <Package size={48} />
              </div>
              <div>
                <p className="text-lg font-black text-secondary">No hay resultados</p>
                <p className="text-sm font-medium text-text-secondary uppercase text-[10px] tracking-widest">Agrega items para comenzar</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add form modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-secondary/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[32px] p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in duration-300">
            <h3 className="text-2xl font-black text-secondary mb-6 tracking-tight">Nuevo Insumo</h3>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest px-1">Nombre</label>
                <input
                  className="w-full px-5 py-3.5 bg-gray-50 border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all text-sm font-bold"
                  placeholder="Nombre del insumo"
                  value={ingredientForm.name}
                  onChange={(e) => setIngredientForm({ ...ingredientForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest px-1">Unidad</label>
                <select
                  className="w-full px-5 py-3.5 bg-gray-50 border-transparent rounded-2xl focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all text-sm font-bold"
                  value={ingredientForm.unit}
                  onChange={(e) => setIngredientForm({ ...ingredientForm, unit: e.target.value })}
                >
                  <option value="kg">Kilogramos</option>
                  <option value="lt">Litros</option>
                  <option value="unit">Unidades</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest px-1">Stock Mínimo</label>
                <input
                  className="w-full px-5 py-3.5 bg-gray-50 border-transparent rounded-2xl focus:bg-white transition-all text-sm font-bold"
                  type="number"
                  value={ingredientForm.minStock}
                  onChange={(e) => setIngredientForm({ ...ingredientForm, minStock: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button className="flex-1 py-3 text-sm font-black text-text-secondary uppercase tracking-widest hover:bg-gray-50 rounded-2xl transition-all" onClick={() => setShowAddForm(false)}>Cancelar</button>
              <button
                className="flex-[2] py-3.5 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 disabled:opacity-50 transition-all"
                onClick={() => createIngredient.mutate({ ...ingredientForm, minStock: parseFloat(ingredientForm.minStock) })}
                disabled={!ingredientForm.name}
              >
                Guardar Insumo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
