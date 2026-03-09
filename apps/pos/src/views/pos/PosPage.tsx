import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import { useAuthStore } from '../../stores/auth.store';
import { useCartStore } from '../../stores/cart.store';
import { ProductGrid } from './components/ProductGrid';
import { Cart } from './components/Cart';
import { ShoppingBag, Utensils, Truck, Search, X } from 'lucide-react';

export function PosPage() {
  const branchId = useAuthStore((s) => s.user?.branchId);
  const { orderType, setOrderType, getItemCount } = useCartStore();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

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

  const itemCount = getItemCount();

  return (
    <>
      <div className="h-full flex gap-4 xl:gap-6">
        {/* Left: Products */}
        <div className="flex-1 flex flex-col min-w-0 space-y-3 md:space-y-6">
          {/* Top Actions & Filters */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4">
            {/* Order type selector */}
            <div className="flex p-1 md:p-1.5 bg-white/50 dark:bg-white/5 backdrop-blur-sm rounded-xl md:rounded-2xl border border-white dark:border-white/10">
              {[
                { type: 'dine_in' as const, icon: Utensils, label: 'Mesa' },
                { type: 'takeaway' as const, icon: ShoppingBag, label: 'Llevar' },
                { type: 'delivery' as const, icon: Truck, label: 'Delivery' },
              ].map(({ type, icon: Icon, label }) => (
                <button
                  key={type}
                  onClick={() => setOrderType(type)}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-6 py-2 md:py-2.5 rounded-lg md:rounded-xl text-[10px] md:text-xs font-black uppercase tracking-wider transition-all duration-300 ${orderType === type
                      ? 'bg-secondary text-white shadow-lg scale-[1.05]'
                      : 'text-text-secondary hover:bg-white dark:hover:bg-white/5 hover:text-primary'
                    }`}
                >
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>

            <div className="flex-1 w-full relative group">
              <Search className="absolute left-4 md:left-5 top-1/2 -translate-y-1/2 text-text-secondary transition-colors group-focus-within:text-primary" size={16} />
              <input
                type="text"
                placeholder="¿Qué estás buscando?"
                className="w-full pl-11 md:pl-14 pr-4 md:pr-6 py-3 md:py-4 bg-white/50 dark:bg-white/5 border border-white dark:border-white/10 rounded-xl md:rounded-[24px] focus:bg-white dark:focus:bg-white/10 focus:outline-none focus:ring-4 focus:ring-primary/5 transition-all font-medium text-sm"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="flex gap-1.5 md:gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 md:px-8 py-2.5 md:py-3 rounded-2xl md:rounded-[20px] text-[10px] md:text-xs font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${!selectedCategory
                  ? 'bg-primary text-white shadow-[0px_8px_16px_rgba(0,74,173,0.2)]'
                  : 'bg-white dark:bg-surface text-text-secondary hover:text-primary border border-transparent hover:border-primary/20 shadow-sm'
                }`}
            >
              Todos
            </button>
            {categories?.map((cat: any) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 md:px-8 py-2.5 md:py-3 rounded-2xl md:rounded-[20px] text-[10px] md:text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300 ${selectedCategory === cat.id
                    ? 'bg-primary text-white shadow-[0px_8px_16px_rgba(0,74,173,0.2)]'
                    : 'bg-white dark:bg-surface text-text-secondary hover:text-primary border border-transparent hover:border-primary/20 shadow-sm'
                  }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Products grid */}
          <div className="flex-1 overflow-auto pr-0 md:pr-2">
            <ProductGrid products={products || []} />
          </div>
        </div>

        {/* Right: Cart — desktop only */}
        <div className="w-[380px] xl:w-[420px] hidden xl:flex">
          <div className="cart-wrapper w-full bg-white/70 backdrop-blur-xl rounded-[30px] shadow-card border border-white/20 !p-0 overflow-hidden flex flex-col">
            <Cart />
          </div>
        </div>
      </div>

      {/* Mobile cart FAB */}
      {itemCount > 0 && (
        <button
          onClick={() => setCartOpen(true)}
          className="xl:hidden fixed bottom-20 right-4 z-40 w-14 h-14 bg-primary text-white rounded-2xl shadow-xl shadow-primary/30 flex items-center justify-center active:scale-95 transition-transform"
        >
          <ShoppingBag size={22} />
          <span className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-error text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-md">
            {itemCount}
          </span>
        </button>
      )}

      {/* Mobile cart drawer */}
      {cartOpen && (
        <div className="xl:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setCartOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-surface rounded-t-[32px] max-h-[85vh] flex flex-col animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h2 className="text-lg font-black text-secondary">Tu Pedido</h2>
              <button onClick={() => setCartOpen(false)} className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-400 dark:text-white/40">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden flex flex-col">
              <Cart onOrderSent={() => setCartOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
