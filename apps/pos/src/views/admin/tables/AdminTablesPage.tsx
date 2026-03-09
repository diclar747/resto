import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../api/client';
import { useAuthStore } from '../../../stores/auth.store';
import toast from 'react-hot-toast';
import {
    Plus, Edit2, Trash2, Users, LayoutGrid, Loader2
} from 'lucide-react';
import { TableModal } from './components/TableModal';

export function AdminTablesPage() {
    const branchId = useAuthStore((s) => s.user?.branchId);
    const queryClient = useQueryClient();
    const [selectedZone, setSelectedZone] = useState<string>('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTable, setEditingTable] = useState<any>(null);

    const { data: tables, isLoading } = useQuery({
        queryKey: ['admin-tables', branchId],
        queryFn: () => api.get(`/tables?branchId=${branchId}`).then((r) => r.data),
        enabled: !!branchId,
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/tables/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-tables'] });
            toast.success('Mesa eliminada correctamente');
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || 'Error al eliminar la mesa');
        }
    });

    const handleDelete = (table: any) => {
        if (table.status !== 'free' && table.status !== 'reserved') {
            toast.error('No se puede eliminar una mesa ocupada');
            return;
        }
        if (confirm(`¿Seguro que deseas eliminar la Mesa ${table.number}?`)) {
            deleteMutation.mutate(table.id);
        }
    };

    const handleEdit = (table: any) => {
        setEditingTable(table);
        setIsModalOpen(true);
    };

    const zones = ['all', ...Array.from(new Set(tables?.map((t: any) => t.zone || 'General') || []))] as string[];
    const filteredTables = selectedZone === 'all'
        ? tables
        : tables?.filter((t: any) => (t.zone || 'General') === selectedZone);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
                <Loader2 className="animate-spin text-primary" size={32} />
                <p className="text-xs font-black text-secondary uppercase tracking-widest">Cargando mesas...</p>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl md:text-3xl font-black text-secondary tracking-tight">Gestión de Mesas</h1>
                    <p className="text-text-secondary font-medium mt-1">Administra el plano y capacidad del restaurante</p>
                </div>
                <button
                    onClick={() => { setEditingTable(null); setIsModalOpen(true); }}
                    className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 transition-all w-full md:w-auto justify-center"
                >
                    <Plus size={16} /> Agregar Mesa
                </button>
            </div>

            {/* Filters */}
            <div className="flex p-1 w-max bg-white dark:bg-surface rounded-2xl shadow-sm border border-gray-100 dark:border-white/10 overflow-x-auto">
                {zones.map((zone: string) => (
                    <button
                        key={zone}
                        onClick={() => setSelectedZone(zone)}
                        className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedZone === zone
                                ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                : 'text-text-secondary hover:text-primary'
                            }`}
                    >
                        {zone === 'all' ? 'Todas' : zone}
                    </button>
                ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredTables?.map((table: any) => (
                    <div key={table.id} className="bg-white dark:bg-surface rounded-[24px] p-5 shadow-sm border border-gray-50 dark:border-white/5 flex flex-col justify-between group hover:shadow-lg transition-all">
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                                <LayoutGrid size={24} />
                            </div>
                            <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                                <button
                                    onClick={() => handleEdit(table)}
                                    className="p-2 text-text-secondary hover:text-primary hover:bg-primary/10 rounded-xl transition-colors"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(table)}
                                    className="p-2 text-text-secondary hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-black text-secondary tracking-tight">Mesa {table.number}</h3>
                            <div className="flex items-center gap-3 mt-2">
                                <div className="flex items-center gap-1 text-[10px] font-bold text-text-secondary uppercase tracking-widest">
                                    <Users size={12} /> {table.capacity} asientos
                                </div>
                                <div className="px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-white/10 text-[10px] font-bold text-text-secondary uppercase tracking-widest">
                                    {table.zone || 'General'}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                {filteredTables.length === 0 && (
                    <div className="col-span-full py-12 text-center text-text-secondary font-medium">
                        No se encontraron mesas en esta zona.
                    </div>
                )}
            </div>

            {isModalOpen && (
                <TableModal
                    table={editingTable}
                    onClose={() => {
                        setIsModalOpen(false);
                        setEditingTable(null);
                    }}
                />
            )}
        </div>
    );
}
