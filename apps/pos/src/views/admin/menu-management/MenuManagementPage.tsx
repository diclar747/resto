import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../../stores/auth.store';
import api from '../../../api/client';
import toast from 'react-hot-toast';
import { useState } from 'react';
import {
  Plus, Pencil, Trash2, ChevronDown, ChevronRight, GripVertical,
  Settings, Image as ImageIcon, Layout, Layers, DollarSign, Tag,
  MoreVertical, Search, Check, X, AlertCircle
} from 'lucide-react';

export function MenuManagementPage() {
  const branchId = useAuthStore((s) => s.user?.branchId);
  const queryClient = useQueryClient();
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [productForm, setProductForm] = useState({
    name: '', description: '', categoryId: '',
    variants: [{ name: 'Base', price: '', cost: '', sku: '' }],
  });

  const { data: categories, isLoading: catsLoading } = useQuery({
    queryKey: ['categories', branchId],
    queryFn: () => api.get(`/menu/categories?branchId=${branchId}`).then((r) => r.data),
    enabled: !!branchId,
  });

  const { data: products, isLoading: prodsLoading } = useQuery({
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
      toast.success('Categoría estratégica añadida');
    },
  });

  const createProduct = useMutation({
    mutationFn: (data: any) => api.post('/menu/products', { ...data, branchId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setShowProductForm(false);
      setProductForm({ name: '', description: '', categoryId: '', variants: [{ name: 'Base', price: '', cost: '', sku: '' }] });
      toast.success('Producto premium registrado');
    },
  });

  const deleteProduct = useMutation({
    mutationFn: (id: string) => api.delete(`/menu/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Producto retirado del catálogo');
    },
  });

  const toggleAvailability = useMutation({
    mutationFn: ({ id, available }: { id: string; available: boolean }) =>
      api.patch(`/menu/products/${id}`, { available }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const filteredCategories = categories?.filter((c: any) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getProductsByCategory = (categoryId: string) =>
    products?.filter((p: any) => p.categoryId === categoryId) || [];

  return (
    <div className="p-8 space-y-8 bg-background min-h-screen">
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/50 dark:bg-white/5 backdrop-blur-md p-6 rounded-[32px] border border-white dark:border-white/10 shadow-xl">
        <div>
          <h2 className="text-3xl font-black text-secondary tracking-tight">Menú <span className="text-primary italic">Engineering</span></h2>
          <p className="text-sm font-medium text-text-secondary mt-1">Configura tus platos, variantes y precios dinámicos</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40 group-focus-within:text-primary transition-colors" size={18} />
            <input
              type="text"
              placeholder="Buscar categoría o producto..."
              className="pl-12 pr-6 py-3 bg-white dark:bg-surface border border-gray-100 dark:border-white/10 rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all w-64 shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => setShowCategoryForm(true)}
            className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-surface text-secondary border border-gray-200 dark:border-white/15 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-white/5 transition-all shadow-sm"
          >
            <Layers size={14} /> + Categoría
          </button>
          <button
            onClick={() => setShowProductForm(true)}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-primary/20 active:scale-95"
          >
            <Plus size={16} /> + Producto
          </button>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 gap-6">
        {filteredCategories?.map((category: any) => {
          const catProducts = getProductsByCategory(category.id);
          const isExpanded = expandedCategory === category.id;

          return (
            <div key={category.id} className={`bg-white dark:bg-surface rounded-[40px] border border-white dark:border-white/10 shadow-xl transition-all duration-500 overflow-hidden ${isExpanded ? 'ring-2 ring-primary/20' : ''}`}>
              {/* Category Header */}
              <div
                className={`p-6 flex items-center justify-between cursor-pointer transition-colors ${isExpanded ? 'bg-primary/5' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}
                onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
              >
                <div className="flex items-center gap-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg shadow-inner ${isExpanded ? 'bg-primary text-white' : 'bg-background text-secondary border border-white dark:border-white/10'}`}>
                    {category.name[0]}
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-secondary tracking-tight uppercase tracking-widest">{category.name}</h3>
                    <p className="text-xs font-bold text-text-secondary uppercase">{catProducts.length} Ítems registrados</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="hidden md:flex -space-x-3">
                    {catProducts.slice(0, 4).map((p: any) => (
                      <div key={p.id} className="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/15 border-2 border-white dark:border-white/10 flex items-center justify-center overflow-hidden">
                        {p.imageUrl ? <img src={p.imageUrl} alt="" className="w-full h-full object-cover" /> : <Layers size={12} className="text-gray-400 dark:text-white/40" />}
                      </div>
                    ))}
                    {catProducts.length > 4 && (
                      <div className="w-8 h-8 rounded-full bg-primary text-white border-2 border-white dark:border-white/10 flex items-center justify-center text-[10px] font-black">
                        +{catProducts.length - 4}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button className="p-2 hover:bg-white dark:hover:bg-white/10 rounded-xl transition-colors">
                      <Settings size={18} className="text-gray-400 dark:text-white/40" />
                    </button>
                    {isExpanded ? <ChevronDown size={24} className="text-primary" /> : <ChevronRight size={24} className="text-gray-300" />}
                  </div>
                </div>
              </div>

              {/* Products List (Expanded) */}
              {isExpanded && (
                <div className="p-8 border-t border-gray-100 dark:border-white/10 bg-gray-50/30 dark:bg-white/[0.02]">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {catProducts.map((product: any) => (
                      <div key={product.id} className="bg-white dark:bg-surface rounded-[32px] p-6 shadow-md border border-white dark:border-white/10 group relative">
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-16 h-16 rounded-2xl bg-background border-2 border-white dark:border-white/10 shadow-inner flex items-center justify-center overflow-hidden">
                            {product.imageUrl ? <img src={product.imageUrl} alt="" className="w-full h-full object-cover" /> : <ImageIcon size={24} className="text-gray-300" />}
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); if (confirm('¿Eliminar?')) deleteProduct.mutate(product.id); }}
                            className="p-2 opacity-0 group-hover:opacity-100 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>

                        <div className="mb-4">
                          <h4 className="text-lg font-black text-secondary tracking-tight truncate">{product.name}</h4>
                          <p className="text-[10px] font-bold text-text-secondary uppercase line-clamp-2 mt-1 min-h-[30px]">{product.description || 'Sin descripción corporativa'}</p>
                        </div>

                        {/* Variants Preview */}
                        <div className="space-y-2 mb-6">
                          {product.variants?.map((v: any) => (
                            <div key={v.id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-white/5 last:border-0 text-[11px] font-black uppercase tracking-wider">
                              <span className="text-text-secondary">{v.name}</span>
                              <span className="text-primary">${v.price}</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <button
                            onClick={() => toggleAvailability.mutate({ id: product.id, available: !product.available })}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${product.available ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                              }`}
                          >
                            {product.available ? 'En Stock' : 'Agotado'}
                          </button>

                          <button className="flex items-center gap-1.5 text-[10px] font-black uppercase text-secondary group-hover:text-primary transition-colors">
                            <Pencil size={12} /> Editar
                          </button>
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={() => { setProductForm({ ...productForm, categoryId: category.id }); setShowProductForm(true); }}
                      className="border-4 border-dashed border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] rounded-[32px] p-8 flex flex-col items-center justify-center text-gray-400 dark:text-white/40 hover:border-primary/20 hover:bg-primary/5 hover:text-primary transition-all group"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-white dark:bg-surface flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
                        <Plus size={24} />
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest">Nuevo Producto</span>
                      <span className="text-[10px] font-bold mt-1 text-gray-300">Añadir a {category.name}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Sophisticated Product Form Modal */}
      {showProductForm && (
        <div className="fixed inset-0 bg-secondary/80 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white dark:bg-surface rounded-[40px] p-10 w-full max-w-2xl shadow-2xl border border-white dark:border-white/10 relative max-h-[90vh] overflow-y-auto no-scrollbar">
            <div className="mb-10 flex items-center justify-between">
              <div>
                <h3 className="text-3xl font-black text-secondary tracking-tighter">Product <span className="text-primary">Designer</span></h3>
                <p className="text-sm font-medium text-text-secondary">Crea una experiencia gastronómica única</p>
              </div>
              <button onClick={() => setShowProductForm(false)} className="p-3 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-2xl transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Basic Info */}
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase text-text-secondary ml-4 mb-2 block">Identificación del Producto</label>
                  <input
                    className="w-full px-6 py-4 bg-gray-50 dark:bg-white/5 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                    placeholder="Ej: Hamburguesa Gourmet Trufada"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-text-secondary ml-4 mb-2 block">Categoría de Destino</label>
                  <select
                    className="w-full px-6 py-4 bg-gray-50 dark:bg-white/5 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all appearance-none"
                    value={productForm.categoryId}
                    onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                  >
                    <option value="">Seleccionar Categoría...</option>
                    {categories?.map((c: any) => (
                      <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-text-secondary ml-4 mb-2 block">Narrativa del Plato</label>
                  <textarea
                    className="w-full px-6 py-4 bg-gray-50 dark:bg-white/5 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all min-h-[120px] resize-none"
                    placeholder="Describe los ingredientes, origen y alma de este plato..."
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  />
                </div>
              </div>

              {/* Right Column: Variants (Pricing) */}
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-2 px-4">
                    <label className="text-[10px] font-black uppercase text-text-secondary">Variantes y Precios</label>
                    <button
                      onClick={() => setProductForm({ ...productForm, variants: [...productForm.variants, { name: '', price: '', cost: '', sku: '' }] })}
                      className="text-[10px] font-black text-primary uppercase"
                    >
                      + Añadir
                    </button>
                  </div>

                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                    {productForm.variants.map((v, i) => (
                      <div key={i} className="bg-background p-4 rounded-3xl border border-white dark:border-white/10 space-y-3 relative group/var">
                        <button
                          onClick={() => setProductForm({ ...productForm, variants: productForm.variants.filter((_, idx) => idx !== i) })}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover/var:opacity-100 transition-opacity shadow-lg"
                        >
                          <X size={12} />
                        </button>

                        <input
                          className="w-full px-4 py-2 bg-white dark:bg-surface rounded-xl text-xs font-black uppercase tracking-tight outline-none border border-transparent focus:border-primary/20"
                          placeholder="Nombre (ej: Mediana, Doble, XL)"
                          value={v.name}
                          onChange={(e) => {
                            const vars = [...productForm.variants];
                            vars[i].name = e.target.value;
                            setProductForm({ ...productForm, variants: vars });
                          }}
                        />

                        <div className="grid grid-cols-2 gap-2">
                          <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-primary" size={12} />
                            <input
                              className="w-full pl-8 pr-4 py-2 bg-white dark:bg-surface rounded-xl text-xs font-black outline-none border border-transparent focus:border-primary/20"
                              placeholder="Precio Venta"
                              type="number"
                              value={v.price}
                              onChange={(e) => {
                                const vars = [...productForm.variants];
                                vars[i].price = e.target.value;
                                setProductForm({ ...productForm, variants: vars });
                              }}
                            />
                          </div>
                          <div className="relative">
                            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/40" size={12} />
                            <input
                              className="w-full pl-8 pr-4 py-2 bg-white/50 dark:bg-white/5 rounded-xl text-xs font-black outline-none border border-transparent focus:border-primary/20"
                              placeholder="Costo"
                              type="number"
                              value={v.cost}
                              onChange={(e) => {
                                const vars = [...productForm.variants];
                                vars[i].cost = e.target.value;
                                setProductForm({ ...productForm, variants: vars });
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 flex gap-6">
              <button
                onClick={() => setShowProductForm(false)}
                className="flex-1 py-4 bg-gray-100 dark:bg-white/10 text-secondary rounded-2xl text-xs font-black uppercase tracking-widest transition-all hover:bg-gray-200 dark:hover:bg-white/15"
              >
                Descartar Cambios
              </button>
              <button
                onClick={() => createProduct.mutate({
                  ...productForm,
                  variants: productForm.variants.filter(v => v.name && v.price).map(v => ({
                    name: v.name,
                    price: parseFloat(v.price),
                    cost: v.cost ? parseFloat(v.cost) : undefined
                  }))
                })}
                disabled={!productForm.name || !productForm.categoryId || createProduct.isPending}
                className="flex-[2] py-4 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50"
              >
                {createProduct.isPending ? 'Sincronizando...' : 'Publicar Producto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryForm && (
        <div className="fixed inset-0 bg-secondary/80 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
          <div className="bg-white dark:bg-surface rounded-[40px] p-10 w-full max-w-md shadow-2xl border border-white dark:border-white/10">
            <h3 className="text-2xl font-black text-secondary tracking-tighter mb-8 italic">New <span className="text-primary underline">Collection</span></h3>
            <div className="space-y-4">
              <input
                className="w-full px-6 py-4 bg-gray-50 dark:bg-white/5 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                placeholder="Nombre de la categoría"
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              />
              <input
                className="w-full px-6 py-4 bg-gray-50 dark:bg-white/5 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                placeholder="Slogan / Descripción corta"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
              />
            </div>
            <div className="flex gap-4 mt-10">
              <button onClick={() => setShowCategoryForm(false)} className="flex-1 py-4 bg-gray-100 dark:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest">Cerrar</button>
              <button
                onClick={() => createCategory.mutate(categoryForm)}
                disabled={!categoryForm.name}
                className="flex-1 py-4 bg-secondary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-secondary/20"
              >
                Crear Colección
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
