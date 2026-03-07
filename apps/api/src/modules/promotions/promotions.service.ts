import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

// Shape of a single order line used in evaluateForOrder
export interface OrderItemInput {
  productVariantId: string;
  quantity: number;
  unitPrice: number;
}

@Injectable()
export class PromotionsService {
  constructor(private prisma: PrismaService) {}

  // ----------------------------------------------------------------
  // CRUD
  // ----------------------------------------------------------------

  async findAll(branchId?: string) {
    const where: Prisma.PromotionWhereInput = { isActive: true };

    if (branchId) {
      where.branches = { some: { branchId } };
    }

    return this.prisma.promotion.findMany({
      where,
      include: {
        branches: {
          include: { branch: { select: { id: true, name: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findActive(branchId: string) {
    const now = new Date();
    const currentDayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday

    // Pad hours/minutes for time comparison (HH:mm string)
    const currentTimeStr = now
      .toTimeString()
      .slice(0, 5); // "HH:MM"

    const promotions = await this.prisma.promotion.findMany({
      where: {
        isActive: true,
        branches: { some: { branchId } },
        OR: [
          { startDate: null },
          { startDate: { lte: now } },
        ],
        AND: [
          {
            OR: [
              { endDate: null },
              { endDate: { gte: now } },
            ],
          },
        ],
      },
      include: {
        branches: {
          include: { branch: { select: { id: true, name: true } } },
        },
      },
    });

    // Filter by time-of-day and day-of-week in application layer
    return promotions.filter((promo) => {
      // Day-of-week check: empty array means all days
      if (promo.daysOfWeek && promo.daysOfWeek.length > 0) {
        if (!promo.daysOfWeek.includes(currentDayOfWeek)) return false;
      }

      // Time range check
      if (promo.startTime && currentTimeStr < promo.startTime) return false;
      if (promo.endTime && currentTimeStr > promo.endTime) return false;

      return true;
    });
  }

  async findById(id: string) {
    const promotion = await this.prisma.promotion.findUnique({
      where: { id },
      include: {
        branches: {
          include: { branch: { select: { id: true, name: true } } },
        },
        _count: { select: { orders: true } },
      },
    });

    if (!promotion) throw new NotFoundException(`Promotion ${id} not found`);
    return promotion;
  }

  async create(data: {
    name: string;
    description?: string;
    type: string;
    discountValue?: number;
    conditions?: Record<string, unknown>;
    startDate?: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
    daysOfWeek?: number[];
    isAutomatic?: boolean;
    branchIds?: string[];
  }) {
    const {
      branchIds = [],
      startDate,
      endDate,
      conditions,
      daysOfWeek = [],
      ...rest
    } = data;

    return this.prisma.promotion.create({
      data: {
        ...rest,
        daysOfWeek,
        conditions: conditions as Prisma.InputJsonValue,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        branches: {
          create: branchIds.map((branchId) => ({ branchId })),
        },
      },
      include: {
        branches: {
          include: { branch: { select: { id: true, name: true } } },
        },
      },
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      description?: string;
      type?: string;
      discountValue?: number;
      conditions?: Record<string, unknown>;
      startDate?: string;
      endDate?: string;
      startTime?: string;
      endTime?: string;
      daysOfWeek?: number[];
      isAutomatic?: boolean;
      isActive?: boolean;
      branchIds?: string[];
    },
  ) {
    await this.findById(id);

    const { branchIds, startDate, endDate, conditions, ...rest } = data;

    if (branchIds !== undefined) {
      await this.prisma.promotionBranch.deleteMany({
        where: { promotionId: id },
      });
      await this.prisma.promotionBranch.createMany({
        data: branchIds.map((branchId) => ({ promotionId: id, branchId })),
      });
    }

    return this.prisma.promotion.update({
      where: { id },
      data: {
        ...rest,
        conditions: conditions as Prisma.InputJsonValue,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      },
      include: {
        branches: {
          include: { branch: { select: { id: true, name: true } } },
        },
      },
    });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.promotion.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ----------------------------------------------------------------
  // Evaluation
  // ----------------------------------------------------------------

  async evaluateForOrder(branchId: string, orderItems: OrderItemInput[]) {
    if (!orderItems || orderItems.length === 0) {
      throw new BadRequestException('Order items are required for evaluation');
    }

    const activePromos = await this.findActive(branchId);
    const automaticPromos = activePromos.filter((p) => p.isAutomatic);

    if (automaticPromos.length === 0) {
      return { applicable: [], bestPromotion: null, estimatedDiscount: 0 };
    }

    const orderSubtotal = orderItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );

    const applicable: Array<{
      promotion: (typeof automaticPromos)[number];
      discountAmount: number;
    }> = [];

    for (const promo of automaticPromos) {
      const conditions = (promo.conditions as Record<string, unknown>) ?? {};
      const discountValue = Number(promo.discountValue ?? 0);

      // Check minimum order amount condition
      const minAmount = conditions['minOrderAmount'] as number | undefined;
      if (minAmount !== undefined && orderSubtotal < minAmount) {
        continue;
      }

      // Check minimum item count condition
      const minItems = conditions['minItemCount'] as number | undefined;
      if (minItems !== undefined) {
        const totalQty = orderItems.reduce((s, i) => s + i.quantity, 0);
        if (totalQty < minItems) continue;
      }

      // Check required product variant condition
      const requiredVariant = conditions['requiredProductVariantId'] as
        | string
        | undefined;
      if (requiredVariant) {
        const hasRequired = orderItems.some(
          (i) => i.productVariantId === requiredVariant,
        );
        if (!hasRequired) continue;
      }

      // Calculate discount
      let discountAmount = 0;
      switch (promo.type) {
        case 'percentage':
          discountAmount = (orderSubtotal * discountValue) / 100;
          break;
        case 'fixed':
          discountAmount = Math.min(discountValue, orderSubtotal);
          break;
        case 'free_item':
          // Free item promos: discount = price of cheapest item * qty specified
          discountAmount = discountValue;
          break;
        default:
          discountAmount = 0;
      }

      if (discountAmount > 0) {
        applicable.push({ promotion: promo, discountAmount });
      }
    }

    // Sort by discount descending – best deal first
    applicable.sort((a, b) => b.discountAmount - a.discountAmount);

    const best = applicable[0] ?? null;

    return {
      applicable: applicable.map((a) => ({
        id: a.promotion.id,
        name: a.promotion.name,
        type: a.promotion.type,
        discountAmount: a.discountAmount,
      })),
      bestPromotion: best
        ? {
            id: best.promotion.id,
            name: best.promotion.name,
            type: best.promotion.type,
            discountAmount: best.discountAmount,
          }
        : null,
      estimatedDiscount: best?.discountAmount ?? 0,
      orderSubtotal,
    };
  }
}
