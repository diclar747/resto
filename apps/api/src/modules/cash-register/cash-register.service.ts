import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class CashRegisterService {
  constructor(private prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // Register lifecycle
  // ---------------------------------------------------------------------------

  /**
   * Open a new cash register for a branch.
   * Throws ConflictException if there is already an open register for that branch.
   */
  async openRegister(
    branchId: string,
    cashierId: string,
    openingBalance: number,
  ) {
    const existing = await this.prisma.cashRegister.findFirst({
      where: { branchId, status: 'open' },
    });

    if (existing) {
      throw new ConflictException(
        `Branch ${branchId} already has an open cash register (id: ${existing.id})`,
      );
    }

    return this.prisma.cashRegister.create({
      data: {
        branchId,
        cashierId,
        openingBalance: new Decimal(openingBalance),
        status: 'open',
      },
      include: { cashier: true, branch: true },
    });
  }

  /**
   * Close an open cash register.
   * Computes the expected closing balance from movements, records the actual
   * balance provided by the cashier, and stores the difference.
   */
  async closeRegister(registerId: string, actualBalance: number) {
    const register = await this.prisma.cashRegister.findUnique({
      where: { id: registerId },
      include: { movements: true },
    });

    if (!register) {
      throw new NotFoundException(`Cash register ${registerId} not found`);
    }

    if (register.status !== 'open') {
      throw new BadRequestException(
        `Cash register ${registerId} is already closed`,
      );
    }

    // Expected balance = opening + all movements
    const movementsTotal = register.movements.reduce((sum: number, m: any) => {
      const amt = Number(m.amount);
      // cash_in / payment increase balance; cash_out decreases it
      const signed =
        m.type === 'cash_out' || m.type === 'expense' ? -amt : amt;
      return sum + signed;
    }, 0);

    const closingBalance = Number(register.openingBalance) + movementsTotal;
    const difference = actualBalance - closingBalance;

    return this.prisma.cashRegister.update({
      where: { id: registerId },
      data: {
        status: 'closed',
        closedAt: new Date(),
        closingBalance: new Decimal(closingBalance),
        actualBalance: new Decimal(actualBalance),
        difference: new Decimal(difference),
      },
      include: { cashier: true, branch: true, movements: true },
    });
  }

  /**
   * Find the currently open register for a branch.
   */
  async getCurrentRegister(branchId: string) {
    const register = await this.prisma.cashRegister.findFirst({
      where: { branchId, status: 'open' },
      orderBy: { openedAt: 'desc' },
      include: { cashier: true, branch: true },
    });

    if (!register) {
      throw new NotFoundException(
        `No open cash register found for branch ${branchId}`,
      );
    }

    return register;
  }

  // ---------------------------------------------------------------------------
  // Movements
  // ---------------------------------------------------------------------------

  /**
   * Add a manual movement (cash_in, cash_out, expense, tip, etc.) to a register.
   */
  async addMovement(
    registerId: string,
    type: string,
    amount: number,
    description?: string,
    paymentId?: string,
  ) {
    const register = await this.prisma.cashRegister.findUnique({
      where: { id: registerId },
    });

    if (!register) {
      throw new NotFoundException(`Cash register ${registerId} not found`);
    }

    if (register.status !== 'open') {
      throw new BadRequestException(
        `Cannot add movement to a closed register (${registerId})`,
      );
    }

    return this.prisma.cashRegisterMovement.create({
      data: {
        cashRegisterId: registerId,
        type,
        amount: new Decimal(amount),
        description,
        paymentId: paymentId ?? null,
      },
      include: { payment: true },
    });
  }

  /**
   * Get all movements for a register, ordered chronologically.
   */
  async getMovements(registerId: string) {
    const register = await this.prisma.cashRegister.findUnique({
      where: { id: registerId },
    });

    if (!register) {
      throw new NotFoundException(`Cash register ${registerId} not found`);
    }

    return this.prisma.cashRegisterMovement.findMany({
      where: { cashRegisterId: registerId },
      orderBy: { createdAt: 'asc' },
      include: { payment: true },
    });
  }

  // ---------------------------------------------------------------------------
  // Daily summary
  // ---------------------------------------------------------------------------

  /**
   * Build a daily summary for a branch.
   * Returns totals per payment method, tip totals, and cash in/out.
   */
  async getDailySummary(branchId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // All payments for completed orders in this branch on this date
    const payments = await this.prisma.payment.findMany({
      where: {
        order: {
          branchId,
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
        status: { in: ['completed', 'partially_refunded'] },
      },
      include: { order: { select: { tipAmount: true } } },
    });

    // Aggregate by payment method
    const byMethod: Record<string, number> = {};
    let totalTips = 0;
    let totalRevenue = 0;

    for (const p of payments) {
      const method = p.method;
      const amt = Number(p.amount);
      byMethod[method] = (byMethod[method] ?? 0) + amt;
      totalRevenue += amt;
    }

    // Unique orders to avoid double-counting tips
    const tipsByOrder = new Map<string, number>();
    for (const p of payments) {
      if (!tipsByOrder.has(p.orderId)) {
        tipsByOrder.set(p.orderId, Number(p.order.tipAmount));
      }
    }
    for (const tip of tipsByOrder.values()) {
      totalTips += tip;
    }

    // Cash register movements for the period
    const registers = await this.prisma.cashRegister.findMany({
      where: {
        branchId,
        openedAt: { lte: endOfDay },
        OR: [{ closedAt: null }, { closedAt: { gte: startOfDay } }],
      },
      select: { id: true },
    });
    const registerIds = registers.map((r: any) => r.id);

    const movements = await this.prisma.cashRegisterMovement.findMany({
      where: {
        cashRegisterId: { in: registerIds },
        createdAt: { gte: startOfDay, lte: endOfDay },
      },
    });

    let cashIn = 0;
    let cashOut = 0;
    let totalExpenses = 0;

    for (const m of movements) {
      const amt = Number(m.amount);
      if (m.type === 'cash_in' || m.type === 'payment') {
        cashIn += amt;
      } else if (m.type === 'cash_out') {
        cashOut += amt;
      } else if (m.type === 'expense') {
        totalExpenses += amt;
        cashOut += amt;
      }
    }

    const refunds = await this.prisma.payment.findMany({
      where: {
        order: { branchId },
        status: 'refunded',
        createdAt: { gte: startOfDay, lte: endOfDay },
      },
    });

    const totalRefunds = refunds.reduce(
      (sum: number, p: any) => sum + Number(p.amount),
      0,
    );

    return {
      date: startOfDay.toISOString().slice(0, 10),
      branchId,
      totalRevenue,
      totalTips,
      totalRefunds,
      netRevenue: totalRevenue - totalRefunds,
      byPaymentMethod: byMethod,
      cashMovements: {
        cashIn,
        cashOut,
        net: cashIn - cashOut,
      },
      totalExpenses,
    };
  }
}
