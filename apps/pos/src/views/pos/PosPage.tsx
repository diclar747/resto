import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import { useAuthStore } from '../../stores/auth.store';
import { useCartStore } from '../../stores/cart.store';
import { ProductGrid } from './components/ProductGrid';
import { Cart } from './components/Cart';
import { ShoppingBag, Utensils, Truck } from 'lucide-react';

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
    <div className="h-full flex">
      {/* Left: Products */}
      <div className="flex-1 flex flex-col">
        {/* Order type selector */}
        <div className="p-3 bg-white border-b flex gap-2">
          {[
            { type: 'dine_in' as const, icon: Utensils, label: 'Mesa' },
            { type: 'takeaway' as const, icon: ShoppingBag, label: 'Llevar' },
            { type: 'delivery' as const, icon: Truck, label: 'Delivery' },
          ].map(({ type, icon: Icon, label }) => (
            <button
              key={type}
              onClick={() => setOrderType(type)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                orderType === type
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Icon size={16} /> {label}
            </button>
          ))}
        </div>

        {/* Categories */}
        <div className="p-3 bg-white border-b flex gap-2 overflow-x-auto">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              !selectedCategory
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Todos
          </button>
          {categories?.map((cat: any) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Products grid */}
        <div className="flex-1 overflow-auto p-3">
          <ProductGrid products={products || []} />
        </div>
      </div>

      {/* Right: Cart */}
      <div className="w-96 border-l bg-white flex flex-col">
        <Cart />
      </div>
    </div>
  );
}
