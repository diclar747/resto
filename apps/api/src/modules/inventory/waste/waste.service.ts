import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class WasteService {
  constructor(private prisma: PrismaService) {}

  async recordWaste(
    ingredientId: string,
    branchId: string,
    quantity: number,
    reason: string,
    recordedBy: string,
  ) {
    if (!branchId) {
      throw new BadRequestException('branchId es requerido');
    }

    const ingredient = await this.prisma.ingredient.findUnique({
      where: { id: ingredientId },
      select: { id: true, name: true },
    });

    if (!ingredient) {
      throw new NotFoundException(
        `Ingrediente con id "${ingredientId}" no encontrado`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      // Create the waste record
      const wasteRecord = await tx.wasteRecord.create({
        data: {
          ingredientId,
          branchId,
          quantity,
          reason,
          recordedBy,
        },
        include: {
          ingredient: true,
        },
      });

      // Deduct from stock if a stock record exists
      const stockItem = await tx.stockItem.findUnique({
        where: {
          branchId_ingredientId: { branchId, ingredientId },
        },
      });

      if (stockItem) {
        const newStock = Math.max(0, Number(stockItem.currentStock) - quantity);
        await tx.stockItem.update({
          where: {
            branchId_ingredientId: { branchId, ingredientId },
          },
          data: { currentStock: newStock },
        });
      }

      return wasteRecord;
    });
  }

  async findAll(branchId: string, from?: string, to?: string) {
    if (!branchId) {
      throw new BadRequestException('branchId es requerido');
    }

    const where: {
      branchId: string;
      recordedAt?: { gte?: Date; lte?: Date };
    } = { branchId };

    if (from || to) {
      where.recordedAt = {};
      if (from) where.recordedAt.gte = new Date(from);
      if (to) where.recordedAt.lte = new Date(to);
    }

    return this.prisma.wasteRecord.findMany({
      where,
      include: {
        ingredient: true,
      },
      orderBy: { recordedAt: 'desc' },
    });
  }
}
