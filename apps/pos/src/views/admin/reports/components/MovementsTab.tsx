import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../../../stores/auth.store';
import api from '../../../../api/client';
import { formatCurrency, formatCurrencyShort } from '../../../../utils/currency';
import { TrendingUp, TrendingDown, Scale, Clock } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';

const EXPENSE_COLORS = ['#EE5D50', '#F97316', '#FFB547', '#A855F7', '#EC4899', '#6366F1'];

interface MovementsTabProps {
  from: string;
  to: string;
}

export function MovementsTab({ from, to }: MovementsTabProps) {
  const branchId = useAuthStore((s) => s.user?.branchId);
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

  const { data } = useQuery({
    queryKey: ['report-movements', branchId, from, to],
    queryFn: () =>
      api.get(`/reports/movements?branchId=${branchId}&from=${from}T00:00:00&to=${to}T23:59:59`).then((r) => r.data),
    enabled: !!branchId,
  });

  const totalIncome = data?.totalIncome || '0';
  const totalExpense = data?.totalExpense || '0';
  const balance = data?.balance || '0';
  const balanceNum = parseFloat(balance);

  const chartData = (data?.data || []).map((d: any) => ({
    label: d.label,
    income: parseFloat(d.income),
    expense: parseFloat(d.expense),
  }));

  const categoryData = (data?.byCategory || []).map((c: any) => ({
    name: c.category,
    value: parseFloat(c.total),
  }));

  const recentMovements = data?.recentMovements || [];

  const kpis = [
    { label: 'Total Ingresos', value: formatCurrency(totalIncome), icon: TrendingUp, textColor: 'text-success', bgColor: 'bg-success/10' },
    { label: 'Total Egresos', value: formatCurrency(totalExpense), icon: TrendingDown, textColor: 'text-error', bgColor: 'bg-error/10' },
    { label: 'Balance', value: formatCurrency(balance), icon: Scale, textColor: balanceNum >= 0 ? 'text-success' : 'text-error', bgColor: balanceNum >= 0 ? 'bg-success/10' : 'bg-error/10' },
  ];

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bg-white dark:bg-surface rounded-[24px] p-5 shadow-card flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${kpi.bgColor} ${kpi.textColor}`}>
                <Icon size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-text-secondary uppercase tracking-widest">{kpi.label}</p>
                <p className={`text-2xl font-black tracking-tight ${kpi.textColor}`}>{kpi.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stacked Bar Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-surface rounded-[28px] p-6 shadow-card">
          <h4 className="text-sm font-black text-secondary uppercase tracking-widest mb-4">Ingresos vs Egresos</h4>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.05)' : '#f0f0f0'} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: isDark ? '#94A3B8' : '#A3AED0' }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v) => formatCurrencyShort(v)} tick={{ fontSize: 10, fill: isDark ? '#94A3B8' : '#A3AED0' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value: number, name: string) => [formatCurrency(value), name === 'income' ? 'Ingresos' : 'Egresos']}
                  contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: isDark ? '#1E293B' : '#fff', color: isDark ? '#F1F5F9' : '#1B254B' }}
                />
                <Bar dataKey="income" fill="var(--color-success)" radius={[8, 8, 0, 0]} name="income" />
                <Bar dataKey="expense" fill="var(--color-error)" radius={[8, 8, 0, 0]} name="expense" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState />
          )}
        </div>

        {/* Expense Category Pie */}
        <div className="bg-white dark:bg-surface rounded-[28px] p-6 shadow-card">
          <h4 className="text-sm font-black text-secondary uppercase tracking-widest mb-4">Gastos por Categoría</h4>
          {categoryData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                    {categoryData.map((_: any, i: number) => (
                      <Cell key={i} fill={EXPENSE_COLORS[i % EXPENSE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: isDark ? '#1E293B' : '#fff', color: isDark ? '#F1F5F9' : '#1B254B' }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-3">
                {categoryData.slice(0, 5).map((c: any, i: number) => (
                  <div key={c.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: EXPENSE_COLORS[i % EXPENSE_COLORS.length] }} />
                      <span className="font-bold text-secondary truncate max-w-[120px]">{c.name}</span>
                    </div>
                    <span className="font-black text-error">{formatCurrency(c.value)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <EmptyState />
          )}
        </div>
      </div>

      {/* Recent Movements Table */}
      <div className="bg-white dark:bg-surface rounded-[28px] p-6 shadow-card">
        <h4 className="text-sm font-black text-secondary uppercase tracking-widest mb-4">Movimientos Recientes</h4>
        {recentMovements.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/10">
                  <th className="pb-3 text-[10px] font-black text-text-secondary uppercase tracking-widest">Tipo</th>
                  <th className="pb-3 text-[10px] font-black text-text-secondary uppercase tracking-widest">Descripción</th>
                  <th className="pb-3 text-[10px] font-black text-text-secondary uppercase tracking-widest text-right">Monto</th>
                  <th className="pb-3 text-[10px] font-black text-text-secondary uppercase tracking-widest text-right">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-white/5">
                {recentMovements.map((m: any) => (
                  <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                    <td className="py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                        m.type === 'INCOME' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'
                      }`}>
                        {m.type === 'INCOME' ? 'Ingreso' : 'Egreso'}
                      </span>
                    </td>
                    <td className="py-3 text-xs font-bold text-secondary">{m.description || '—'}</td>
                    <td className={`py-3 text-xs font-black text-right ${m.type === 'INCOME' ? 'text-success' : 'text-error'}`}>
                      {m.type === 'INCOME' ? '+' : '-'}{formatCurrency(m.amount)}
                    </td>
                    <td className="py-3 text-xs font-bold text-text-secondary text-right">
                      {new Date(m.createdAt).toLocaleDateString('es-PY', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
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
      <p className="text-xs font-bold">Sin movimientos</p>
    </div>
  );
}
