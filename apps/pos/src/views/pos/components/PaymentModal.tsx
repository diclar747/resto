import { useState } from 'react';
import {
  CreditCard, Banknote, UserCheck, X,
  CheckCircle2, ArrowRight, Loader2
} from 'lucide-react';
import { formatCurrency } from '../../../utils/currency';

interface PaymentModalProps {
  total: number;
  onClose: () => void;
  onComplete: (paymentData: any) => void;
}

export function PaymentModal({ total, onClose, onComplete }: PaymentModalProps) {
  const [method, setMethod] = useState<'CASH' | 'CARD' | 'CREDIT'>('CASH');
  const [receivedAmount, setReceivedAmount] = useState<string>(Math.round(total).toString());
  const [isProcessing, setIsProcessing] = useState(false);

  const received = parseInt(receivedAmount || '0', 10);
  const change = Math.max(0, received - Math.round(total));
  const canPay = method !== 'CASH' || received >= Math.round(total);

  const handlePayment = async () => {
    setIsProcessing(true);
    await new Promise(r => setTimeout(r, 800));
    onComplete({
      method,
      amount: total,
      receivedAmount: received,
      changeAmount: change,
      status: 'COMPLETED'
    });
    setIsProcessing(false);
  };

  const methods = [
    { id: 'CASH' as const, icon: Banknote, label: 'Efectivo', accent: 'emerald' },
    { id: 'CARD' as const, icon: CreditCard, label: 'Tarjeta', accent: 'blue' },
    { id: 'CREDIT' as const, icon: UserCheck, label: 'Crédito', accent: 'purple' },
  ];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-secondary/80 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-full max-w-md bg-white rounded-[32px] shadow-2xl overflow-hidden max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="p-5 pb-4 border-b border-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black text-secondary tracking-tight">
              Finalizar <span className="text-primary italic">Cobro</span>
            </h3>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 hover:text-secondary hover:bg-gray-200 transition-all"
            >
              <X size={18} />
            </button>
          </div>

          {/* Total */}
          <div className="bg-gradient-to-br from-primary to-secondary rounded-2xl p-5 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -mr-12 -mt-12 blur-2xl" />
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Importe a Cobrar</p>
            <p className="text-4xl font-black tracking-tight">{formatCurrency(total)}</p>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Payment Methods */}
          <div>
            <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-3">Método de Pago</p>
            <div className="grid grid-cols-3 gap-3">
              {methods.map((m) => {
                const isActive = method === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className={`relative flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 ${
                      isActive
                        ? 'border-secondary bg-secondary text-white shadow-lg -translate-y-0.5'
                        : 'border-gray-100 bg-gray-50 text-secondary hover:border-gray-200'
                    }`}
                  >
                    <m.icon size={22} />
                    <span className="text-[10px] font-black uppercase tracking-wider">{m.label}</span>
                    {isActive && (
                      <div className="absolute -top-1.5 -right-1.5 bg-primary text-white p-0.5 rounded-full shadow-md">
                        <CheckCircle2 size={14} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Received Amount */}
          <div>
            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-2 block">
              Importe Recibido
            </label>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl font-black text-gray-300">₲</span>
              <input
                inputMode="numeric"
                pattern="[0-9]*"
                className="w-full pl-14 pr-5 py-5 bg-background border-2 border-transparent rounded-2xl text-2xl font-black text-secondary outline-none focus:bg-white focus:border-primary/20 transition-all"
                value={receivedAmount}
                onChange={(e) => setReceivedAmount(e.target.value.replace(/\D/g, ''))}
                autoFocus
              />
            </div>
          </div>

          {/* Change (Cash only) */}
          {method === 'CASH' && (
            <div className={`p-5 rounded-2xl border flex items-center justify-between ${
              canPay
                ? 'bg-emerald-50 border-emerald-200'
                : 'bg-rose-50 border-rose-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  canPay ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                }`}>
                  <Banknote size={20} />
                </div>
                <div>
                  <p className={`text-[10px] font-black uppercase tracking-widest ${
                    canPay ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {canPay ? 'Cambio a entregar' : 'Monto insuficiente'}
                  </p>
                </div>
              </div>
              <p className={`text-3xl font-black tracking-tight ${
                canPay ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {formatCurrency(change)}
              </p>
            </div>
          )}

          {/* Credit notice */}
          {method === 'CREDIT' && (
            <div className="p-5 bg-purple-50 border border-purple-200 rounded-2xl">
              <p className="text-xs font-black text-purple-700 uppercase tracking-widest mb-1">Crédito Interno</p>
              <p className="text-sm text-purple-600/70 font-medium">Se registrará como pendiente de cobro.</p>
            </div>
          )}
        </div>

        {/* Footer - Confirm Button */}
        <div className="p-5 border-t border-gray-50">
          <button
            onClick={handlePayment}
            disabled={isProcessing || !canPay}
            className={`w-full py-5 rounded-2xl text-xs font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-3 ${
              isProcessing || !canPay
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-secondary text-white shadow-xl shadow-secondary/20 hover:scale-[1.01] active:scale-[0.99]'
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                Confirmar y Facturar
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
