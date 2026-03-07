import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../stores/auth.store';
import { useCartStore } from '../../stores/cart.store';
import api from '../../api/client';
import toast from 'react-hot-toast';

const statusColors: Record<string, string> = {
  free: 'bg-green-100 border-green-400 text-green-800',
  occupied: 'bg-red-100 border-red-400 text-red-800',
  waiting_order: 'bg-yellow-100 border-yellow-400 text-yellow-800',
  waiting_food: 'bg-orange-100 border-orange-400 text-orange-800',
  bill_requested: 'bg-blue-100 border-blue-400 text-blue-800',
  reserved: 'bg-purple-100 border-purple-400 text-purple-800',
};

const statusLabels: Record<string, string> = {
  free: 'Libre',
  occupied: 'Ocupada',
  waiting_order: 'Esperando pedido',
  waiting_food: 'Esperando comida',
  bill_requested: 'Cuenta pedida',
  reserved: 'Reservada',
};

export function TablesPage() {
  const branchId = useAuthStore((s) => s.user?.branchId);
  const setTable = useCartStore((s) => s.setTable);

  const { data: tables, isLoading } = useQuery({
    queryKey: ['tables', branchId],
    queryFn: () => api.get(`/tables?branchId=${branchId}`).then((r) => r.data),
    enabled: !!branchId,
    refetchInterval: 5000,
  });

  const handleSelectTable = (table: any) => {
    if (table.status === 'free') {
      setTable(table.id);
      toast.success(`Mesa ${table.number} seleccionada`);
    }
  };

  // Group by zone
  const zones = new Map<string, any[]>();
  tables?.forEach((t: any) => {
    const zone = t.zone || 'General';
    if (!zones.has(zone)) zones.set(zone, []);
    zones.get(zone)!.push(t);
  });

  if (isLoading) {
    return <div className="flex items-center justify-center h-full text-gray-400">Cargando mesas...</div>;
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Mesas</h2>
        <div className="flex gap-3">
          {Object.entries(statusLabels).map(([key, label]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded-full border ${statusColors[key]}`} />
              <span className="text-xs text-gray-600">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {Array.from(zones.entries()).map(([zone, zoneTables]) => (
        <div key={zone}>
          <h3 className="text-lg font-semibold text-gray-700 mb-3">{zone}</h3>
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {zoneTables.map((table: any) => (
              <button
                key={table.id}
                onClick={() => handleSelectTable(table)}
                className={`p-4 rounded-xl border-2 transition-all hover:shadow-md ${statusColors[table.status]} ${
                  table.status === 'free' ? 'cursor-pointer hover:scale-105' : 'cursor-default'
                }`}
              >
                <div className="text-2xl font-bold">{table.number}</div>
                <div className="text-xs mt-1">{table.name}</div>
                <div className="text-xs mt-1 font-medium">{statusLabels[table.status]}</div>
                {table.capacity && (
                  <div className="text-xs mt-1 opacity-70">{table.capacity} personas</div>
                )}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
