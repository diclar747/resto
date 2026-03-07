import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class ModifiersService {
  constructor(private prisma: PrismaService) {}

  async findAllGroups() {
    return this.prisma.modifierGroup.findMany({
      include: {
        modifiers: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findGroupById(id: string) {
    const group = await this.prisma.modifierGroup.findUnique({
      where: { id },
      include: {
        modifiers: {
          orderBy: { sortOrder: 'asc' },
        },
        products: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    if (!group) {
      throw new NotFoundException(`Modifier group with id ${id} not found`);
    }

    return group;
  }

  async createGroup(data: {
    name: string;
    minSelect?: number;
    maxSelect?: number;
    isRequired?: boolean;
    modifiers?: {
      name: string;
      priceAdjustment?: number;
      isActive?: boolean;
      sortOrder?: number;
    }[];
  }) {
    const { modifiers, ...groupData } = data;

    return this.prisma.modifierGroup.create({
      data: {
        name: groupData.name,
        minSelect: groupData.minSelect ?? 0,
        maxSelect: groupData.maxSelect ?? 1,
        isRequired: groupData.isRequired ?? false,
        modifiers: modifiers && modifiers.length > 0
          ? {
              create: modifiers.map((m, index) => ({
                name: m.name,
                priceAdjustment: m.priceAdjustment ?? 0,
                isActive: m.isActive ?? true,
                sortOrder: m.sortOrder ?? index,
              })),
            }
          : undefined,
      },
      include: {
        modifiers: {
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  async updateGroup(
    id: string,
    data: {
      name?: string;
      minSelect?: number;
      maxSelect?: number;
      isRequired?: boolean;
    },
  ) {
    await this.findGroupById(id);

    return this.prisma.modifierGroup.update({
      where: { id },
      data: {
        name: data.name,
        minSelect: data.minSelect,
        maxSelect: data.maxSelect,
        isRequired: data.isRequired,
      },
      include: {
        modifiers: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  async deleteGroup(id: string) {
    await this.findGroupById(id);

    // Delete all associations with products first, then modifiers, then the group
    await this.prisma.$transaction([
      this.prisma.productModifierGroup.deleteMany({
        where: { modifierGroupId: id },
      }),
      this.prisma.modifier.deleteMany({
        where: { modifierGroupId: id },
      }),
      this.prisma.modifierGroup.delete({
        where: { id },
      }),
    ]);

    return { message: `Modifier group ${id} deleted successfully` };
  }

  async addModifier(
    groupId: string,
    data: {
      name: string;
      priceAdjustment?: number;
      isActive?: boolean;
      sortOrder?: number;
    },
  ) {
    await this.findGroupById(groupId);

    return this.prisma.modifier.create({
      data: {
        modifierGroupId: groupId,
        name: data.name,
        priceAdjustment: data.priceAdjustment ?? 0,
        isActive: data.isActive ?? true,
        sortOrder: data.sortOrder ?? 0,
      },
    });
  }

  async updateModifier(
    id: string,
    data: {
      name?: string;
      priceAdjustment?: number;
      isActive?: boolean;
      sortOrder?: number;
    },
  ) {
    const modifier = await this.prisma.modifier.findUnique({ where: { id } });

    if (!modifier) {
      throw new NotFoundException(`Modifier with id ${id} not found`);
    }

    return this.prisma.modifier.update({
      where: { id },
      data: {
        name: data.name,
        priceAdjustment: data.priceAdjustment,
        isActive: data.isActive,
        sortOrder: data.sortOrder,
      },
    });
  }

  async deleteModifier(id: string) {
    const modifier = await this.prisma.modifier.findUnique({ where: { id } });

    if (!modifier) {
      throw new NotFoundException(`Modifier with id ${id} not found`);
    }

    // Soft-delete by marking inactive
    return this.prisma.modifier.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
