import { useState } from 'react';
import {
    CreditCard, Banknote, UserCheck, ArrowRight, X,
    CheckCircle2, AlertCircle, Receipt, Percent, ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

interface PaymentModalProps {
    total: number;
    onClose: () => void;
    onComplete: (paymentData: any) => void;
}

export function PaymentModal({ total, onClose, onComplete }: PaymentModalProps) {
    const [method, setMethod] = useState<'CASH' | 'CARD' | 'CREDIT'>('CASH');
    const [receivedAmount, setReceivedAmount] = useState<string>(total.toString());
    const [isProcessing, setIsProcessing] = useState(false);

    const change = Math.max(0, parseFloat(receivedAmount || '0') - total);

    const handlePayment = async () => {
        setIsProcessing(true);
        // Simulate payment processing
        await new Promise(r => setTimeout(r, 1500));

        onComplete({
            method,
            amount: total,
            receivedAmount: parseFloat(receivedAmount),
            changeAmount: change,
            status: 'COMPLETED'
        });
        setIsProcessing(false);
    };

    const methods = [
        { id: 'CASH', icon: Banknote, label: 'Efectivo', color: 'bg-emerald-50 text-emerald-600' },
        { id: 'CARD', icon: CreditCard, label: 'Tarjeta', color: 'bg-blue-50 text-blue-600' },
        { id: 'CREDIT', icon: UserCheck, label: 'Crédito Cli.', color: 'bg-purple-50 text-purple-600' },
    ];

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-secondary/80 backdrop-blur-md" onClick={onClose} />

            <div className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl border border-white overflow-hidden flex flex-col md:flex-row shadow-black/40">
                {/* Left: Summary */}
                <div className="w-full md:w-5/12 bg-[#F4F7FE] p-10 flex flex-col justify-between">
                    <div>
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6">
                            <Receipt className="text-primary" size={24} />
                        </div>
                        <h3 className="text-2xl font-black text-secondary tracking-tighter italic">Checkout <span className="text-primary underline">Secure</span></h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">Transacción Protegida v2.4</p>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Importe Total</p>
                            <p className="text-5xl font-black text-secondary tracking-tighter">$ {total.toLocaleString()}</p>
                        </div>

                        <div className="p-6 bg-white rounded-3xl shadow-sm border border-gray-100 flex items-center gap-4">
                            <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center"><Percent size={20} /></div>
                            <div>
                                <p className="text-[9px] font-black text-gray-400 uppercase">Loyalty Points</p>
                                <p className="text-xs font-black text-indigo-600">+145 Puntos</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-emerald-500 bg-emerald-50/50 p-4 rounded-2xl">
                        <ShieldCheck size={16} />
                        <span className="text-[9px] font-black uppercase tracking-widest">Pago Encriptado SSL</span>
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex-1 p-10 space-y-8">
                    <div className="flex items-center justify-between">
                        <h4 className="text-lg font-black text-secondary uppercase tracking-tight">Método de Pago</h4>
                        <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X size={20} className="text-gray-300" /></button>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        {methods.map((m) => (
                            <button
                                key={m.id}
                                onClick={() => setMethod(m.id as any)}
                                className={`flex flex-col items-center justify-center gap-3 p-5 rounded-[28px] border-2 transition-all ${method === m.id ? 'border-primary bg-primary/5 scale-105 shadow-lg' : 'border-gray-50 bg-gray-50/30 hover:bg-gray-50'
                                    }`}
                            >
                                <div className={`p-3 rounded-2xl ${method === m.id ? 'bg-primary text-white' : m.color}`}>
                                    <m.icon size={22} />
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${method === m.id ? 'text-primary' : 'text-gray-400'}`}>{m.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest ml-2">Monto Recibido</label>
                            <div className="relative">
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-gray-300">$</span>
                                <input
                                    type="number"
                                    className="w-full pl-12 pr-8 py-5 bg-[#F4F7FE] border-none rounded-[24px] text-2xl font-black text-secondary outline-none focus:ring-4 focus:ring-primary/5 transition-all"
                                    value={receivedAmount}
                                    onChange={(e) => setReceivedAmount(e.target.value)}
                                />
                            </div>
                        </div>

                        {method === 'CASH' && (
                            <div className="p-6 bg-emerald-50/50 rounded-[28px] border border-emerald-100 flex items-center justify-between animate-in zoom-in duration-300">
                                <div className="flex items-center gap-3 text-emerald-600">
                                    <CheckCircle2 size={24} />
                                    <span className="text-xs font-black uppercase tracking-widest">Cambio para entregar</span>
                                </div>
                                <p className="text-2xl font-black text-emerald-600">$ {change.toLocaleString()}</p>
                            </div>
                        )}

                        {method === 'CREDIT' && (
                            <div className="p-6 bg-purple-50/50 rounded-[28px] border border-purple-100 flex items-center gap-3 animate-in fade-in duration-300">
                                <AlertCircle size={24} className="text-purple-600" />
                                <div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-purple-600 block">Crédito de Cliente</span>
                                    <p className="text-[11px] font-medium text-purple-900/60 leading-tight">Esta orden se cargará a la cuenta corriente del cliente seleccionado.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handlePayment}
                        disabled={isProcessing || (method === 'CASH' && parseFloat(receivedAmount) < total)}
                        className="w-full py-6 bg-secondary text-white rounded-[28px] text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-secondary/40 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {isProcessing ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Autenticando...</span>
                            </>
                        ) : (
                            <>
                                Finalizar Cobro
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
