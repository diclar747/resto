import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

export interface RecipeItemInput {
  ingredientId: string;
  quantity: number;
}

@Injectable()
export class RecipesService {
  constructor(private prisma: PrismaService) {}

  async findByProduct(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!product) {
      throw new NotFoundException(`Producto con id "${productId}" no encontrado`);
    }

    return this.prisma.recipeItem.findMany({
      where: { productId },
      include: {
        ingredient: true,
      },
      orderBy: {
        ingredient: { name: 'asc' },
      },
    });
  }

  async setRecipe(productId: string, items: RecipeItemInput[]) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!product) {
      throw new NotFoundException(`Producto con id "${productId}" no encontrado`);
    }

    // Verify all ingredients exist
    if (items.length > 0) {
      const ingredientIds = items.map((i) => i.ingredientId);
      const found = await this.prisma.ingredient.findMany({
        where: { id: { in: ingredientIds } },
        select: { id: true },
      });
      if (found.length !== ingredientIds.length) {
        throw new NotFoundException('Uno o más ingredientes no fueron encontrados');
      }
    }

    // Upsert all recipe items in a transaction
    return this.prisma.$transaction(async (tx) => {
      // Delete items not present in the new set
      const newIngredientIds = items.map((i) => i.ingredientId);
      await tx.recipeItem.deleteMany({
        where: {
          productId,
          ingredientId: { notIn: newIngredientIds },
        },
      });

      // Upsert each item
      const upserted = await Promise.all(
        items.map((item) =>
          tx.recipeItem.upsert({
            where: {
              productId_ingredientId: {
                productId,
                ingredientId: item.ingredientId,
              },
            },
            update: { quantity: item.quantity },
            create: {
              productId,
              ingredientId: item.ingredientId,
              quantity: item.quantity,
            },
            include: { ingredient: true },
          }),
        ),
      );

      return upserted;
    });
  }

  async deleteRecipe(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });

    if (!product) {
      throw new NotFoundException(`Producto con id "${productId}" no encontrado`);
    }

    const { count } = await this.prisma.recipeItem.deleteMany({
      where: { productId },
    });

    return { deleted: count };
  }

  async calculateCost(productId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, name: true },
    });

    if (!product) {
      throw new NotFoundException(`Producto con id "${productId}" no encontrado`);
    }

    const recipeItems = await this.prisma.recipeItem.findMany({
      where: { productId },
      include: { ingredient: true },
    });

    let totalCost = 0;
    const breakdown = recipeItems.map((item) => {
      const costPerUnit = Number(item.ingredient.costPerUnit ?? 0);
      const quantity = Number(item.quantity);
      const lineCost = costPerUnit * quantity;
      totalCost += lineCost;

      return {
        ingredientId: item.ingredientId,
        ingredientName: item.ingredient.name,
        unit: item.ingredient.unit,
        quantity,
        costPerUnit,
        lineCost,
      };
    });

    return {
      productId,
      productName: product.name,
      totalCost,
      breakdown,
    };
  }
}
