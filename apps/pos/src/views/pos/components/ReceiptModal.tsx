import { X, Printer, UtensilsCrossed, CheckCircle } from 'lucide-react';
import { formatCurrency } from '../../../utils/currency';

interface ReceiptItem {
  name: string;
  variant?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface ReceiptData {
  orderNumber?: number;
  type: 'dine_in' | 'takeaway' | 'delivery';
  tableNumber?: number;
  items: ReceiptItem[];
  subtotal: number;
  total: number;
  paymentMethod: string;
  receivedAmount?: number;
  changeAmount?: number;
  date: Date;
}

interface ReceiptModalProps {
  data: ReceiptData;
  onClose: () => void;
}

const typeLabels: Record<string, string> = {
  dine_in: 'Mesa',
  takeaway: 'Para Llevar',
  delivery: 'Delivery',
};

const methodLabels: Record<string, string> = {
  CASH: 'Efectivo',
  CARD: 'Tarjeta',
  CREDIT: 'Crédito',
};

export function ReceiptModal({ data, onClose }: ReceiptModalProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-secondary/80 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-sm flex flex-col max-h-[95vh]">
        {/* Success badge */}
        <div className="flex justify-center mb-3 relative z-10">
          <div className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/30 border-4 border-white dark:border-surface">
            <CheckCircle className="text-white" size={28} />
          </div>
        </div>

        {/* Receipt card */}
        <div id="receipt-printable" className="bg-white dark:bg-surface rounded-[28px] shadow-2xl overflow-hidden flex flex-col max-h-[85dvh]">
          {/* Header */}
          <div className="p-6 pb-4 text-center border-b-2 border-dashed border-gray-200 dark:border-white/15">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <UtensilsCrossed className="text-white" size={16} />
              </div>
              <h2 className="text-lg font-black text-secondary tracking-tight">
                Resto<span className="text-primary italic">POS</span>
              </h2>
            </div>
            <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">Comprobante de Venta</p>
          </div>

          {/* Order Info */}
          <div className="px-4 md:px-6 py-4 border-b border-dashed border-gray-200 dark:border-white/15">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">
                {data.orderNumber ? `Orden #${data.orderNumber}` : 'Orden'}
              </span>
              <span className="text-[10px] font-bold text-text-secondary">
                {data.date.toLocaleDateString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-secondary">
                {typeLabels[data.type] || data.type}
                {data.tableNumber ? ` ${data.tableNumber}` : ''}
              </span>
              <span className="text-[10px] font-bold text-text-secondary">
                {data.date.toLocaleTimeString('es-PY', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-2">
            {data.items.map((item, i) => (
              <div key={i} className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-secondary leading-tight">
                    {item.quantity}x {item.name}
                  </p>
                  {item.variant && item.variant !== 'Estándar' && (
                    <p className="text-[10px] text-text-secondary">{item.variant}</p>
                  )}
                </div>
                <p className="text-sm font-black text-secondary whitespace-nowrap">
                  {formatCurrency(item.subtotal)}
                </p>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="px-4 md:px-6 py-4 border-t-2 border-dashed border-gray-200 dark:border-white/15 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text-secondary">Subtotal</span>
              <span className="text-sm font-bold text-secondary">{formatCurrency(data.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-white/10">
              <span className="text-sm font-black text-secondary uppercase tracking-widest">Total</span>
              <span className="text-2xl font-black text-primary">{formatCurrency(data.total)}</span>
            </div>
          </div>

          {/* Payment Info */}
          <div className="px-4 md:px-6 py-4 bg-background border-t border-dashed border-gray-200 dark:border-white/15 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Método</span>
              <span className="text-xs font-black text-secondary">{methodLabels[data.paymentMethod] || data.paymentMethod}</span>
            </div>
            {data.paymentMethod === 'CASH' && data.receivedAmount !== undefined && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-text-secondary">Recibido</span>
                  <span className="text-xs font-bold text-secondary">{formatCurrency(data.receivedAmount)}</span>
                </div>
                {(data.changeAmount ?? 0) > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-text-secondary">Cambio</span>
                    <span className="text-xs font-black text-emerald-600">{formatCurrency(data.changeAmount!)}</span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 text-center border-t border-dashed border-gray-200 dark:border-white/15">
            <p className="text-[10px] font-bold text-text-secondary">Gracias por su compra</p>
          </div>
        </div>

        {/* Action buttons (outside receipt for print purposes) */}
        <div className="flex gap-3 mt-4 print:hidden">
          <button
            onClick={handlePrint}
            className="flex-1 py-3.5 bg-white dark:bg-surface text-secondary rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-all flex items-center justify-center gap-2"
          >
            <Printer size={16} /> Imprimir
          </button>
          <button
            onClick={onClose}
            className="flex-[2] py-3.5 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
