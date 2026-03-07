export const KdsTicketStatus = {
  PENDING: 'pending',
  PREPARING: 'preparing',
  READY: 'ready',
  DELIVERED: 'delivered',
  BUMPED: 'bumped',
} as const;

export type KdsTicketStatus = (typeof KdsTicketStatus)[keyof typeof KdsTicketStatus];
