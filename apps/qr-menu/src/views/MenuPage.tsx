import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { ShoppingCart, Plus, Minus, Send, Bell, Receipt, X } from 'lucide-react';

interface CartItem {
  productVariantId: string;
  productName: string;
  variantName: string;
  quantity: number;
  unitPrice: number;
  notes: string;
}

export function MenuPage() {
  const { tableCode } = useParams<{ tableCode: string }>();
  const navigate = useNavigate();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const { data: menu, isLoading } = useQuery({
    queryKey: ['qr-menu', tableCode],
    queryFn: () => api.get(`/qr/${tableCode}/menu`).then((r) => r.data),
    enabled: !!tableCode,
  });

  const placeOrder = useMutation({
    mutationFn: () =>
      api.post(`/qr/${tableCode}/order`, {
        items: cart.map((item) => ({
          productVariantId: item.productVariantId,
          quantity: item.quantity,
          notes: item.notes || undefined,
        })),
      }),
    onSuccess: () => {
      setCart([]);
      setShowCart(false);
      toast.success('Pedido enviado a cocina');
      navigate(`/mesa/${tableCode}/status`);
    },
    onError: () => toast.error('Error al enviar pedido'),
  });

  const callWaiter = useMutation({
    mutationFn: () => api.post(`/qr/${tableCode}/call-waiter`),
    onSuccess: () => toast.success('Camarero notificado'),
  });

  const requestBill = useMutation({
    mutationFn: () => api.post(`/qr/${tableCode}/request-bill`),
    onSuccess: () => toast.success('Cuenta solicitada'),
  });

  const addToCart = (product: any, variant: any) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productVariantId === variant.id);
      if (existing) {
        return prev.map((i) =>
          i.productVariantId === variant.id
            ? { ...i, quantity: i.quantity + 1 }
            : i,
        );
      }
      return [
        ...prev,
        {
          productVariantId: variant.id,
          productName: product.name,
          variantName: variant.name,
          quantity: 1,
          unitPrice: variant.price,
          notes: '',
        },
      ];
    });
    toast.success(`${product.name} agregado`, { duration: 1000 });
  };

  const updateCartQuantity = (variantId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i.productVariantId === variantId
            ? { ...i, quantity: i.quantity + delta }
            : i,
        )
        .filter((i) => i.quantity > 0),
    );
  };

  const cartTotal = cart.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  const categories = menu?.categories || [];
  const filteredCategories = activeCategory
    ? categories.filter((c: any) => c.id === activeCategory)
    : categories;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-pulse text-gray-400">Cargando menú...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="bg-blue-700 text-white px-4 py-5 sticky top-0 z-10">
        <h1 className="text-xl font-bold">{menu?.branchName || 'Menú Digital'}</h1>
        <p className="text-blue-200 text-sm mt-1">Mesa {menu?.tableNumber}</p>
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => callWaiter.mutate()}
            className="flex items-center gap-1.5 bg-blue-600 px-3 py-1.5 rounded-lg text-sm"
          >
            <Bell size={14} /> Llamar camarero
          </button>
          <button
            onClick={() => requestBill.mutate()}
            className="flex items-center gap-1.5 bg-blue-600 px-3 py-1.5 rounded-lg text-sm"
          >
            <Receipt size={14} /> Pedir cuenta
          </button>
          <button
            onClick={() => navigate(`/mesa/${tableCode}/status`)}
            className="flex items-center gap-1.5 bg-blue-600 px-3 py-1.5 rounded-lg text-sm"
          >
            Ver pedido
          </button>
        </div>
      </div>

      {/* Category filter */}
      <div className="sticky top-[120px] z-10 bg-gray-50 px-4 py-2 flex gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${
            !activeCategory ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border'
          }`}
        >
          Todos
        </button>
        {categories.map((cat: any) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${
              activeCategory === cat.id ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Menu items */}
      <div className="px-4 py-4 space-y-6">
        {filteredCategories.map((category: any) => (
          <div key={category.id}>
            <h2 className="text-lg font-bold text-gray-800 mb-3">{category.name}</h2>
            <div className="space-y-3">
              {category.products?.map((product: any) => (
                <div key={product.id} className="bg-white rounded-xl p-4 shadow-sm border">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{product.name}</h3>
                      {product.description && (
                        <p className="text-sm text-gray-500 mt-1">{product.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {product.variants?.map((variant: any) => (
                      <button
                        key={variant.id}
                        onClick={() => addToCart(product, variant)}
                        className="flex items-center gap-2 bg-gray-50 border rounded-lg px-3 py-2 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                      >
                        <span className="text-sm font-medium">
                          {variant.name !== 'Estándar' ? variant.name : ''}
                          ${Number(variant.price).toLocaleString('es-AR')}
                        </span>
                        <Plus size={16} className="text-blue-600" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Floating cart button */}
      {cartCount > 0 && !showCart && (
        <button
          onClick={() => setShowCart(true)}
          className="fixed bottom-6 right-6 bg-blue-600 text-white px-5 py-3 rounded-full shadow-lg flex items-center gap-2 z-20"
        >
          <ShoppingCart size={20} />
          <span className="font-bold">{cartCount}</span>
          <span className="text-blue-200">|</span>
          <span className="font-bold">${cartTotal.toLocaleString('es-AR')}</span>
        </button>
      )}

      {/* Cart drawer */}
      {showCart && (
        <div className="fixed inset-0 bg-black/50 z-30" onClick={() => setShowCart(false)}>
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[70vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-bold text-lg">Tu pedido</h3>
              <button onClick={() => setShowCart(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 space-y-3">
              {cart.map((item) => (
                <div key={item.productVariantId} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium">{item.productName}</p>
                    {item.variantName !== 'Estándar' && (
                      <p className="text-xs text-gray-500">{item.variantName}</p>
                    )}
                    <p className="text-sm text-gray-600">
                      ${(item.unitPrice * item.quantity).toLocaleString('es-AR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateCartQuantity(item.productVariantId, -1)}
                      className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"
                    >
                      <Minus size={16} />
                    </button>
                    <span className="font-bold w-6 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateCartQuantity(item.productVariantId, 1)}
                      className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 border-t">
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-lg">Total</span>
                <span className="font-bold text-lg">${cartTotal.toLocaleString('es-AR')}</span>
              </div>
              <button
                onClick={() => placeOrder.mutate()}
                disabled={placeOrder.isPending}
                className="w-full btn-primary py-3 flex items-center justify-center gap-2"
              >
                <Send size={18} />
                {placeOrder.isPending ? 'Enviando...' : 'Enviar pedido'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
