import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(branchId: string, categoryId?: string) {
    const products = await this.prisma.product.findMany({
      where: {
        isActive: true,
        ...(categoryId ? { categoryId } : {}),
        category: {
          branchId,
        },
      },
      include: {
        category: true,
        variants: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
        modifierGroups: {
          include: {
            modifierGroup: {
              include: {
                modifiers: {
                  where: { isActive: true },
                  orderBy: { sortOrder: 'asc' },
                },
              },
            },
          },
        },
        branches: {
          where: { branchId },
        },
        kitchenStation: true,
      },
      orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
    });

    return products;
  }

  async findById(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        variants: {
          orderBy: { sortOrder: 'asc' },
        },
        modifierGroups: {
          include: {
            modifierGroup: {
              include: {
                modifiers: {
                  orderBy: { sortOrder: 'asc' },
                },
              },
            },
          },
        },
        branches: true,
        kitchenStation: true,
        recipeItems: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }

    return product;
  }

  async findMenu(branchId: string) {
    const categories = await this.prisma.category.findMany({
      where: {
        branchId,
        isActive: true,
        parentId: null,
      },
      include: {
        children: {
          where: { isActive: true },
          include: {
            products: {
              where: {
                isActive: true,
                branches: {
                  some: {
                    branchId,
                    isAvailable: true,
                  },
                },
              },
              include: {
                variants: {
                  where: { isActive: true },
                  orderBy: { sortOrder: 'asc' },
                },
                modifierGroups: {
                  include: {
                    modifierGroup: {
                      include: {
                        modifiers: {
                          where: { isActive: true },
                          orderBy: { sortOrder: 'asc' },
                        },
                      },
                    },
                  },
                },
                branches: {
                  where: { branchId },
                },
              },
              orderBy: { sortOrder: 'asc' },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
        products: {
          where: {
            isActive: true,
            branches: {
              some: {
                branchId,
                isAvailable: true,
              },
            },
          },
          include: {
            variants: {
              where: { isActive: true },
              orderBy: { sortOrder: 'asc' },
            },
            modifierGroups: {
              include: {
                modifierGroup: {
                  include: {
                    modifiers: {
                      where: { isActive: true },
                      orderBy: { sortOrder: 'asc' },
                    },
                  },
                },
              },
            },
            branches: {
              where: { branchId },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return categories;
  }

  async create(data: {
    name: string;
    categoryId: string;
    description?: string;
    imageUrl?: string;
    sku?: string;
    sortOrder?: number;
    prepTime?: number;
    kitchenStationId?: string;
    variants?: {
      name: string;
      price: number;
      cost?: number;
      isDefault?: boolean;
      isActive?: boolean;
      sortOrder?: number;
    }[];
    modifierGroupIds?: string[];
  }) {
    const { variants, modifierGroupIds, ...productData } = data;

    return this.prisma.product.create({
      data: {
        name: productData.name,
        categoryId: productData.categoryId,
        description: productData.description,
        imageUrl: productData.imageUrl,
        sku: productData.sku,
        sortOrder: productData.sortOrder ?? 0,
        prepTime: productData.prepTime,
        kitchenStationId: productData.kitchenStationId,
        variants: variants && variants.length > 0
          ? {
              create: variants.map((v, index) => ({
                name: v.name,
                price: v.price,
                cost: v.cost,
                isDefault: v.isDefault ?? index === 0,
                isActive: v.isActive ?? true,
                sortOrder: v.sortOrder ?? index,
              })),
            }
          : undefined,
        modifierGroups: modifierGroupIds && modifierGroupIds.length > 0
          ? {
              create: modifierGroupIds.map((modifierGroupId) => ({
                modifierGroupId,
              })),
            }
          : undefined,
      },
      include: {
        category: true,
        variants: {
          orderBy: { sortOrder: 'asc' },
        },
        modifierGroups: {
          include: {
            modifierGroup: {
              include: {
                modifiers: {
                  where: { isActive: true },
                  orderBy: { sortOrder: 'asc' },
                },
              },
            },
          },
        },
        kitchenStation: true,
      },
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      categoryId?: string;
      description?: string;
      imageUrl?: string;
      sku?: string;
      sortOrder?: number;
      prepTime?: number;
      kitchenStationId?: string;
      isActive?: boolean;
      modifierGroupIds?: string[];
    },
  ) {
    await this.findById(id);

    const { modifierGroupIds, ...productData } = data;

    if (modifierGroupIds !== undefined) {
      // Replace all modifier group associations
      await this.prisma.productModifierGroup.deleteMany({
        where: { productId: id },
      });

      if (modifierGroupIds.length > 0) {
        await this.prisma.productModifierGroup.createMany({
          data: modifierGroupIds.map((modifierGroupId) => ({
            productId: id,
            modifierGroupId,
          })),
        });
      }
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        name: productData.name,
        categoryId: productData.categoryId,
        description: productData.description,
        imageUrl: productData.imageUrl,
        sku: productData.sku,
        sortOrder: productData.sortOrder,
        prepTime: productData.prepTime,
        kitchenStationId: productData.kitchenStationId,
        isActive: productData.isActive,
      },
      include: {
        category: true,
        variants: {
          orderBy: { sortOrder: 'asc' },
        },
        modifierGroups: {
          include: {
            modifierGroup: {
              include: {
                modifiers: {
                  where: { isActive: true },
                  orderBy: { sortOrder: 'asc' },
                },
              },
            },
          },
        },
        kitchenStation: true,
      },
    });
  }

  async delete(id: string) {
    await this.findById(id);

    return this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async updateAvailability(
    productId: string,
    branchId: string,
    isAvailable: boolean,
  ) {
    // Upsert the ProductBranch record
    return this.prisma.productBranch.upsert({
      where: {
        productId_branchId: {
          productId,
          branchId,
        },
      },
      update: { isAvailable },
      create: {
        productId,
        branchId,
        isAvailable,
      },
    });
  }
}
