import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

export interface PaymentInput {
  method: string;
  amount: number;
}

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Process a single payment for an order.
   * For cash payments, calculates change if receivedAmount is provided.
   * Also creates a CashRegisterMovement if an open register exists for the order's branch.
   */
  async processPayment(
    orderId: string,
    method: string,
    amount: number,
    receivedAmount?: number,
  ) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    let changeAmount: number | undefined;

    const normalizedMethod = method.toUpperCase();

    if (normalizedMethod === 'CASH' && receivedAmount !== undefined) {
      if (receivedAmount < amount) {
        throw new BadRequestException(
          'Received amount is less than payment amount',
        );
      }
      changeAmount = receivedAmount - amount;
    }

    const payment = await this.prisma.payment.create({
      data: {
        orderId,
        method,
        amount: new Decimal(amount),
        receivedAmount:
          receivedAmount !== undefined ? new Decimal(receivedAmount) : null,
        changeAmount:
          changeAmount !== undefined ? new Decimal(changeAmount) : null,
        status: 'completed',
      },
      include: { order: true },
    });

    // Record movement in open cash register for the branch
    await this._recordCashMovement(
      order.branchId,
      normalizedMethod === 'CASH' ? 'cash_in' : 'payment',
      amount,
      `Payment for order #${order.orderNumber} (${method})`,
      payment.id,
    );

    return payment;
  }

  /**
   * Process multiple payment methods (split payment) for a single order.
   * The sum of all payment amounts must equal the order total.
   */
  async splitPayment(orderId: string, payments: PaymentInput[]) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    const totalPaying = payments.reduce((sum, p) => sum + p.amount, 0);
    const orderTotal = Number(order.total);

    if (Math.abs(totalPaying - orderTotal) > 0.01) {
      throw new BadRequestException(
        `Split payment total (${totalPaying}) does not match order total (${orderTotal})`,
      );
    }

    const createdPayments: Awaited<ReturnType<typeof this.processPayment>>[] =
      [];

    for (const p of payments) {
      const payment = await this.processPayment(orderId, p.method, p.amount);
      createdPayments.push(payment);
    }

    return createdPayments;
  }

  /**
   * Refund a payment fully or partially.
   * Creates a new payment record with status 'refunded' and a negative cash movement.
   */
  async refundPayment(paymentId: string, amount?: number) {
    const original = await this.prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true },
    });
    if (!original) {
      throw new NotFoundException(`Payment ${paymentId} not found`);
    }

    if (original.status === 'refunded') {
      throw new BadRequestException('Payment is already refunded');
    }

    const refundAmount = amount !== undefined ? amount : Number(original.amount);

    if (refundAmount <= 0 || refundAmount > Number(original.amount)) {
      throw new BadRequestException(
        `Refund amount must be between 0 and ${original.amount}`,
      );
    }

    const isFullRefund = refundAmount === Number(original.amount);

    // Mark original as refunded (full) or partially-refunded
    await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: isFullRefund ? 'refunded' : 'partially_refunded' },
    });

    // Create a refund payment record
    const refundPayment = await this.prisma.payment.create({
      data: {
        orderId: original.orderId,
        method: original.method,
        amount: new Decimal(refundAmount),
        status: 'refunded',
        reference: `Refund for payment ${paymentId}`,
      },
      include: { order: true },
    });

    // Record outgoing cash movement
    await this._recordCashMovement(
      original.order.branchId,
      'cash_out',
      refundAmount,
      `Refund for order #${original.order.orderNumber} (payment ${paymentId})`,
      refundPayment.id,
    );

    return refundPayment;
  }

  /**
   * Find all payments for a given order.
   */
  async findByOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }

    return this.prisma.payment.findMany({
      where: { orderId },
      orderBy: { createdAt: 'asc' },
      include: { movements: true },
    });
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  private async _recordCashMovement(
    branchId: string,
    type: string,
    amount: number,
    description: string,
    paymentId: string,
  ) {
    const register = await this.prisma.cashRegister.findFirst({
      where: { branchId, status: 'open' },
      orderBy: { openedAt: 'desc' },
    });

    if (!register) {
      // No open register – skip silently (offline-safe behaviour)
      return;
    }

    await this.prisma.cashRegisterMovement.create({
      data: {
        cashRegisterId: register.id,
        type,
        amount: new Decimal(amount),
        description,
        paymentId,
      },
    });
  }
}
