import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../stores/auth.store';
import api from '../../../api/client';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, GripVertical } from 'lucide-react';

export function MenuManagementPage() {
  const branchId = useAuthStore((s) => s.user?.branchId);
  const queryClient = useQueryClient();
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [productForm, setProductForm] = useState({
    name: '', description: '', categoryId: '', variants: [{ name: 'Estándar', price: '' }],
  });

  const { data: categories } = useQuery({
    queryKey: ['categories', branchId],
    queryFn: () => api.get(`/menu/categories?branchId=${branchId}`).then((r) => r.data),
    enabled: !!branchId,
  });

  const { data: products } = useQuery({
    queryKey: ['products', branchId],
    queryFn: () => api.get(`/menu/products?branchId=${branchId}`).then((r) => r.data),
    enabled: !!branchId,
  });

  const createCategory = useMutation({
    mutationFn: (data: any) => api.post('/menu/categories', { ...data, branchId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setShowCategoryForm(false);
      setCategoryForm({ name: '', description: '' });
      toast.success('Categoría creada');
    },
  });

  const deleteCategory = useMutation({
    mutationFn: (id: string) => api.delete(`/menu/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Categoría eliminada');
    },
  });

  const createProduct = useMutation({
    mutationFn: (data: any) => api.post('/menu/products', { ...data, branchId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setShowProductForm(false);
      setProductForm({ name: '', description: '', categoryId: '', variants: [{ name: 'Estándar', price: '' }] });
      toast.success('Producto creado');
    },
  });

  const deleteProduct = useMutation({
    mutationFn: (id: string) => api.delete(`/menu/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Producto eliminado');
    },
  });

  const toggleAvailability = useMutation({
    mutationFn: ({ id, available }: { id: string; available: boolean }) =>
      api.patch(`/menu/products/${id}`, { available }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const getProductsByCategory = (categoryId: string) =>
    products?.filter((p: any) => p.categoryId === categoryId) || [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Gestión de Menú</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCategoryForm(true)}
            className="btn-secondary flex items-center gap-2"
          >
            <Plus size={16} /> Categoría
          </button>
          <button
            onClick={() => setShowProductForm(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={16} /> Producto
          </button>
        </div>
      </div>

      {/* Category form modal */}
      {showCategoryForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Nueva Categoría</h3>
            <div className="space-y-3">
              <input
                className="input w-full"
                placeholder="Nombre"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              />
              <input
                className="input w-full"
                placeholder="Descripción (opcional)"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
              />
            </div>
            <div className="flex gap-2 mt-4 justify-end">
              <button className="btn-ghost" onClick={() => setShowCategoryForm(false)}>Cancelar</button>
              <button
                className="btn-primary"
                onClick={() => createCategory.mutate(categoryForm)}
                disabled={!categoryForm.name}
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product form modal */}
      {showProductForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-bold mb-4">Nuevo Producto</h3>
            <div className="space-y-3">
              <input
                className="input w-full"
                placeholder="Nombre"
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              />
              <input
                className="input w-full"
                placeholder="Descripción (opcional)"
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
              />
              <select
                className="input w-full"
                value={productForm.categoryId}
                onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
              >
                <option value="">Seleccionar categoría</option>
                {categories?.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <div>
                <label className="text-sm font-medium text-gray-700">Variantes</label>
                {productForm.variants.map((v, i) => (
                  <div key={i} className="flex gap-2 mt-1">
                    <input
                      className="input flex-1"
                      placeholder="Nombre variante"
                      value={v.name}
                      onChange={(e) => {
                        const variants = [...productForm.variants];
                        variants[i] = { ...v, name: e.target.value };
                        setProductForm({ ...productForm, variants });
                      }}
                    />
                    <input
                      className="input w-28"
                      placeholder="Precio"
                      type="number"
                      value={v.price}
                      onChange={(e) => {
                        const variants = [...productForm.variants];
                        variants[i] = { ...v, price: e.target.value };
                        setProductForm({ ...productForm, variants });
                      }}
                    />
                  </div>
                ))}
                <button
                  className="text-sm text-blue-600 mt-1"
                  onClick={() =>
                    setProductForm({
                      ...productForm,
                      variants: [...productForm.variants, { name: '', price: '' }],
                    })
                  }
                >
                  + Agregar variante
                </button>
              </div>
            </div>
            <div className="flex gap-2 mt-4 justify-end">
              <button className="btn-ghost" onClick={() => setShowProductForm(false)}>Cancelar</button>
              <button
                className="btn-primary"
                onClick={() =>
                  createProduct.mutate({
                    ...productForm,
                    variants: productForm.variants.filter((v) => v.name && v.price).map((v) => ({
                      name: v.name,
                      price: parseFloat(v.price),
                    })),
                  })
                }
                disabled={!productForm.name || !productForm.categoryId}
              >
                Crear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Categories & Products list */}
      <div className="space-y-2">
        {categories?.map((category: any) => {
          const catProducts = getProductsByCategory(category.id);
          const isExpanded = expandedCategory === category.id;
          return (
            <div key={category.id} className="bg-white rounded-xl border shadow-sm">
              <div
                className="flex items-center justify-between p-4 cursor-pointer"
                onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  <span className="font-semibold">{category.name}</span>
                  <span className="text-sm text-gray-400">({catProducts.length} productos)</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('¿Eliminar categoría?')) deleteCategory.mutate(category.id);
                  }}
                  className="text-gray-400 hover:text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              {isExpanded && (
                <div className="border-t divide-y">
                  {catProducts.map((product: any) => (
                    <div key={product.id} className="px-4 py-3 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{product.name}</span>
                          {!product.available && (
                            <span className="badge bg-red-100 text-red-700 text-xs">No disponible</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {product.variants?.map((v: any) => `${v.name}: $${v.price}`).join(' | ')}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            toggleAvailability.mutate({
                              id: product.id,
                              available: !product.available,
                            })
                          }
                          className={`text-xs px-2 py-1 rounded ${
                            product.available
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {product.available ? 'Disponible' : 'No disp.'}
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('¿Eliminar producto?')) deleteProduct.mutate(product.id);
                          }}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {catProducts.length === 0 && (
                    <div className="px-4 py-6 text-center text-gray-400 text-sm">
                      Sin productos en esta categoría
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
