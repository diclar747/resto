import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(branchId: string) {
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
            _count: {
              select: { products: { where: { isActive: true } } },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: { products: { where: { isActive: true } } },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return categories;
  }

  async findById(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
        parent: true,
        products: {
          where: { isActive: true },
          include: {
            variants: {
              where: { isActive: true },
              orderBy: { sortOrder: 'asc' },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: { products: { where: { isActive: true } } },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with id ${id} not found`);
    }

    return category;
  }

  async create(data: {
    name: string;
    branchId: string;
    description?: string;
    imageUrl?: string;
    sortOrder?: number;
    parentId?: string;
  }) {
    return this.prisma.category.create({
      data: {
        name: data.name,
        branchId: data.branchId,
        description: data.description,
        imageUrl: data.imageUrl,
        sortOrder: data.sortOrder ?? 0,
        parentId: data.parentId,
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      description?: string;
      imageUrl?: string;
      sortOrder?: number;
      parentId?: string;
      isActive?: boolean;
    },
  ) {
    await this.findById(id);

    return this.prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        imageUrl: data.imageUrl,
        sortOrder: data.sortOrder,
        parentId: data.parentId,
        isActive: data.isActive,
      },
      include: {
        _count: {
          select: { products: true },
        },
      },
    });
  }

  async delete(id: string) {
    await this.findById(id);

    return this.prisma.category.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async reorder(items: { id: string; sortOrder: number }[]) {
    const updates = items.map((item) =>
      this.prisma.category.update({
        where: { id: item.id },
        data: { sortOrder: item.sortOrder },
      }),
    );

    await this.prisma.$transaction(updates);

    return { message: 'Categories reordered successfully' };
  }
}
