export const SocketEvent = {
  // Orders
  ORDER_CREATED: 'order:created',
  ORDER_UPDATED: 'order:updated',
  ORDER_ITEM_STATUS_CHANGED: 'order:item-status-changed',
  ORDER_READY: 'order:ready',

  // Tables
  TABLE_STATUS_CHANGED: 'table:status-changed',
  TABLE_MERGED: 'table:merged',
  TABLE_SPLIT: 'table:split',

  // KDS
  KDS_TICKET_NEW: 'kds:ticket-new',
  KDS_TICKET_UPDATED: 'kds:ticket-updated',
  KDS_TICKET_BUMPED: 'kds:ticket-bumped',

  // Stock
  STOCK_LOW_ALERT: 'stock:low-alert',

  // QR
  QR_ORDER_PLACED: 'qr:order-placed',
  QR_WAITER_CALLED: 'qr:waiter-called',
  QR_BILL_REQUESTED: 'qr:bill-requested',

  // Delivery
  DELIVERY_STATUS_CHANGED: 'delivery:status-changed',

  // Notifications
  NOTIFICATION_WAITER_CALLED: 'notification:waiter-called',
  NOTIFICATION_ORDER_READY: 'notification:order-ready',
  NOTIFICATION_LOW_STOCK: 'notification:low-stock',
} as const;

export type SocketEvent = (typeof SocketEvent)[keyof typeof SocketEvent];
