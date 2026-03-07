export const PaymentMethod = {
  CASH: 'cash',
  CARD: 'card',
  TRANSFER: 'transfer',
  QR_PAYMENT: 'qr_payment',
} as const;

export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];
