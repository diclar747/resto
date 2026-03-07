import { useState } from 'react';
import { useCartStore } from '../../../stores/cart.store';
import { useAuthStore } from '../../../stores/auth.store';
import api from '../../../api/client';
import toast from 'react-hot-toast';
import { Minus, Plus, Trash2, Send, CreditCard } from 'lucide-react';

export function Cart() {
  const { items, removeItem, updateQuantity, clear, getSubtotal, getItemCount, tableId, orderType, notes, setOrderNotes } = useCartStore();
  const branchId = useAuthStore((s) => s.user?.branchId);
  const userId = useAuthStore((s) => s.user?.id);
  const [loading, setLoading] = useState(false);

  const subtotal = getSubtotal();

  const handleCreateOrder = async () => {
    if (items.length === 0) {
      toast.error('Agregá productos al pedido');
      return;
    }

    setLoading(true);
    try {
      // 1. Create order
      const { data: order } = await api.post('/orders', {
        type: orderType,
        tableId,
        notes,
      });

      // 2. Add items
      await api.post(`/orders/${order.id}/items`, {
        items: items.map((item) => ({
          productVariantId: item.productVariantId,
          quantity: item.quantity,
          notes: item.notes,
          seat: item.seat,
          modifierIds: item.modifiers.map((m) => m.id),
        })),
      });

      // 3. Send to kitchen
      await api.post(`/orders/${order.id}/send-to-kitchen`);

      toast.success(`Orden #${order.orderNumber} enviada a cocina`);
      clear();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al crear orden');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-lg">Pedido</h2>
          <span className="badge bg-blue-100 text-blue-700">
            {getItemCount()} items
          </span>
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-auto p-4 space-y-3">
        {items.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <p>Pedido vacío</p>
            <p className="text-sm">Seleccioná productos</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex items-start gap-3 py-2 border-b border-gray-100">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900 truncate">{item.productName}</p>
                <p className="text-xs text-gray-500">{item.variantName}</p>
                {item.modifiers.length > 0 && (
                  <p className="text-xs text-blue-600">
                    {item.modifiers.map((m) => m.name).join(', ')}
                  </p>
                )}
                {item.notes && (
                  <p className="text-xs text-orange-600 italic">{item.notes}</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                  className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                >
                  <Minus size={14} />
                </button>
                <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                  className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                >
                  <Plus size={14} />
                </button>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">
                  ${(item.unitPrice * item.quantity).toLocaleString('es-AR')}
                </p>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-red-400 hover:text-red-600 mt-1"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Notes */}
      <div className="px-4 pb-2">
        <input
          type="text"
          placeholder="Notas del pedido..."
          value={notes}
          onChange={(e) => setOrderNotes(e.target.value)}
          className="input text-sm"
        />
      </div>

      {/* Footer */}
      <div className="p-4 border-t bg-gray-50 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-gray-600">Subtotal</span>
          <span className="text-xl font-bold">${subtotal.toLocaleString('es-AR')}</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleCreateOrder}
            disabled={loading || items.length === 0}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            <Send size={16} />
            {loading ? 'Enviando...' : 'Enviar a cocina'}
          </button>
        </div>

        {items.length > 0 && (
          <button onClick={clear} className="btn-ghost w-full text-sm text-red-500">
            Limpiar pedido
          </button>
        )}
      </div>
    </>
  );
}
