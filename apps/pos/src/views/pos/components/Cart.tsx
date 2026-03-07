import { useState } from 'react';
import { useCartStore } from '../../../stores/cart.store';
import { useAuthStore } from '../../../stores/auth.store';
import api from '../../../api/client';
import toast from 'react-hot-toast';
import { Minus, Plus, Trash2, Send, ShoppingBag } from 'lucide-react';

export function Cart() {
  const { items, removeItem, updateQuantity, clear, getSubtotal, getItemCount, tableId, orderType, notes, setOrderNotes } = useCartStore();
  const [loading, setLoading] = useState(false);

  const subtotal = getSubtotal();

  const handleCreateOrder = async () => {
    if (items.length === 0) {
      toast.error('Agregá productos al pedido');
      return;
    }

    setLoading(true);
    try {
      const { data: order } = await api.post('/orders', {
        type: orderType,
        tableId,
        notes,
      });

      await api.post(`/orders/${order.id}/items`, {
        items: items.map((item) => ({
          productVariantId: item.productVariantId,
          quantity: item.quantity,
          notes: item.notes,
          seat: item.seat,
          modifierIds: item.modifiers.map((m) => m.id),
        })),
      });

      await api.post(`/orders/${order.id}/send-to-kitchen`);

      toast.success(`Orden #${order.orderNumber} enviada`, {
        icon: '🔥',
        style: { borderRadius: '16px', background: 'var(--secondary)', color: '#fff' }
      });
      clear();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al crear orden');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white/40 backdrop-blur-md border-l border-white/20">
      {/* Header */}
      <div className="p-6">
        <div className="flex items-center justify-between bg-[var(--secondary)] p-4 rounded-[24px] shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white">
              <ShoppingBag size={20} />
            </div>
            <h2 className="font-black text-white tracking-tight">Tu Pedido</h2>
          </div>
          <span className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-[var(--secondary)] font-black text-xs">
            {getItemCount()}
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-auto px-6 space-y-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-[var(--text-secondary)] opacity-50 space-y-4">
            <div className="w-20 h-20 bg-white rounded-[30px] flex items-center justify-center border-4 border-dashed border-gray-100">
              <ShoppingBag size={30} />
            </div>
            <p className="font-bold tracking-tight">Pedido vacío</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="group flex flex-col gap-3 p-4 bg-white rounded-[24px] shadow-sm border border-gray-50 transition-all hover:bg-[var(--primary-light)]/30">
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0">
                  <p className="font-black text-[var(--text-main)] text-sm leading-tight">{item.productName}</p>
                  <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mt-0.5">{item.variantName}</p>
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="w-8 h-8 flex items-center justify-center rounded-xl text-[var(--error)] hover:bg-[var(--error)]/10 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 bg-gray-50 p-1 rounded-2xl">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-7 h-7 rounded-xl bg-white shadow-sm flex items-center justify-center text-[var(--text-main)] active:scale-90 transition-transform"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-6 text-center text-sm font-black">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-7 h-7 rounded-xl bg-white shadow-sm flex items-center justify-center text-[var(--text-main)] active:scale-90 transition-transform"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <p className="text-sm font-black text-[var(--primary)] uppercase">
                  ${(item.unitPrice * item.quantity).toLocaleString('es-AR')}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-6 space-y-4 bg-white/60 backdrop-blur-md">
        <div className="space-y-2">
          <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-1">Observaciones</p>
          <input
            type="text"
            placeholder="Escribe aquí..."
            value={notes}
            onChange={(e) => setOrderNotes(e.target.value)}
            className="w-full px-4 py-3 bg-white/50 border border-white rounded-2xl focus:outline-none focus:ring-4 focus:ring-[var(--primary)]/5 transition-all text-sm font-medium"
          />
        </div>

        <div className="bg-[var(--secondary)] rounded-[24px] p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between text-white">
            <span className="text-sm font-medium opacity-60">Total a pagar</span>
            <span className="text-2xl font-black tracking-tight">${subtotal.toLocaleString('es-AR')}</span>
          </div>

          <button
            onClick={handleCreateOrder}
            disabled={loading || items.length === 0}
            className="w-full py-4 bg-[var(--primary)] text-white rounded-2xl font-black flex items-center justify-center gap-3 shadow-[0px_8px_16px_rgba(0,0,0,0.2)] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Send size={18} />
                <span>ENVIAR A COCINA</span>
              </>
            )}
          </button>
        </div>

        {items.length > 0 && (
          <button onClick={clear} className="w-full text-[10px] font-black text-[var(--error)] uppercase tracking-[0.2em] hover:underline transition-all">
            Limpiar Pedido
          </button>
        )}
      </div>
    </div>
  );
}
