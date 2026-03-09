import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../stores/auth.store';
import api from '../../../api/client';
import { TrendingUp, Wallet, ShoppingBag, Clock } from 'lucide-react';
import { DateRangeFilter } from './components/DateRangeFilter';
import { ExportButton } from './components/ExportButton';
import { SalesTab } from './components/SalesTab';
import { MovementsTab } from './components/MovementsTab';
import { ProductsTab } from './components/ProductsTab';
import { OperationsTab } from './components/OperationsTab';

type TabId = 'sales' | 'movements' | 'products' | 'operations';

const tabs: { id: TabId; label: string; icon: any }[] = [
  { id: 'sales', label: 'Ventas', icon: TrendingUp },
  { id: 'movements', label: 'Movimientos', icon: Wallet },
  { id: 'products', label: 'Productos', icon: ShoppingBag },
  { id: 'operations', label: 'Operaciones', icon: Clock },
];

export function ReportsPage() {
  const branchId = useAuthStore((s) => s.user?.branchId);
  const today = new Date().toISOString().split('T')[0];
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

  const [activeTab, setActiveTab] = useState<TabId>('sales');
  const [from, setFrom] = useState(weekAgo);
  const [to, setTo] = useState(today);
  const [groupBy, setGroupBy] = useState<'day' | 'week'>('day');

  // Fetch data for export (shared queries)
  const { data: salesData } = useQuery({
    queryKey: ['export-sales', branchId, from, to],
    queryFn: () => api.get(`/reports/sales?branchId=${branchId}&from=${from}T00:00:00&to=${to}T23:59:59&groupBy=day`).then((r) => r.data),
    enabled: !!branchId,
  });

  const { data: paymentData } = useQuery({
    queryKey: ['export-payments', branchId, from, to],
    queryFn: () => api.get(`/reports/payment-methods?branchId=${branchId}&from=${from}T00:00:00&to=${to}T23:59:59`).then((r) => r.data),
    enabled: !!branchId,
  });

  const { data: productData } = useQuery({
    queryKey: ['export-products', branchId, from, to],
    queryFn: () => api.get(`/reports/products?branchId=${branchId}&from=${from}T00:00:00&to=${to}T23:59:59`).then((r) => r.data),
    enabled: !!branchId,
  });

  const { data: movementsData } = useQuery({
    queryKey: ['export-movements', branchId, from, to],
    queryFn: () => api.get(`/reports/movements?branchId=${branchId}&from=${from}T00:00:00&to=${to}T23:59:59`).then((r) => r.data),
    enabled: !!branchId,
  });

  return (
    <div className="p-4 md:p-8 space-y-6 bg-background min-h-full">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-secondary tracking-tight">Estadísticas</h1>
            <p className="text-text-secondary font-medium mt-1 text-sm">Análisis completo de rendimiento y movimientos</p>
          </div>
          <ExportButton data={{ salesData, paymentData, productData, movementsData, from, to }} />
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-3">
          <DateRangeFilter from={from} to={to} onChange={(f, t) => { setFrom(f); setTo(t); }} />

          {activeTab === 'sales' && (
            <div className="flex p-1 bg-white/50 dark:bg-white/5 rounded-xl border border-white dark:border-white/10">
              <button
                onClick={() => setGroupBy('day')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${groupBy === 'day' ? 'bg-secondary text-white' : 'text-text-secondary'}`}
              >
                Por Día
              </button>
              <button
                onClick={() => setGroupBy('week')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${groupBy === 'week' ? 'bg-secondary text-white' : 'text-text-secondary'}`}
              >
                Por Semana
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-white/50 dark:bg-white/5 backdrop-blur-sm rounded-2xl border border-white dark:border-white/10 w-fit">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 md:px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all duration-300 ${
              activeTab === id
                ? 'bg-primary text-white shadow-lg'
                : 'text-text-secondary hover:text-primary'
            }`}
          >
            <Icon size={15} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'sales' && <SalesTab from={from} to={to} groupBy={groupBy} />}
        {activeTab === 'movements' && <MovementsTab from={from} to={to} />}
        {activeTab === 'products' && <ProductsTab from={from} to={to} />}
        {activeTab === 'operations' && <OperationsTab from={from} to={to} />}
      </div>
    </div>
  );
}
