import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class IngredientsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.ingredient.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const ingredient = await this.prisma.ingredient.findUnique({
      where: { id },
      include: {
        stockItems: {
          include: {
            branch: { select: { id: true, name: true } },
          },
        },
        recipeItems: {
          include: {
            product: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!ingredient) {
      throw new NotFoundException(`Ingrediente con id "${id}" no encontrado`);
    }

    return ingredient;
  }

  async create(data: { name: string; unit: string; costPerUnit?: number }) {
    return this.prisma.ingredient.create({
      data: {
        name: data.name,
        unit: data.unit,
        costPerUnit: data.costPerUnit ?? null,
      },
    });
  }

  async update(
    id: string,
    data: { name?: string; unit?: string; costPerUnit?: number | null },
  ) {
    await this.findById(id);

    return this.prisma.ingredient.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    await this.findById(id);

    return this.prisma.ingredient.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
