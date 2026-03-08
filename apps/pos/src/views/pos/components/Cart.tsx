import { useState } from 'react';
import { useCartStore } from '../../../stores/cart.store';
import api from '../../../api/client';
import toast from 'react-hot-toast';
import { Minus, Plus, Trash2, Send, ShoppingBag, CreditCard } from 'lucide-react';
import { PaymentModal } from './PaymentModal';
import { ReceiptModal } from './ReceiptModal';
import { formatCurrency } from '../../../utils/currency';

export function Cart() {
  const { items, removeItem, updateQuantity, clear, getSubtotal, getItemCount, tableId, activeOrderId, orderType, notes, setOrderNotes } = useCartStore();
  const [loading, setLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);

  const subtotal = getSubtotal();

  const handleCreateOrder = async (isPaid = false, paymentData?: any) => {
    if (items.length === 0) {
      toast.error('Agregá productos al pedido');
      return;
    }

    setLoading(true);
    try {
      let orderId = activeOrderId;
      let orderNumber: number | undefined;

      if (!orderId) {
        const { data: order } = await api.post('/orders', {
          type: orderType,
          tableId,
          notes,
        });
        orderId = order.id;
        orderNumber = order.orderNumber;
      }

      await api.post(`/orders/${orderId}/items`, {
        items: items.map((item) => ({
          productVariantId: item.productVariantId,
          quantity: item.quantity,
          notes: item.notes,
          seat: item.seat,
          modifierIds: item.modifiers.map((m) => m.id),
        })),
      });

      if (isPaid && paymentData) {
        await api.post('/payments', {
          orderId,
          method: paymentData.method,
          amount: paymentData.amount,
          receivedAmount: paymentData.receivedAmount,
        });
        await api.post(`/orders/${orderId}/close`);

        // Show receipt
        setReceiptData({
          orderNumber,
          type: orderType,
          items: items.map((item) => ({
            name: item.productName,
            variant: item.variantName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: (item.unitPrice + item.modifiers.reduce((s, m) => s + m.priceAdjustment, 0)) * item.quantity,
          })),
          subtotal,
          total: subtotal,
          paymentMethod: paymentData.method,
          receivedAmount: paymentData.receivedAmount,
          changeAmount: paymentData.changeAmount,
          date: new Date(),
        });
      } else {
        await api.post(`/orders/${orderId}/send-to-kitchen`);
      }

      const label = orderNumber ? `#${orderNumber}` : '';
      toast.success(isPaid ? `Venta ${label} cobrada` : `Orden ${label} enviada a cocina`, {
        icon: isPaid ? '💰' : '🔥',
        style: { borderRadius: '16px', background: '#001F3D', color: '#fff' }
      });

      clear();
      setShowPayment(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al procesar pedido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white/40 backdrop-blur-md border-l border-white/20 font-outfit">
      {/* Header */}
      <div className="p-6">
        <div className="flex items-center justify-between bg-secondary p-4 rounded-[24px] shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white">
              <ShoppingBag size={20} />
            </div>
            <h2 className="font-black text-white tracking-tight italic">Cart <span className="opacity-60">Box</span></h2>
          </div>
          <span className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-black text-xs shadow-inner">
            {getItemCount()}
          </span>
        </div>
        {activeOrderId && (
          <div className="mt-3 flex items-center gap-2 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-2xl">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Añadiendo a orden existente</span>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="flex-1 overflow-auto px-6 space-y-4 no-scrollbar">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-text-secondary opacity-30 space-y-4">
            <div className="w-20 h-20 bg-white rounded-[30px] flex items-center justify-center border-4 border-dashed border-gray-100">
              <ShoppingBag size={30} />
            </div>
            <p className="font-black uppercase tracking-widest text-[10px]">Sin productos</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="group flex flex-col gap-3 p-5 bg-white rounded-[28px] shadow-sm border border-gray-50 transition-all hover:bg-white hover:shadow-xl hover:scale-[1.02]">
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0">
                  <p className="font-black text-secondary text-sm leading-tight italic">{item.productName}</p>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{item.variantName}</p>
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="p-2 flex items-center justify-center rounded-xl text-rose-300 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 bg-[#F4F7FE] p-1 rounded-2xl">
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                    className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-secondary active:scale-90 transition-transform"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-6 text-center text-xs font-black">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-secondary active:scale-90 transition-transform"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <p className="text-sm font-black text-primary italic">
                  {formatCurrency(item.unitPrice * item.quantity)}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="p-6 space-y-4 bg-white/80 backdrop-blur-xl border-t border-gray-50">
        <div className="space-y-2">
          <p className="text-[10px] font-black text-text-secondary uppercase tracking-[0.2em] ml-2">Nota Rápida</p>
          <input
            type="text"
            placeholder="Alergias, preferencias..."
            value={notes}
            onChange={(e) => setOrderNotes(e.target.value)}
            className="w-full px-5 py-3.5 bg-gray-50 border-none rounded-[20px] focus:bg-white focus:ring-4 focus:ring-primary/5 transition-all text-sm font-bold placeholder:text-gray-300 outline-none"
          />
        </div>

        <div className="bg-secondary rounded-[32px] p-6 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700" />

          <div className="flex items-center justify-between text-white mb-6">
            <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Total</span>
            <span className="text-3xl font-black tracking-tighter italic">{formatCurrency(subtotal)}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleCreateOrder(false)}
              disabled={loading || items.length === 0}
              className="py-4 bg-white/10 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send size={14} /> Cocina</>}
            </button>
            <button
              onClick={() => setShowPayment(true)}
              disabled={loading || items.length === 0}
              className="py-4 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-primary/20 hover:scale-[1.05] active:scale-95 transition-all disabled:opacity-50"
            >
              <CreditCard size={14} /> Cobrar
            </button>
          </div>
        </div>

        {items.length > 0 && (
          <button onClick={clear} className="w-full text-[9px] font-black text-rose-300 uppercase tracking-[0.3em] hover:text-rose-500 transition-all">
            Limpiar Pedido
          </button>
        )}
      </div>

      {showPayment && (
        <PaymentModal
          total={subtotal}
          onClose={() => setShowPayment(false)}
          onComplete={(data) => handleCreateOrder(true, data)}
        />
      )}

      {receiptData && (
        <ReceiptModal
          data={receiptData}
          onClose={() => setReceiptData(null)}
        />
      )}
    </div>
  );
}
