import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../../stores/auth.store';
import api from '../../../../api/client';
import { formatCurrency } from '../../../../utils/currency';
import { Clock } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';

interface ProductsTabProps {
  from: string;
  to: string;
}

export function ProductsTab({ from, to }: ProductsTabProps) {
  const branchId = useAuthStore((s) => s.user?.branchId);
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

  const { data } = useQuery({
    queryKey: ['report-products', branchId, from, to],
    queryFn: () =>
      api.get(`/reports/products?branchId=${branchId}&from=${from}T00:00:00&to=${to}T23:59:59`).then((r) => r.data),
    enabled: !!branchId,
  });

  const products = data?.data || [];
  const top10 = products.slice(0, 10).map((p: any) => ({
    name: p.productName.length > 15 ? p.productName.slice(0, 15) + '…' : p.productName,
    fullName: p.productName,
    revenue: parseFloat(p.revenue),
    quantity: p.quantity,
  }));

  return (
    <div className="space-y-6">
      {/* Horizontal Bar Chart */}
      <div className="bg-white dark:bg-surface rounded-[28px] p-6 shadow-card">
        <h4 className="text-sm font-black text-secondary uppercase tracking-widest mb-4">Top 10 Productos por Ingresos</h4>
        {top10.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={top10} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.05)' : '#f0f0f0'} />
              <XAxis type="number" tickFormatter={(v) => formatCurrency(v)} tick={{ fontSize: 10, fill: isDark ? '#94A3B8' : '#A3AED0' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: isDark ? '#94A3B8' : '#A3AED0' }} axisLine={false} tickLine={false} width={120} />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), 'Ingresos']}
                contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: isDark ? '#1E293B' : '#fff', color: isDark ? '#F1F5F9' : '#1B254B' }}
              />
              <Bar dataKey="revenue" fill="var(--color-primary)" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyState />
        )}
      </div>

      {/* Full Table */}
      <div className="bg-white dark:bg-surface rounded-[28px] p-6 shadow-card">
        <h4 className="text-sm font-black text-secondary uppercase tracking-widest mb-4">Ranking Completo</h4>
        {products.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/10">
                  <th className="pb-3 text-[10px] font-black text-text-secondary uppercase tracking-widest w-12">#</th>
                  <th className="pb-3 text-[10px] font-black text-text-secondary uppercase tracking-widest">Producto</th>
                  <th className="pb-3 text-[10px] font-black text-text-secondary uppercase tracking-widest">Variante</th>
                  <th className="pb-3 text-[10px] font-black text-text-secondary uppercase tracking-widest text-right">Cantidad</th>
                  <th className="pb-3 text-[10px] font-black text-text-secondary uppercase tracking-widest text-right">Ingresos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                {products.map((p: any, i: number) => (
                  <tr key={p.variantId} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="py-3 text-xs font-black text-text-secondary">{String(i + 1).padStart(2, '0')}</td>
                    <td className="py-3 text-xs font-black text-secondary">{p.productName}</td>
                    <td className="py-3 text-xs font-bold text-text-secondary">{p.variantName}</td>
                    <td className="py-3 text-xs font-black text-secondary text-right">{p.quantity}</td>
                    <td className="py-3 text-xs font-black text-primary text-right">{formatCurrency(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-[200px] text-text-secondary opacity-40 space-y-2">
      <Clock size={32} />
      <p className="text-xs font-bold">Sin datos de productos</p>
    </div>
  );
}
