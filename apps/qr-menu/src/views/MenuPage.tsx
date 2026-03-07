import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import toast from 'react-hot-toast';
import { useState } from 'react';
import { ShoppingBag, Plus, Minus, Send, Bell, Receipt, X, ChevronRight } from 'lucide-react';

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
      toast.success('¡Pedido enviado!', {
        icon: '🚀',
        style: { borderRadius: '16px', background: 'var(--secondary)', color: '#fff' }
      });
      navigate(`/mesa/${tableCode}/status`);
    },
    onError: () => toast.error('Error al enviar pedido'),
  });

  const callWaiter = useMutation({
    mutationFn: () => api.post(`/qr/${tableCode}/call-waiter`),
    onSuccess: () => toast.success('Camarero notificado', { icon: '🔔' }),
  });

  const requestBill = useMutation({
    mutationFn: () => api.post(`/qr/${tableCode}/request-bill`),
    onSuccess: () => toast.success('Cuenta solicitada', { icon: '💰' }),
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
    toast.success(`${product.name} añadido`, { duration: 1000, position: 'bottom-center' });
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
      <div className="flex flex-col items-center justify-center h-screen bg-background">
        <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
        <p className="font-black text-secondary uppercase tracking-widest text-xs">Cargando Experiencia...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Premium Mobile Header */}
      <div className="sticky top-0 z-30 p-4">
        <div className="bg-white/70 backdrop-blur-xl rounded-[28px] p-5 border border-white/40 shadow-xl flex flex-col gap-4 !p-6 shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-2xl" />

          <div className="flex justify-between items-start relative z-10">
            <div>
              <h1 className="text-2xl font-black text-secondary tracking-tight">{menu?.branchName || 'Menú Digital'}</h1>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-primary/10 text-primary rounded-lg text-[10px] font-black uppercase tracking-wider mt-1">
                Mesa {menu?.tableNumber}
              </div>
            </div>
            <button
              onClick={() => navigate(`/mesa/${tableCode}/status`)}
              className="w-10 h-10 bg-white shadow-sm border border-gray-100 rounded-xl flex items-center justify-center text-primary"
            >
              <Receipt size={18} />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 relative z-10">
            <button
              onClick={() => callWaiter.mutate()}
              className="flex items-center justify-center gap-2 py-3 bg-white/50 border border-white rounded-2xl text-secondary text-xs font-black uppercase tracking-widest hover:bg-white transition-all active:scale-95"
            >
              <Bell size={14} className="text-primary" /> Camarero
            </button>
            <button
              onClick={() => requestBill.mutate()}
              className="flex items-center justify-center gap-2 py-3 bg-secondary text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all active:scale-95"
            >
              <Receipt size={14} className="text-accent" /> La Cuenta
            </button>
          </div>
        </div>
      </div>

      {/* Modern Category Tabs */}
      <div className="sticky top-[164px] z-20 px-4 py-2 flex gap-3 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-300 ${!activeCategory ? 'bg-primary text-white shadow-lg scale-105' : 'bg-white text-text-secondary border border-transparent shadow-sm'}`}
        >
          Todos
        </button>
        {categories.map((cat: any) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap ${activeCategory === cat.id ? 'bg-primary text-white shadow-lg scale-105' : 'bg-white text-text-secondary border border-transparent shadow-sm'}`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Redesigned Menu Items */}
      <div className="px-5 py-6 space-y-10">
        {filteredCategories.map((category: any) => (
          <div key={category.id} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-1 w-8 bg-primary rounded-full" />
              <h2 className="text-sm font-black text-secondary uppercase tracking-[0.2em]">{category.name}</h2>
            </div>

            <div className="grid gap-4">
              {category.products?.map((product: any) => (
                <div key={product.id} className="bg-white rounded-[28px] p-5 shadow-card border-none flex gap-4 transition-all active:bg-gray-50">
                  {product.imageUrl && (
                    <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 bg-gray-50">
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex-1 flex flex-col justify-between py-0.5">
                    <div>
                      <h3 className="font-black text-secondary text-sm leading-tight">{product.name}</h3>
                      {product.description && (
                        <p className="text-[10px] text-text-secondary font-medium mt-1 line-clamp-2">{product.description}</p>
                      )}
                    </div>

                    <div className="flex items-end justify-between mt-2">
                      <p className="text-base font-black text-primary">
                        ${Number(product.variants?.[0]?.price || 0).toLocaleString('es-AR')}
                      </p>
                      <button
                        onClick={() => addToCart(product, product.variants?.[0])}
                        className="w-9 h-9 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition-transform"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Fixed Sticky Cart Summary */}
      {cartCount > 0 && !showCart && (
        <div className="fixed bottom-0 left-0 right-0 p-6 z-40 bg-gradient-to-t from-background to-transparent">
          <button
            onClick={() => setShowCart(true)}
            className="w-full bg-secondary text-white p-5 rounded-[24px] shadow-2xl flex items-center justify-between group active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
                <ShoppingBag size={18} />
              </div>
              <div className="text-left">
                <p className="text-[10px] uppercase font-black tracking-widest opacity-60">Tu Bandeja</p>
                <p className="text-sm font-black">{cartCount} Productos</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-lg font-black tracking-tight">${cartTotal.toLocaleString('es-AR')}</span>
              <ChevronRight size={18} className="opacity-40 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </div>
      )}

      {/* Premium Cart Overlay Drawer */}
      {showCart && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex flex-col justify-end" onClick={() => setShowCart(false)}>
          <div
            className="bg-background rounded-t-[40px] max-h-[85vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-2 duration-500"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mt-4 mb-2 opacity-50" />

            <div className="px-8 py-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-secondary text-white rounded-2xl flex items-center justify-center">
                  <ShoppingBag size={20} />
                </div>
                <h3 className="font-black text-xl text-secondary tracking-tight">Tu Pedido</h3>
              </div>
              <button onClick={() => setShowCart(false)} className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center border border-gray-100 shadow-sm">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-auto px-8 space-y-4 pb-10">
              {cart.map((item) => (
                <div key={item.productVariantId} className="bg-white rounded-[28px] p-5 shadow-card border-none flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div className="min-w-0">
                      <p className="font-black text-secondary text-sm">{item.productName}</p>
                      <p className="text-[10px] font-bold text-text-secondary uppercase tracking-wider mt-0.5">{item.variantName}</p>
                    </div>
                    <p className="font-black text-primary text-sm">${(item.unitPrice * item.quantity).toLocaleString('es-AR')}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <button onClick={() => updateCartQuantity(item.productVariantId, -1)} className="text-error text-[10px] font-black uppercase tracking-widest flex items-center gap-1 opacity-60 hover:opacity-100">
                      <Trash2 size={12} /> Eliminar
                    </button>
                    <div className="flex items-center gap-4 bg-gray-50 p-1.5 rounded-2xl">
                      <button
                        onClick={() => updateCartQuantity(item.productVariantId, -1)}
                        className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-secondary active:scale-90"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="font-black text-sm w-4 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateCartQuantity(item.productVariantId, 1)}
                        className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-secondary active:scale-90"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-8 bg-white rounded-t-[40px] shadow-[0px_-20px_40px_rgba(0,0,0,0.05)]">
              <div className="flex items-center justify-between mb-6">
                <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em]">Total Estimado</p>
                <span className="font-black text-3xl text-secondary tracking-tight">${cartTotal.toLocaleString('es-AR')}</span>
              </div>
              <button
                onClick={() => placeOrder.mutate()}
                disabled={placeOrder.isPending}
                className="w-full py-4 rounded-2xl font-black bg-primary text-white shadow-[0px_8px_20px_rgba(0, 74, 173, 0.3)] active:scale-95 transition-all uppercase tracking-widest text-sm flex items-center justify-center gap-3 h-16 shadow-[0px_12px_24px_rgba(0,74,173,0.3)]"
              >
                {placeOrder.isPending ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send size={18} />
                    <span>ENVIAR PEDIDO</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Trash2({ size, className }: { size: number, className?: string }) {
  return <X size={size} className={className} /> // Reused X for breadcrumb/trash look
}
