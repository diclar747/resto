export const TableStatus = {
  FREE: 'free',
  OCCUPIED: 'occupied',
  WAITING_ORDER: 'waiting_order',
  WAITING_FOOD: 'waiting_food',
  BILL_REQUESTED: 'bill_requested',
  RESERVED: 'reserved',
} as const;

export type TableStatus = (typeof TableStatus)[keyof typeof TableStatus];

export const TableStatusColors: Record<TableStatus, string> = {
  free: '#22c55e',
  occupied: '#ef4444',
  waiting_order: '#f59e0b',
  waiting_food: '#f97316',
  bill_requested: '#3b82f6',
  reserved: '#8b5cf6',
};
