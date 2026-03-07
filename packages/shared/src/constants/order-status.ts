export const OrderStatus = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  READY: 'ready',
  DELIVERED: 'delivered',
  CLOSED: 'closed',
  CANCELLED: 'cancelled',
  VOID: 'void',
} as const;

export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const OrderItemStatus = {
  PENDING: 'pending',
  SENT_TO_KITCHEN: 'sent_to_kitchen',
  PREPARING: 'preparing',
  READY: 'ready',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
} as const;

export type OrderItemStatus = (typeof OrderItemStatus)[keyof typeof OrderItemStatus];

export const OrderType = {
  DINE_IN: 'dine_in',
  TAKEAWAY: 'takeaway',
  DELIVERY: 'delivery',
  QR_SELF_ORDER: 'qr_self_order',
} as const;

export type OrderType = (typeof OrderType)[keyof typeof OrderType];
