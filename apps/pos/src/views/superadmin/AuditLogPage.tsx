import { useState } from 'react';
import { FileText, Search, Filter, ChevronDown, ChevronRight, Clock } from 'lucide-react';

// TODO: Replace with api.get('/audit-logs') when endpoint is available
const mockAuditLogs = [
  { id: '1', userId: 'u1', userName: 'Admin Principal', action: 'CREATE', entity: 'Product', entityId: 'p1', description: 'Creó producto "Hamburguesa Clásica"', createdAt: new Date(Date.now() - 1800000).toISOString() },
  { id: '2', userId: 'u2', userName: 'Gerente López', action: 'UPDATE', entity: 'Order', entityId: 'o1', description: 'Actualizó estado de pedido #1042 a "completado"', createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: '3', userId: 'u1', userName: 'Admin Principal', action: 'DELETE', entity: 'Category', entityId: 'c1', description: 'Eliminó categoría "Temporada"', createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: '4', userId: 'u3', userName: 'Cajero Martínez', action: 'CREATE', entity: 'CashRegister', entityId: 'cr1', description: 'Abrió caja con saldo inicial $5,000', createdAt: new Date(Date.now() - 10800000).toISOString() },
  { id: '5', userId: 'u1', userName: 'Admin Principal', action: 'UPDATE', entity: 'User', entityId: 'u4', description: 'Actualizó permisos de "Camarero García"', createdAt: new Date(Date.now() - 14400000).toISOString() },
  { id: '6', userId: 'u2', userName: 'Gerente López', action: 'UPDATE', entity: 'Branch', entityId: 'b1', description: 'Actualizó horario de la sucursal "Centro"', createdAt: new Date(Date.now() - 18000000).toISOString() },
  { id: '7', userId: 'u1', userName: 'Admin Principal', action: 'CREATE', entity: 'Promotion', entityId: 'pr1', description: 'Creó promoción "2x1 Martes"', createdAt: new Date(Date.now() - 43200000).toISOString() },
  { id: '8', userId: 'u3', userName: 'Cajero Martínez', action: 'UPDATE', entity: 'CashRegister', entityId: 'cr1', description: 'Cerró caja con saldo final $28,450', createdAt: new Date(Date.now() - 50400000).toISOString() },
  { id: '9', userId: 'u1', userName: 'Admin Principal', action: 'CREATE', entity: 'User', entityId: 'u5', description: 'Registró nuevo usuario "Delivery Rodríguez"', createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: '10', userId: 'u2', userName: 'Gerente López', action: 'UPDATE', entity: 'StockItem', entityId: 's1', description: 'Ajustó inventario de "Queso Mozzarella" (-5kg)', createdAt: new Date(Date.now() - 90000000).toISOString() },
];

const actionColors: Record<string, string> = {
  CREATE: 'bg-emerald-100 text-emerald-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-rose-100 text-rose-700',
  LOGIN: 'bg-purple-100 text-purple-700',
};

const actionLabels: Record<string, string> = {
  CREATE: 'Crear',
  UPDATE: 'Actualizar',
  DELETE: 'Eliminar',
  LOGIN: 'Acceso',
};

export function AuditLogPage() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = mockAuditLogs.filter((log) => {
    const matchesSearch = log.userName.toLowerCase().includes(search.toLowerCase()) ||
      log.description.toLowerCase().includes(search.toLowerCase()) ||
      log.entity.toLowerCase().includes(search.toLowerCase());
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    const now = Date.now();
    const diff = now - date.getTime();
    if (diff < 3600000) return `Hace ${Math.floor(diff / 60000)} min`;
    if (diff < 86400000) return `Hace ${Math.floor(diff / 3600000)} horas`;
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-8 space-y-8 bg-background min-h-full">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-secondary tracking-tight">Auditoría</h1>
        <p className="text-text-secondary font-medium mt-1">Registro de actividad del sistema</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por usuario, acción o entidad..."
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-surface border border-gray-100 dark:border-white/10 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600/20 transition-all text-sm font-medium"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400 dark:text-white/40" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-4 py-3 bg-white dark:bg-surface border border-gray-100 dark:border-white/10 rounded-2xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-indigo-600/10"
          >
            <option value="all">Todas las acciones</option>
            <option value="CREATE">Creaciones</option>
            <option value="UPDATE">Actualizaciones</option>
            <option value="DELETE">Eliminaciones</option>
          </select>
        </div>
      </div>

      {/* Audit Log List */}
      <div className="bg-white dark:bg-surface rounded-[32px] shadow-card overflow-hidden">
        <div className="divide-y divide-gray-50 dark:divide-white/5">
          {filtered.map((log) => (
            <div key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
              <button
                onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                className="w-full flex items-center gap-4 px-8 py-5 text-left"
              >
                {expandedId === log.id
                  ? <ChevronDown size={16} className="text-gray-400 dark:text-white/40 shrink-0" />
                  : <ChevronRight size={16} className="text-gray-400 dark:text-white/40 shrink-0" />
                }
                <div className="flex-1 min-w-0 flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shrink-0 ${actionColors[log.action] || 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/60'}`}>
                    {actionLabels[log.action] || log.action}
                  </span>
                  <span className="text-sm font-bold text-secondary truncate">{log.description}</span>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-xs font-bold text-text-secondary">{log.userName}</span>
                  <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest flex items-center gap-1">
                    <Clock size={12} /> {formatTime(log.createdAt)}
                  </span>
                </div>
              </button>

              {expandedId === log.id && (
                <div className="px-16 pb-5 space-y-2">
                  <div className="bg-gray-50 dark:bg-white/5 rounded-2xl p-4 text-xs space-y-2">
                    <div className="flex gap-8">
                      <div>
                        <span className="font-black text-text-secondary uppercase tracking-widest">Entidad</span>
                        <p className="font-bold text-secondary mt-0.5">{log.entity}</p>
                      </div>
                      <div>
                        <span className="font-black text-text-secondary uppercase tracking-widest">ID</span>
                        <p className="font-mono font-bold text-secondary mt-0.5">{log.entityId}</p>
                      </div>
                      <div>
                        <span className="font-black text-text-secondary uppercase tracking-widest">Usuario ID</span>
                        <p className="font-mono font-bold text-secondary mt-0.5">{log.userId}</p>
                      </div>
                      <div>
                        <span className="font-black text-text-secondary uppercase tracking-widest">Fecha Exacta</span>
                        <p className="font-bold text-secondary mt-0.5">{new Date(log.createdAt).toLocaleString('es-AR')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
              <FileText className="text-gray-200 dark:text-white/15" size={48} />
              <p className="text-sm font-medium text-text-secondary">No se encontraron registros</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
