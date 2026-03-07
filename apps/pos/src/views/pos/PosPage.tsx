import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import { useAuthStore } from '../../stores/auth.store';
import { useCartStore } from '../../stores/cart.store';
import { ProductGrid } from './components/ProductGrid';
import { Cart } from './components/Cart';
import { ShoppingBag, Utensils, Truck, Search } from 'lucide-react';

export function PosPage() {
  const branchId = useAuthStore((s) => s.user?.branchId);
  const { orderType, setOrderType } = useCartStore();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: categories } = useQuery({
    queryKey: ['categories', branchId],
    queryFn: () => api.get(`/menu/categories?branchId=${branchId}`).then((r) => r.data),
    enabled: !!branchId,
  });

  const { data: products } = useQuery({
    queryKey: ['products', branchId, selectedCategory],
    queryFn: () => {
      const params = new URLSearchParams({ branchId: branchId! });
      if (selectedCategory) params.set('categoryId', selectedCategory);
      return api.get(`/menu/products?${params}`).then((r) => r.data);
    },
    enabled: !!branchId,
  });

  return (
    <div className="h-full flex gap-6">
      {/* Left: Products */}
      <div className="flex-1 flex flex-col min-w-0 space-y-6">
        {/* Top Actions & Filters */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Order type selector */}
          <div className="flex p-1.5 bg-white/50 backdrop-blur-sm rounded-2xl border border-white max-w-fit">
            {[
              { type: 'dine_in' as const, icon: Utensils, label: 'Mesa' },
              { type: 'takeaway' as const, icon: ShoppingBag, label: 'Llevar' },
              { type: 'delivery' as const, icon: Truck, label: 'Delivery' },
            ].map(({ type, icon: Icon, label }) => (
              <button
                key={type}
                onClick={() => setOrderType(type)}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 ${orderType === type
                    ? 'bg-[var(--secondary)] text-white shadow-lg scale-[1.05]'
                    : 'text-[var(--text-secondary)] hover:bg-white hover:text-[var(--primary)]'
                  }`}
              >
                <Icon size={14} /> {label}
              </button>
            ))}
          </div>

          <div className="flex-1 w-full sm:w-auto relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] transition-colors group-focus-within:text-[var(--primary)]" size={18} />
            <input
              type="text"
              placeholder="¿Qué estás buscando?"
              className="w-full pl-14 pr-6 py-4 bg-white/50 border border-white rounded-[24px] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[var(--primary)]/5 transition-all font-medium text-sm"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-8 py-3 rounded-[20px] text-xs font-black uppercase tracking-widest transition-all duration-300 ${!selectedCategory
                ? 'bg-[var(--primary)] text-white shadow-[0px_8px_16px_rgba(0,74,173,0.2)]'
                : 'bg-white text-[var(--text-secondary)] hover:text-[var(--primary)] border border-transparent hover:border-[var(--primary)]/20 shadow-sm'
              }`}
          >
            Todos
          </button>
          {categories?.map((cat: any) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-8 py-3 rounded-[20px] text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${selectedCategory === cat.id
                  ? 'bg-[var(--primary)] text-white shadow-[0px_8px_16px_rgba(0,74,173,0.2)]'
                  : 'bg-white text-[var(--text-secondary)] hover:text-[var(--primary)] border border-transparent hover:border-[var(--primary)]/20 shadow-sm'
                }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Products grid */}
        <div className="flex-1 overflow-auto pr-2">
          <ProductGrid products={products || []} />
        </div>
      </div>

      {/* Right: Cart */}
      <div className="w-[420px] hidden xl:flex">
        <div className="w-full card-glass !p-0 overflow-hidden flex flex-col">
          <Cart />
        </div>
      </div>
    </div>
  );
}
