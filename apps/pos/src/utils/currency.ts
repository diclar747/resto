/**
 * Formatea un monto en Guaraní paraguayo (₲).
 * Sin decimales, separador de miles con punto.
 * Ejemplo: formatCurrency(15000) → "₲ 15.000"
 */
export function formatCurrency(amount: number | string): string {
  const n = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(n)) return '₲ 0';
  return `₲ ${Math.round(n).toLocaleString('es-PY')}`;
}

/**
 * Formatea un monto corto para ejes de gráficos.
 * Ejemplo: formatCurrencyShort(1500000) → "₲1.5M"
 */
export function formatCurrencyShort(amount: number): string {
  if (amount >= 1_000_000) return `₲${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `₲${(amount / 1_000).toFixed(0)}k`;
  return `₲${Math.round(amount)}`;
}
