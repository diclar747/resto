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
        { id: 'CASH', icon: Banknote, label: 'Efectivo', color: 'bg-emerald-50 text-emerald-600', activeIcon: 'bg-emerald-500' },
        { id: 'CARD', icon: CreditCard, label: 'Tarjeta', color: 'bg-blue-50 text-blue-600', activeIcon: 'bg-blue-500' },
        { id: 'CREDIT', icon: UserCheck, label: 'Crédito', color: 'bg-purple-50 text-purple-600', activeIcon: 'bg-purple-500' },
    ];

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-secondary/80 backdrop-blur-md" onClick={onClose} />

            <div className="relative w-full max-w-3xl bg-white rounded-[40px] shadow-2xl border border-white overflow-hidden flex flex-col md:flex-row">
                {/* Left: Summary */}
                <div className="w-full md:w-[40%] bg-[#F8FAFC] p-8 md:p-10 flex flex-col justify-between border-r border-gray-100">
                    <div className="space-y-6">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-50">
                            <Receipt className="text-secondary" size={28} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-secondary tracking-tighter leading-tight italic">Finalizar <span className="text-primary block">Transacción</span></h3>
                            <div className="flex items-center gap-2 mt-3">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Conexión Segura SSL</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-8 py-8 md:py-0">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Importe a Cobrar</p>
                            <p className="text-5xl font-black text-secondary tracking-tighter">$ {total.toLocaleString()}</p>
                        </div>

                        <div className="p-6 bg-white rounded-[32px] shadow-sm border border-gray-50 flex items-center gap-4 group transition-all hover:border-primary/20">
                            <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-all"><Percent size={22} /></div>
                            <div>
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Puntos Resto</p>
                                <p className="text-sm font-black text-indigo-600">+145 Créditos</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 text-secondary/40">
                        <ShieldCheck size={18} />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em]">Verified Payment Gateway</span>
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex-1 p-8 md:p-10 space-y-8 bg-white">
                    <div className="flex items-center justify-between">
                        <h4 className="text-xs font-black text-secondary uppercase tracking-[0.2em] opacity-50">Seleccionar Método</h4>
                        <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-xl transition-colors"><X size={20} className="text-gray-300" /></button>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        {methods.map((m) => (
                            <button
                                key={m.id}
                                onClick={() => setMethod(m.id as any)}
                                className={`flex flex-col items-center justify-center gap-4 p-6 rounded-[32px] border-2 transition-all duration-300 relative group ${method === m.id
                                        ? 'border-secondary bg-secondary text-white shadow-xl translate-y-[-4px]'
                                        : 'border-gray-50 bg-[#F8FAFC] text-secondary hover:border-gray-200 hover:bg-gray-100'
                                    }`}
                            >
                                <div className={`p-4 rounded-2xl transition-all duration-300 ${method === m.id ? 'bg-white text-secondary' : m.color
                                    }`}>
                                    <m.icon size={24} />
                                </div>
                                <span className={`text-[11px] font-black uppercase tracking-wider ${method === m.id ? 'text-white' : 'text-secondary/60'
                                    }`}>{m.label}</span>

                                {method === m.id && (
                                    <div className="absolute -top-2 -right-2 bg-primary text-white p-1 rounded-full shadow-lg">
                                        <CheckCircle2 size={16} />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-secondary/40 uppercase tracking-widest ml-3">Importe Recibido</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-8 flex items-center pointer-events-none">
                                    <span className="text-3xl font-black text-gray-300 transition-colors group-focus-within:text-primary">$</span>
                                </div>
                                <input
                                    type="number"
                                    className="w-full pl-16 pr-8 py-7 bg-[#F4F7FE] border-2 border-transparent rounded-[32px] text-3xl font-black text-secondary outline-none focus:bg-white focus:border-primary/10 transition-all font-outfit"
                                    value={receivedAmount}
                                    onChange={(e) => setReceivedAmount(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>

                        {method === 'CASH' && (
                            <div className="p-8 bg-emerald-50 rounded-[32px] border border-emerald-100 flex items-center justify-between animate-in slide-in-from-bottom-4 duration-500 shadow-sm shadow-emerald-100">
                                <div className="flex items-center gap-4 text-emerald-600">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                                        <Banknote size={24} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Cambio a entregar</p>
                                        <p className="text-xs font-bold">Operación en Efectivo</p>
                                    </div>
                                </div>
                                <p className="text-4xl font-black text-emerald-600 tracking-tighter">$ {change.toLocaleString()}</p>
                            </div>
                        )}

                        {method === 'CREDIT' && (
                            <div className="p-8 bg-indigo-50 rounded-[32px] border border-indigo-100 flex items-center gap-5 animate-in slide-in-from-bottom-4 duration-500 shadow-sm shadow-indigo-100">
                                <AlertCircle size={32} className="text-indigo-600 flex-shrink-0" />
                                <div>
                                    <span className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600 block mb-1">Crédito Interno</span>
                                    <p className="text-sm font-medium text-indigo-900/60 leading-tight italic">La transacción se registrará como pendiente de cobro en la cuenta del cliente.</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handlePayment}
                        disabled={isProcessing || (method === 'CASH' && (parseFloat(receivedAmount) || 0) < total)}
                        className={`w-full py-6 rounded-[32px] text-xs font-black uppercase tracking-[0.4em] transition-all duration-500 flex items-center justify-center gap-4 shadow-2xl relative overflow-hidden group ${isProcessing || (method === 'CASH' && (parseFloat(receivedAmount) || 0) < total)
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed shadow-none'
                                : 'bg-secondary text-white shadow-secondary/30 hover:shadow-secondary/50 hover:scale-[1.02] active:scale-[0.98]'
                            }`}
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

                        {isProcessing ? (
                            <>
                                <div className="w-6 h-6 border-3 border-secondary/20 border-t-secondary rounded-full animate-spin" />
                                <span className="animate-pulse">Procesando...</span>
                            </>
                        ) : (
                            <>
                                <span className="relative z-10">Confirmar y Facturar</span>
                                <ArrowRight size={20} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
