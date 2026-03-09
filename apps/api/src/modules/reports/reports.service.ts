import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

type GroupBy = 'hour' | 'day' | 'week';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  // ---------------------------------------------------------------------------
  // Sales by Period
  // ---------------------------------------------------------------------------

  /**
   * Return total revenue, order count and average ticket grouped by hour or day.
   */
  async salesByPeriod(
    branchId: string,
    from: Date,
    to: Date,
    groupBy: GroupBy = 'day',
  ) {
    const orders = await this.prisma.order.findMany({
      where: {
        branchId,
        status: 'closed',
        closedAt: { gte: from, lte: to },
      },
      select: {
        id: true,
        total: true,
        subtotal: true,
        discountAmount: true,
        taxAmount: true,
        tipAmount: true,
        closedAt: true,
        orderNumber: true,
      },
      orderBy: { closedAt: 'asc' },
    });

    // Group in memory
    const buckets = new Map<
      string,
      { label: string; revenue: Decimal; orderCount: number }
    >();

    for (const order of orders) {
      if (!order.closedAt) continue;
      const key =
        groupBy === 'hour'
          ? this.hourKey(order.closedAt)
          : groupBy === 'week'
            ? this.weekKey(order.closedAt)
            : this.dayKey(order.closedAt);

      const label =
        groupBy === 'hour'
          ? this.hourLabel(order.closedAt)
          : groupBy === 'week'
            ? this.weekLabel(order.closedAt)
            : this.dayLabel(order.closedAt);

      if (!buckets.has(key)) {
        buckets.set(key, { label, revenue: new Decimal(0), orderCount: 0 });
      }
      const bucket = buckets.get(key)!;
      bucket.revenue = bucket.revenue.add(new Decimal(order.total.toString()));
      bucket.orderCount += 1;
    }

    const results = Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, bucket]) => ({
        key,
        label: bucket.label,
        revenue: bucket.revenue.toFixed(2),
        orderCount: bucket.orderCount,
        averageTicket:
          bucket.orderCount > 0
            ? bucket.revenue.div(bucket.orderCount).toFixed(2)
            : '0.00',
      }));

    const totalRevenue = orders.reduce(
      (sum, o) => sum.add(new Decimal(o.total.toString())),
      new Decimal(0),
    );

    return {
      branchId,
      from,
      to,
      groupBy,
      totalRevenue: totalRevenue.toFixed(2),
      totalOrders: orders.length,
      data: results,
    };
  }

  // ---------------------------------------------------------------------------
  // Sales by Product
  // ---------------------------------------------------------------------------

  /**
   * Return top products ranked by revenue and quantity sold.
   */
  async salesByProduct(branchId: string, from: Date, to: Date) {
    const items = await this.prisma.orderItem.findMany({
      where: {
        order: {
          branchId,
          status: 'closed',
          closedAt: { gte: from, lte: to },
        },
        status: { not: 'cancelled' },
      },
      include: {
        productVariant: { include: { product: true } },
      },
    });

    const productMap = new Map<
      string,
      {
        productId: string;
        productName: string;
        variantName: string;
        variantId: string;
        quantity: number;
        revenue: Decimal;
      }
    >();

    for (const item of items) {
      const key = item.productVariantId;
      if (!productMap.has(key)) {
        productMap.set(key, {
          productId: item.productVariant.productId,
          productName: item.productVariant.product.name,
          variantId: item.productVariantId,
          variantName: item.productVariant.name,
          quantity: 0,
          revenue: new Decimal(0),
        });
      }
      const entry = productMap.get(key)!;
      entry.quantity += item.quantity;
      entry.revenue = entry.revenue.add(
        new Decimal(item.subtotal.toString()),
      );
    }

    const data = Array.from(productMap.values())
      .map((e) => ({
        ...e,
        revenue: e.revenue.toFixed(2),
      }))
      .sort((a, b) => parseFloat(b.revenue) - parseFloat(a.revenue));

    return { branchId, from, to, data };
  }

  // ---------------------------------------------------------------------------
  // Sales by Waiter
  // ---------------------------------------------------------------------------

  async salesByWaiter(branchId: string, from: Date, to: Date) {
    const orders = await this.prisma.order.findMany({
      where: {
        branchId,
        status: 'closed',
        closedAt: { gte: from, lte: to },
        waiterId: { not: null },
      },
      select: {
        waiterId: true,
        waiter: {
          select: { id: true, firstName: true, lastName: true },
        },
        total: true,
        id: true,
      },
    });

    const waiterMap = new Map<
      string,
      {
        waiterId: string;
        firstName: string;
        lastName: string;
        orderCount: number;
        revenue: Decimal;
      }
    >();

    for (const order of orders) {
      if (!order.waiterId || !order.waiter) continue;
      if (!waiterMap.has(order.waiterId)) {
        waiterMap.set(order.waiterId, {
          waiterId: order.waiterId,
          firstName: order.waiter.firstName,
          lastName: order.waiter.lastName,
          orderCount: 0,
          revenue: new Decimal(0),
        });
      }
      const entry = waiterMap.get(order.waiterId)!;
      entry.orderCount += 1;
      entry.revenue = entry.revenue.add(
        new Decimal(order.total.toString()),
      );
    }

    const data = Array.from(waiterMap.values())
      .map((e) => ({
        ...e,
        revenue: e.revenue.toFixed(2),
        averageTicket:
          e.orderCount > 0
            ? e.revenue.div(e.orderCount).toFixed(2)
            : '0.00',
      }))
      .sort((a, b) => parseFloat(b.revenue) - parseFloat(a.revenue));

    return { branchId, from, to, data };
  }

  // ---------------------------------------------------------------------------
  // Sales by Payment Method
  // ---------------------------------------------------------------------------

  async salesByPaymentMethod(branchId: string, from: Date, to: Date) {
    const payments = await this.prisma.payment.findMany({
      where: {
        order: {
          branchId,
          status: 'closed',
          closedAt: { gte: from, lte: to },
        },
        status: 'completed',
      },
      select: {
        method: true,
        amount: true,
      },
    });

    const methodMap = new Map<
      string,
      { method: string; total: Decimal; transactionCount: number }
    >();

    for (const payment of payments) {
      if (!methodMap.has(payment.method)) {
        methodMap.set(payment.method, {
          method: payment.method,
          total: new Decimal(0),
          transactionCount: 0,
        });
      }
      const entry = methodMap.get(payment.method)!;
      entry.total = entry.total.add(
        new Decimal(payment.amount.toString()),
      );
      entry.transactionCount += 1;
    }

    const grandTotal = Array.from(methodMap.values()).reduce(
      (sum, e) => sum.add(e.total),
      new Decimal(0),
    );

    const data = Array.from(methodMap.values())
      .map((e) => ({
        method: e.method,
        total: e.total.toFixed(2),
        transactionCount: e.transactionCount,
        percentage:
          grandTotal.gt(0)
            ? e.total.div(grandTotal).mul(100).toFixed(2)
            : '0.00',
      }))
      .sort((a, b) => parseFloat(b.total) - parseFloat(a.total));

    return {
      branchId,
      from,
      to,
      grandTotal: grandTotal.toFixed(2),
      data,
    };
  }

  // ---------------------------------------------------------------------------
  // Average Prep Time (KDS)
  // ---------------------------------------------------------------------------

  /**
   * Calculate the average time in seconds between KDS ticket creation and completion.
   */
  async averagePrepTime(branchId: string, from: Date, to: Date) {
    const tickets = await this.prisma.kdsTicket.findMany({
      where: {
        order: { branchId },
        completedAt: { not: null },
        createdAt: { gte: from, lte: to },
      },
      include: {
        kitchenStation: { select: { id: true, name: true } },
      },
    });

    const stationMap = new Map<
      string,
      {
        stationId: string;
        stationName: string;
        totalSeconds: number;
        ticketCount: number;
      }
    >();

    let overallSeconds = 0;
    let overallCount = 0;

    for (const ticket of tickets) {
      if (!ticket.completedAt) continue;
      const diffMs =
        ticket.completedAt.getTime() - ticket.createdAt.getTime();
      const diffSec = Math.round(diffMs / 1000);

      overallSeconds += diffSec;
      overallCount += 1;

      const stationId = ticket.kitchenStationId;
      if (!stationMap.has(stationId)) {
        stationMap.set(stationId, {
          stationId,
          stationName: ticket.kitchenStation.name,
          totalSeconds: 0,
          ticketCount: 0,
        });
      }
      const entry = stationMap.get(stationId)!;
      entry.totalSeconds += diffSec;
      entry.ticketCount += 1;
    }

    const byStation = Array.from(stationMap.values()).map((e) => ({
      stationId: e.stationId,
      stationName: e.stationName,
      ticketCount: e.ticketCount,
      averagePrepTimeSeconds:
        e.ticketCount > 0
          ? Math.round(e.totalSeconds / e.ticketCount)
          : 0,
    }));

    return {
      branchId,
      from,
      to,
      totalTickets: overallCount,
      overallAveragePrepTimeSeconds:
        overallCount > 0 ? Math.round(overallSeconds / overallCount) : 0,
      byStation,
    };
  }

  // ---------------------------------------------------------------------------
  // Ingredient Consumption
  // ---------------------------------------------------------------------------

  /**
   * Estimate ingredient consumption based on completed order items and their recipes.
   */
  async ingredientConsumption(branchId: string, from: Date, to: Date) {
    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        order: {
          branchId,
          status: 'closed',
          closedAt: { gte: from, lte: to },
        },
        status: { not: 'cancelled' },
      },
      select: {
        quantity: true,
        productVariant: {
          select: {
            product: {
              select: {
                id: true,
                name: true,
                recipeItems: {
                  include: {
                    ingredient: {
                      select: {
                        id: true,
                        name: true,
                        unit: true,
                        costPerUnit: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const ingredientMap = new Map<
      string,
      {
        ingredientId: string;
        ingredientName: string;
        unit: string;
        totalQuantity: Decimal;
        estimatedCost: Decimal;
      }
    >();

    for (const orderItem of orderItems) {
      const recipeItems =
        orderItem.productVariant.product.recipeItems;

      for (const recipeItem of recipeItems) {
        const consumed = new Decimal(
          recipeItem.quantity.toString(),
        ).mul(orderItem.quantity);

        const ingId = recipeItem.ingredient.id;
        if (!ingredientMap.has(ingId)) {
          ingredientMap.set(ingId, {
            ingredientId: ingId,
            ingredientName: recipeItem.ingredient.name,
            unit: recipeItem.ingredient.unit,
            totalQuantity: new Decimal(0),
            estimatedCost: new Decimal(0),
          });
        }
        const entry = ingredientMap.get(ingId)!;
        entry.totalQuantity = entry.totalQuantity.add(consumed);

        if (recipeItem.ingredient.costPerUnit) {
          entry.estimatedCost = entry.estimatedCost.add(
            consumed.mul(
              new Decimal(
                recipeItem.ingredient.costPerUnit.toString(),
              ),
            ),
          );
        }
      }
    }

    const data = Array.from(ingredientMap.values())
      .map((e) => ({
        ingredientId: e.ingredientId,
        ingredientName: e.ingredientName,
        unit: e.unit,
        totalQuantity: e.totalQuantity.toFixed(4),
        estimatedCost: e.estimatedCost.toFixed(2),
      }))
      .sort(
        (a, b) =>
          parseFloat(b.estimatedCost) - parseFloat(a.estimatedCost),
      );

    return { branchId, from, to, data };
  }

  // ---------------------------------------------------------------------------
  // Daily Summary
  // ---------------------------------------------------------------------------

  /**
   * Build a comprehensive daily report for a given date.
   */
  async dailySummary(branchId: string, date: Date) {
    const from = new Date(date);
    from.setHours(0, 0, 0, 0);
    const to = new Date(date);
    to.setHours(23, 59, 59, 999);

    const [
      salesPeriod,
      salesByProduct,
      salesByWaiter,
      paymentMethods,
      prepTime,
    ] = await Promise.all([
      this.salesByPeriod(branchId, from, to, 'hour'),
      this.salesByProduct(branchId, from, to),
      this.salesByWaiter(branchId, from, to),
      this.salesByPaymentMethod(branchId, from, to),
      this.averagePrepTime(branchId, from, to),
    ]);

    // Count cancelled / voided orders
    const [cancelledCount, voidCount] = await Promise.all([
      this.prisma.order.count({
        where: { branchId, status: 'cancelled', updatedAt: { gte: from, lte: to } },
      }),
      this.prisma.order.count({
        where: { branchId, status: 'void', updatedAt: { gte: from, lte: to } },
      }),
    ]);

    return {
      date: from.toISOString().split('T')[0],
      branchId,
      summary: {
        totalRevenue: salesPeriod.totalRevenue,
        totalOrders: salesPeriod.totalOrders,
        cancelledOrders: cancelledCount,
        voidOrders: voidCount,
        averageTicket:
          salesPeriod.totalOrders > 0
            ? (
                parseFloat(salesPeriod.totalRevenue) /
                salesPeriod.totalOrders
              ).toFixed(2)
            : '0.00',
      },
      salesByHour: salesPeriod.data,
      topProducts: salesByProduct.data.slice(0, 10),
      salesByWaiter: salesByWaiter.data,
      paymentMethods: paymentMethods.data,
      kitchenPerformance: {
        overallAveragePrepTimeSeconds:
          prepTime.overallAveragePrepTimeSeconds,
        byStation: prepTime.byStation,
      },
    };
  }

  // ---------------------------------------------------------------------------
  // Cash Movements (Income / Expense / Balance)
  // ---------------------------------------------------------------------------

  async cashMovements(
    branchId: string,
    from: Date,
    to: Date,
    type?: string,
  ) {
    const movements = await this.prisma.cashRegisterMovement.findMany({
      where: {
        cashRegister: { branchId },
        createdAt: { gte: from, lte: to },
        ...(type && type !== 'all' ? { type } : {}),
      },
      orderBy: { createdAt: 'asc' },
    });

    let totalIncome = new Decimal(0);
    let totalExpense = new Decimal(0);

    const buckets = new Map<string, { label: string; income: Decimal; expense: Decimal }>();
    const categoryMap = new Map<string, { total: Decimal; count: number }>();

    for (const mov of movements) {
      const amount = new Decimal(mov.amount.toString());

      if (mov.type === 'INCOME') {
        totalIncome = totalIncome.add(amount);
      } else {
        totalExpense = totalExpense.add(amount);
      }

      // Group by day
      const key = this.dayKey(mov.createdAt);
      if (!buckets.has(key)) {
        buckets.set(key, { label: key, income: new Decimal(0), expense: new Decimal(0) });
      }
      const bucket = buckets.get(key)!;
      if (mov.type === 'INCOME') {
        bucket.income = bucket.income.add(amount);
      } else {
        bucket.expense = bucket.expense.add(amount);
      }

      // Category breakdown (expenses)
      if (mov.type === 'EXPENSE') {
        const cat = mov.description || 'Sin categoría';
        if (!categoryMap.has(cat)) {
          categoryMap.set(cat, { total: new Decimal(0), count: 0 });
        }
        const entry = categoryMap.get(cat)!;
        entry.total = entry.total.add(amount);
        entry.count += 1;
      }
    }

    const data = Array.from(buckets.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, b]) => ({
        label: b.label,
        income: b.income.toFixed(2),
        expense: b.expense.toFixed(2),
        balance: b.income.sub(b.expense).toFixed(2),
      }));

    const byCategory = Array.from(categoryMap.entries())
      .map(([category, e]) => ({
        category,
        total: e.total.toFixed(2),
        count: e.count,
      }))
      .sort((a, b) => parseFloat(b.total) - parseFloat(a.total));

    return {
      branchId,
      from,
      to,
      totalIncome: totalIncome.toFixed(2),
      totalExpense: totalExpense.toFixed(2),
      balance: totalIncome.sub(totalExpense).toFixed(2),
      data,
      byCategory,
      recentMovements: movements.slice(-20).reverse().map((m) => ({
        id: m.id,
        type: m.type,
        amount: new Decimal(m.amount.toString()).toFixed(2),
        description: m.description,
        createdAt: m.createdAt,
      })),
    };
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private hourKey(date: Date): string {
    return `${date.getFullYear()}-${this.pad(date.getMonth() + 1)}-${this.pad(date.getDate())}T${this.pad(date.getHours())}`;
  }

  private hourLabel(date: Date): string {
    return `${this.pad(date.getHours())}:00`;
  }

  private dayKey(date: Date): string {
    return `${date.getFullYear()}-${this.pad(date.getMonth() + 1)}-${this.pad(date.getDate())}`;
  }

  private dayLabel(date: Date): string {
    return this.dayKey(date);
  }

  private weekKey(date: Date): string {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay() + 1); // Monday
    return `${d.getFullYear()}-W${this.pad(this.getISOWeek(d))}`;
  }

  private weekLabel(date: Date): string {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay() + 1); // Monday start
    const end = new Date(d);
    end.setDate(end.getDate() + 6);
    return `${this.pad(d.getDate())}/${this.pad(d.getMonth() + 1)} - ${this.pad(end.getDate())}/${this.pad(end.getMonth() + 1)}`;
  }

  private getISOWeek(date: Date): number {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    const yearStart = new Date(d.getFullYear(), 0, 4);
    return Math.round(((d.getTime() - yearStart.getTime()) / 86400000 + yearStart.getDay() + 1) / 7);
  }

  private pad(n: number): string {
    return String(n).padStart(2, '0');
  }
}
