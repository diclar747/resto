import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

export interface OrderItemInput {
  productVariantId: string;
  quantity: number;
}

export interface RestockItemInput {
  ingredientId: string;
  quantity: number;
}

@Injectable()
export class StockService {
  constructor(private prisma: PrismaService) {}

  async findAll(branchId: string) {
    if (!branchId) {
      throw new BadRequestException('branchId es requerido');
    }

    return this.prisma.stockItem.findMany({
      where: { branchId },
      include: {
        ingredient: true,
      },
      orderBy: {
        ingredient: { name: 'asc' },
      },
    });
  }

  async findAlerts(branchId: string) {
    if (!branchId) {
      throw new BadRequestException('branchId es requerido');
    }

    // Items where currentStock <= minStock
    const items = await this.prisma.stockItem.findMany({
      where: { branchId },
      include: { ingredient: true },
    });

    return items.filter(
      (item) => Number(item.currentStock) <= Number(item.minStock),
    );
  }

  async adjustStock(
    branchId: string,
    ingredientId: string,
    quantity: number,
    reason: string,
  ) {
    // Ensure stock record exists (upsert)
    const existing = await this.prisma.stockItem.findUnique({
      where: { branchId_ingredientId: { branchId, ingredientId } },
    });

    if (existing) {
      const newStock = Number(existing.currentStock) + quantity;
      return this.prisma.stockItem.update({
        where: { branchId_ingredientId: { branchId, ingredientId } },
        data: {
          currentStock: newStock,
          updatedAt: new Date(),
        },
        include: { ingredient: true },
      });
    }

    // First-time record for this ingredient at this branch
    const ingredient = await this.prisma.ingredient.findUnique({
      where: { id: ingredientId },
    });
    if (!ingredient) {
      throw new NotFoundException(
        `Ingrediente con id "${ingredientId}" no encontrado`,
      );
    }

    return this.prisma.stockItem.create({
      data: {
        branchId,
        ingredientId,
        currentStock: Math.max(0, quantity),
      },
      include: { ingredient: true },
    });
  }

  async deductByOrder(branchId: string, orderItems: OrderItemInput[]) {
    if (!branchId) {
      throw new BadRequestException('branchId es requerido');
    }

    return this.prisma.$transaction(async (tx) => {
      const deductions: Array<{
        ingredientId: string;
        ingredientName: string;
        deducted: number;
        newStock: number;
      }> = [];

      for (const orderItem of orderItems) {
        // Get the productId from the variant
        const variant = await tx.productVariant.findUnique({
          where: { id: orderItem.productVariantId },
          select: { productId: true },
        });

        if (!variant) continue;

        // Get recipe items for this product
        const recipeItems = await tx.recipeItem.findMany({
          where: { productId: variant.productId },
          include: { ingredient: true },
        });

        for (const recipeItem of recipeItems) {
          const required =
            Number(recipeItem.quantity) * orderItem.quantity;

          const stockItem = await tx.stockItem.findUnique({
            where: {
              branchId_ingredientId: {
                branchId,
                ingredientId: recipeItem.ingredientId,
              },
            },
          });

          if (!stockItem) continue;

          const newStock = Math.max(0, Number(stockItem.currentStock) - required);

          await tx.stockItem.update({
            where: {
              branchId_ingredientId: {
                branchId,
                ingredientId: recipeItem.ingredientId,
              },
            },
            data: { currentStock: newStock },
          });

          deductions.push({
            ingredientId: recipeItem.ingredientId,
            ingredientName: recipeItem.ingredient.name,
            deducted: required,
            newStock,
          });
        }
      }

      return { deductions };
    });
  }

  async restockFromPurchase(branchId: string, items: RestockItemInput[]) {
    if (!branchId) {
      throw new BadRequestException('branchId es requerido');
    }

    return this.prisma.$transaction(async (tx) => {
      const restocked: Array<{
        ingredientId: string;
        added: number;
        newStock: number;
      }> = [];

      for (const item of items) {
        const ingredient = await tx.ingredient.findUnique({
          where: { id: item.ingredientId },
          select: { id: true },
        });

        if (!ingredient) {
          throw new NotFoundException(
            `Ingrediente con id "${item.ingredientId}" no encontrado`,
          );
        }

        const existing = await tx.stockItem.findUnique({
          where: {
            branchId_ingredientId: {
              branchId,
              ingredientId: item.ingredientId,
            },
          },
        });

        let newStock: number;

        if (existing) {
          newStock = Number(existing.currentStock) + item.quantity;
          await tx.stockItem.update({
            where: {
              branchId_ingredientId: {
                branchId,
                ingredientId: item.ingredientId,
              },
            },
            data: {
              currentStock: newStock,
              lastRestockedAt: new Date(),
            },
          });
        } else {
          newStock = item.quantity;
          await tx.stockItem.create({
            data: {
              branchId,
              ingredientId: item.ingredientId,
              currentStock: newStock,
              lastRestockedAt: new Date(),
            },
          });
        }

        restocked.push({
          ingredientId: item.ingredientId,
          added: item.quantity,
          newStock,
        });
      }

      return { restocked };
    });
  }

  async setMinMax(
    branchId: string,
    ingredientId: string,
    min: number,
    max?: number | null,
  ) {
    const ingredient = await this.prisma.ingredient.findUnique({
      where: { id: ingredientId },
      select: { id: true },
    });

    if (!ingredient) {
      throw new NotFoundException(
        `Ingrediente con id "${ingredientId}" no encontrado`,
      );
    }

    return this.prisma.stockItem.upsert({
      where: {
        branchId_ingredientId: { branchId, ingredientId },
      },
      update: {
        minStock: min,
        maxStock: max ?? null,
      },
      create: {
        branchId,
        ingredientId,
        currentStock: 0,
        minStock: min,
        maxStock: max ?? null,
      },
      include: { ingredient: true },
    });
  }
}
