import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../stores/auth.store';
import api from '../../../api/client';
import toast from 'react-hot-toast';
import { useState } from 'react';
import {
  Plus, AlertTriangle, Package, Search, History, Layers, Boxes, Edit3, Trash2,
  Users, ShoppingCart, BarChart2
} from 'lucide-react';
import { SuppliersTab } from './SuppliersTab';
import { OrdersTab } from './OrdersTab';
import { WasteTab } from './WasteTab';

export function InventoryPage() {
  const branchId = useAuthStore((s) => s.user?.branchId);
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'stock' | 'suppliers' | 'orders' | 'waste'>('stock');
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

  const filteredItems = ingredients?.filter((item: any) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-8 bg-[#F4F7FE] min-h-screen">
      {/* Dynamic Header based on Tab */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/50 backdrop-blur-md p-6 rounded-[32px] border border-white shadow-xl">
        <div>
          <h2 className="text-3xl font-black text-secondary tracking-tight">Supply <span className="text-primary italic">Chain</span></h2>
          <p className="text-sm font-medium text-text-secondary mt-1 uppercase tracking-widest">
            {tab === 'stock' && 'Control de Existencias'}
            {tab === 'suppliers' && 'Gestión de Aliados Comerciales'}
            {tab === 'orders' && 'Central de Adquisiciones'}
            {tab === 'waste' && 'Análisis de Eficiencia Operativa'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex p-1.5 bg-[#F4F7FE] rounded-2xl shadow-inner">
            {[
              { id: 'stock', icon: Boxes, label: 'Stock' },
              { id: 'suppliers', icon: Users, label: 'Prov' },
              { id: 'orders', icon: ShoppingCart, label: 'Buy' },
              { id: 'waste', icon: Trash2, label: 'Loss' }
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id as any)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === t.id ? 'bg-white text-primary shadow-sm scale-110' : 'text-gray-400 hover:text-secondary'
                  }`}
              >
                <t.icon size={14} /> {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Conditional Rendering of Tabs */}
      {tab === 'stock' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-[32px] p-8 shadow-card border-none flex items-center gap-6">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner">
                <Package size={32} />
              </div>
              <div>
                <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">Items en Inventario</p>
                <p className="text-3xl font-black text-secondary tracking-tight">{stockItems?.length || 0}</p>
              </div>
            </div>
            <div className="bg-white rounded-[32px] p-8 shadow-xl border-none flex items-center gap-6 relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full blur-3xl opacity-20 ${lowStockItems.length > 0 ? 'bg-rose-500' : 'bg-emerald-500'}`} />
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner transition-colors ${lowStockItems.length > 0 ? 'bg-rose-50 text-rose-500 animate-pulse' : 'bg-emerald-50 text-emerald-500'}`}>
                <AlertTriangle size={32} />
              </div>
              <div>
                <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">Reponer Inmediatamente</p>
                <p className={`text-3xl font-black tracking-tight ${lowStockItems.length > 0 ? 'text-rose-500' : 'text-secondary'}`}>{lowStockItems.length}</p>
              </div>
            </div>
            <div className="bg-white rounded-[32px] p-8 shadow-card border-none flex items-center gap-6">
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner">
                <BarChart2 size={32} />
              </div>
              <div>
                <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-1">Rotación Mensual</p>
                <p className="text-3xl font-black text-secondary tracking-tight">84%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[40px] p-10 shadow-card border-none">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-10 pb-8 border-b border-gray-50">
              <h3 className="text-2xl font-black text-secondary tracking-tight italic">Live <span className="text-primary underline">Stock</span></h3>
              <div className="flex items-center gap-4 flex-1 max-w-xl">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Buscar por nombre o referencia..."
                    className="w-full pl-12 pr-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <button onClick={() => setShowAddForm(true)} className="p-4 bg-primary text-white rounded-2xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all">
                  <Plus size={20} />
                </button>
              </div>
            </div>

            <div className="overflow-hidden rounded-[32px] border border-gray-50">
              <table className="w-full border-collapse">
                <thead className="bg-[#F4F7FE]">
                  <tr>
                    <th className="text-left px-8 py-6 text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Referencia / Insumo</th>
                    <th className="text-left px-8 py-6 text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Métrica</th>
                    <th className="text-center px-8 py-6 text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Balance Actual</th>
                    <th className="text-center px-8 py-6 text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Umbral Crítico</th>
                    <th className="text-right px-8 py-6 text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Ajustes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredItems?.map((ing: any) => {
                    const stock = stockItems?.find((s: any) => s.ingredientId === ing.id);
                    const currentStock = stock?.currentStock || 0;
                    const isLow = currentStock <= ing.minStock;
                    return (
                      <tr key={ing.id} className="group hover:bg-gray-50/50 transition-colors">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${isLow ? 'bg-rose-50 text-rose-500 shadow-sm animate-pulse' : 'bg-primary/5 text-primary shadow-inner'}`}>
                              {ing.name[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-black text-secondary tracking-tight">{ing.name}</p>
                              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">ID: {ing.id.slice(-6).toUpperCase()}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="px-3 py-1 bg-gray-100 text-[10px] font-black text-gray-500 rounded-full uppercase tracking-tighter">{ing.unit}</span>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <p className={`text-xl font-black tracking-tight ${isLow ? 'text-rose-500' : 'text-secondary'}`}>
                            {Number(currentStock).toLocaleString()}
                          </p>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <span className="text-xs font-black text-gray-300 italic">{ing.minStock}</span>
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                            <button className="p-3 bg-white shadow-sm border border-gray-100 text-gray-400 hover:text-primary rounded-xl transition-all"><Edit3 size={16} /></button>
                            <button className="p-3 bg-white shadow-sm border border-gray-100 text-gray-400 hover:text-rose-500 rounded-xl transition-all"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'suppliers' && branchId && <SuppliersTab branchId={branchId} />}
      {tab === 'orders' && branchId && <OrdersTab branchId={branchId} />}
      {tab === 'waste' && branchId && <WasteTab branchId={branchId} />}

      {/* Modern Insumo Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-secondary/80 backdrop-blur-sm flex items-center justify-center z-[150] p-4">
          <div className="bg-white rounded-[40px] p-10 w-full max-w-md shadow-2xl border border-white relative overflow-hidden">
            <h3 className="text-3xl font-black text-secondary tracking-tighter mb-8 italic">New <span className="text-primary underline">Ingredient</span></h3>
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-2 block px-2">Nombre del Insumo</label>
                <input
                  className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                  placeholder="Ej: Harina 000, Tomate Cherry..."
                  value={ingredientForm.name}
                  onChange={(e) => setIngredientForm({ ...ingredientForm, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-2 block px-2">Unidad</label>
                  <select
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                    value={ingredientForm.unit}
                    onChange={(e) => setIngredientForm({ ...ingredientForm, unit: e.target.value })}
                  >
                    <option value="kg">KILOGRAMOS</option>
                    <option value="lt">LITROS</option>
                    <option value="unit">UNIDADES</option>
                    <option value="gr">GRAMOS</option>
                    <option value="ml">MILILITROS</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-2 block px-2">Umbral Mínimo</label>
                  <input
                    className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl text-sm font-bold outline-none"
                    type="number"
                    value={ingredientForm.minStock}
                    onChange={(e) => setIngredientForm({ ...ingredientForm, minStock: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-12">
              <button onClick={() => setShowAddForm(false)} className="flex-1 py-4 bg-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-gray-200">Cancelar</button>
              <button
                onClick={() => createIngredient.mutate({ ...ingredientForm, minStock: parseFloat(ingredientForm.minStock) })}
                disabled={!ingredientForm.name || createIngredient.isPending}
                className="flex-[2] py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all font-outfit"
              >
                {createIngredient.isPending ? 'Sincronizando...' : 'Alta de Insumo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
