import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../stores/auth.store';
import api from '../../../api/client';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { Plus, AlertTriangle, Package } from 'lucide-react';

export function InventoryPage() {
  const branchId = useAuthStore((s) => s.user?.branchId);
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'stock' | 'ingredients' | 'waste'>('stock');
  const [showAddForm, setShowAddForm] = useState(false);
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
      toast.success('Ingrediente creado');
    },
  });

  const adjustStock = useMutation({
    mutationFn: ({ id, quantity, reason }: { id: string; quantity: number; reason: string }) =>
      api.post(`/inventory/stock/${id}/adjust`, { quantity, reason, branchId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock'] });
      toast.success('Stock ajustado');
    },
  });

  const lowStockItems = stockItems?.filter((s: any) => {
    const ingredient = ingredients?.find((i: any) => i.id === s.ingredientId);
    return ingredient && s.currentStock <= ingredient.minStock;
  }) || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Inventario</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} /> Ingrediente
        </button>
      </div>

      {/* Low stock alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="text-yellow-600 shrink-0 mt-0.5" size={20} />
          <div>
            <p className="font-medium text-yellow-800">Stock bajo</p>
            <p className="text-sm text-yellow-700">
              {lowStockItems.map((s: any) => {
                const ing = ingredients?.find((i: any) => i.id === s.ingredientId);
                return ing?.name;
              }).filter(Boolean).join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {(['stock', 'ingredients', 'waste'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              tab === t ? 'bg-white shadow-sm' : 'text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t === 'stock' ? 'Stock' : t === 'ingredients' ? 'Ingredientes' : 'Desperdicios'}
          </button>
        ))}
      </div>

      {/* Add ingredient modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Nuevo Ingrediente</h3>
            <div className="space-y-3">
              <input
                className="input w-full"
                placeholder="Nombre"
                value={ingredientForm.name}
                onChange={(e) => setIngredientForm({ ...ingredientForm, name: e.target.value })}
              />
              <select
                className="input w-full"
                value={ingredientForm.unit}
                onChange={(e) => setIngredientForm({ ...ingredientForm, unit: e.target.value })}
              >
                <option value="kg">Kilogramos</option>
                <option value="lt">Litros</option>
                <option value="unit">Unidades</option>
                <option value="g">Gramos</option>
                <option value="ml">Mililitros</option>
              </select>
              <input
                className="input w-full"
                placeholder="Stock mínimo"
                type="number"
                value={ingredientForm.minStock}
                onChange={(e) => setIngredientForm({ ...ingredientForm, minStock: e.target.value })}
              />
            </div>
            <div className="flex gap-2 mt-4 justify-end">
              <button className="btn-ghost" onClick={() => setShowAddForm(false)}>Cancelar</button>
              <button
                className="btn-primary"
                onClick={() =>
                  createIngredient.mutate({
                    ...ingredientForm,
                    minStock: parseFloat(ingredientForm.minStock),
                  })
                }
                disabled={!ingredientForm.name}
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock table */}
      {tab === 'stock' && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Ingrediente</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Stock actual</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Mínimo</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Estado</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Costo unit.</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {stockItems?.map((stock: any) => {
                const ingredient = ingredients?.find((i: any) => i.id === stock.ingredientId);
                const isLow = ingredient && stock.currentStock <= ingredient.minStock;
                return (
                  <tr key={stock.id} className={isLow ? 'bg-red-50' : ''}>
                    <td className="px-4 py-3 font-medium">{ingredient?.name || 'N/A'}</td>
                    <td className="px-4 py-3">
                      {stock.currentStock} {ingredient?.unit}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{ingredient?.minStock}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${isLow ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {isLow ? 'Bajo' : 'OK'}
                      </span>
                    </td>
                    <td className="px-4 py-3">${stock.costPerUnit || '0'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {(!stockItems || stockItems.length === 0) && (
            <div className="text-center py-8 text-gray-400">
              <Package size={32} className="mx-auto mb-2 opacity-50" />
              Sin items de stock registrados
            </div>
          )}
        </div>
      )}

      {/* Ingredients list */}
      {tab === 'ingredients' && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Nombre</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Unidad</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Stock mínimo</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {ingredients?.map((ing: any) => (
                <tr key={ing.id}>
                  <td className="px-4 py-3 font-medium">{ing.name}</td>
                  <td className="px-4 py-3">{ing.unit}</td>
                  <td className="px-4 py-3">{ing.minStock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Waste records */}
      {tab === 'waste' && (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Fecha</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Ingrediente</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Cantidad</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">Razón</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {wasteRecords?.map((w: any) => (
                <tr key={w.id}>
                  <td className="px-4 py-3 text-sm">
                    {new Date(w.createdAt).toLocaleDateString('es-AR')}
                  </td>
                  <td className="px-4 py-3 font-medium">{w.ingredient?.name}</td>
                  <td className="px-4 py-3">{w.quantity} {w.ingredient?.unit}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{w.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
