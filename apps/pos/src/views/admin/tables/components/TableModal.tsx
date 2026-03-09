import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../../api/client';
import { useAuthStore } from '../../../../stores/auth.store';
import toast from 'react-hot-toast';
import { X, Save, QrCode as QrCodeIcon, Printer } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export function TableModal({ table, onClose }: { table?: any; onClose: () => void }) {
    const branchId = useAuthStore((s) => s.user?.branchId);
    const queryClient = useQueryClient();

    const [form, setForm] = useState({
        number: '',
        capacity: '4',
        zone: 'General'
    });

    useEffect(() => {
        if (table) {
            setForm({
                number: table.number.toString(),
                capacity: (table.capacity || 4).toString(),
                zone: table.zone || 'General'
            });
        }
    }, [table]);

    const saveMutation = useMutation({
        mutationFn: (data: any) => {
            if (table?.id) {
                return api.patch(`/tables/${table.id}`, data);
            }
            return api.post('/tables', { ...data, branchId });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-tables'] });
            toast.success(table ? 'Mesa actualizada' : 'Mesa creada exitosamente');
            onClose();
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Error al guardar la mesa');
        }
    });

    const generateQrMutation = useMutation({
        mutationFn: () => api.post(`/tables/${table.id}/qr-code`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-tables'] });
            toast.success('Código QR generado');
        },
        onError: () => toast.error('Error al generar QR')
    });

    const handlePrintQr = () => {
        const printContent = document.getElementById('qr-print-area');
        if (!printContent) return;

        const windowPrint = window.open('', '', 'width=800,height=600');
        if (!windowPrint) return;

        windowPrint.document.write(`
            <html>
                <head>
                    <title>Mesa ${form.number} - QR</title>
                    <style>
                        body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; font-family: sans-serif; text-align: center; }
                        h1 { font-size: 24px; margin-bottom: 20px; }
                        .qr-container { padding: 40px; border: 2px dashed #ccc; border-radius: 20px; }
                    </style>
                </head>
                <body>
                    <div class="qr-container">
                        <h1>Mesa ${form.number}</h1>
                        ${printContent.innerHTML}
                        <p style="margin-top: 20px; color: #666;">Escanea para ver el menú</p>
                    </div>
                </body>
            </html>
        `);

        windowPrint.document.close();
        windowPrint.focus();
        setTimeout(() => {
            windowPrint.print();
            windowPrint.close();
        }, 250);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const data = {
            number: parseInt(form.number),
            capacity: parseInt(form.capacity),
            zone: form.zone
        };
        if (isNaN(data.number) || isNaN(data.capacity)) {
            toast.error('Número y capacidad deben ser numéricos');
            return;
        }
        saveMutation.mutate(data);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-secondary/40 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-md bg-white dark:bg-surface rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-gray-50 dark:border-white/5 flex items-center justify-between">
                    <h2 className="text-xl font-black text-secondary tracking-tight">
                        {table ? 'Editar Mesa' : 'Nueva Mesa'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/10 flex items-center justify-center text-gray-400 dark:text-white/40 hover:text-secondary hover:bg-gray-200 dark:hover:bg-white/20 transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Número de Mesa</label>
                        <input
                            type="number"
                            value={form.number}
                            onChange={(e) => setForm({ ...form, number: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 text-sm font-bold"
                            placeholder="Ej: 1"
                            required
                            min="1"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Capacidad (Asientos)</label>
                        <input
                            type="number"
                            value={form.capacity}
                            onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 text-sm font-bold"
                            placeholder="Ej: 4"
                            required
                            min="1"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest">Zona (Opcional)</label>
                        <input
                            type="text"
                            value={form.zone}
                            onChange={(e) => setForm({ ...form, zone: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl focus:outline-none focus:ring-4 focus:ring-primary/10 text-sm font-bold"
                            placeholder="Ej: Terraza, Salón VIP..."
                        />
                    </div>

                    {/* QR Code Section - Only for existing tables */}
                    {table?.id && (
                        <div className="pt-2 border-t border-gray-100 dark:border-white/10">
                            <label className="text-[10px] font-black text-text-secondary uppercase tracking-widest mb-3 block">Código QR (Menú Digital)</label>

                            {table.qrCode ? (
                                <div className="flex flex-col items-center p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10">
                                    <div id="qr-print-area" className="bg-white p-4 rounded-xl shadow-sm mb-4">
                                        <QRCodeSVG
                                            value={`${window.location.origin}/qr?t=${table.qrCode}`}
                                            size={140}
                                            level="H"
                                            includeMargin={false}
                                        />
                                    </div>
                                    <div className="flex gap-2 w-full">
                                        <button
                                            type="button"
                                            onClick={handlePrintQr}
                                            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-white dark:bg-surface border border-gray-200 dark:border-white/10 text-secondary rounded-xl font-bold text-xs hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
                                        >
                                            <Printer size={16} /> Imprimir QR
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => generateQrMutation.mutate()}
                                            disabled={generateQrMutation.isPending}
                                            className="flex-1 flex items-center justify-center gap-2 py-2 px-4 bg-primary/10 text-primary rounded-xl font-bold text-xs hover:bg-primary/20 transition-all"
                                        >
                                            <QrCodeIcon size={16} /> Regenerar
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => generateQrMutation.mutate()}
                                    disabled={generateQrMutation.isPending}
                                    className="w-full flex items-center justify-center gap-2 py-4 border-2 border-dashed border-primary/30 text-primary rounded-2xl font-bold text-sm bg-primary/5 hover:bg-primary/10 transition-all"
                                >
                                    <QrCodeIcon size={18} />
                                    {generateQrMutation.isPending ? 'Generando...' : 'Generar QR para Mesa'}
                                </button>
                            )}
                        </div>
                    )}

                    <div className="pt-4 mt-2">
                        <button
                            type="submit"
                            disabled={saveMutation.isPending}
                            className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                        >
                            <Save size={16} />
                            {saveMutation.isPending ? 'Guardando...' : 'Guardar Mesa'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
