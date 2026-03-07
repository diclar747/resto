import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

export interface QrOrderItem {
  productVariantId: string;
  quantity: number;
  notes?: string;
  modifierIds?: string[];
}

@Injectable()
export class QrOrderingService {
  constructor(private prisma: PrismaService) {}

  /**
   * Validate a table by its QR code and return active menu grouped by category.
   */
  async getMenu(tableCode: string) {
    const table = await this.findTableByCode(tableCode);

    const categories = await this.prisma.category.findMany({
      where: { branchId: table.branchId, isActive: true, parentId: null },
      orderBy: { sortOrder: 'asc' },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
        products: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
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
              where: { branchId: table.branchId },
            },
          },
        },
      },
    });

    // Filter out products not available at this branch and apply price overrides
    const menuCategories = categories.map((category) => ({
      id: category.id,
      name: category.name,
      description: category.description,
      imageUrl: category.imageUrl,
      sortOrder: category.sortOrder,
      subcategories: category.children,
      products: category.products
        .filter(
          (p) =>
            p.branches.length === 0 || p.branches[0].isAvailable,
        )
        .map((product) => {
          const branchEntry = product.branches[0];
          return {
            id: product.id,
            name: product.name,
            description: product.description,
            imageUrl: product.imageUrl,
            prepTime: product.prepTime,
            variants: product.variants.map((v) => ({
              id: v.id,
              name: v.name,
              price: branchEntry?.priceOverride ?? v.price,
              isDefault: v.isDefault,
            })),
            modifierGroups: product.modifierGroups.map((pmg) => ({
              id: pmg.modifierGroup.id,
              name: pmg.modifierGroup.name,
              minSelect: pmg.modifierGroup.minSelect,
              maxSelect: pmg.modifierGroup.maxSelect,
              isRequired: pmg.modifierGroup.isRequired,
              modifiers: pmg.modifierGroup.modifiers.map((m) => ({
                id: m.id,
                name: m.name,
                priceAdjustment: m.priceAdjustment,
              })),
            })),
          };
        }),
    }));

    return {
      table: {
        id: table.id,
        number: table.number,
        name: table.name,
        zone: table.zone,
        status: table.status,
      },
      menu: menuCategories,
    };
  }

  /**
   * Place an order from a QR-scanned table.
   */
  async placeOrder(tableCode: string, items: QrOrderItem[]) {
    const table = await this.findTableByCode(tableCode);

    if (!table.isActive) {
      throw new BadRequestException('La mesa no está disponible');
    }

    if (items.length === 0) {
      throw new BadRequestException('El pedido no tiene items');
    }

    // Determine next order number for today at this branch
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const lastOrder = await this.prisma.order.findFirst({
      where: {
        branchId: table.branchId,
        createdAt: { gte: today, lt: tomorrow },
      },
      orderBy: { orderNumber: 'desc' },
    });

    const orderNumber = (lastOrder?.orderNumber ?? 0) + 1;

    // Build order items with pricing
    const orderItemsData: Array<{
      productVariantId: string;
      quantity: number;
      unitPrice: Decimal;
      subtotal: Decimal;
      notes?: string;
      modifierIds?: string[];
    }> = [];

    for (const item of items) {
      const variant = await this.prisma.productVariant.findUnique({
        where: { id: item.productVariantId },
        include: {
          product: {
            include: {
              branches: { where: { branchId: table.branchId } },
            },
          },
        },
      });

      if (!variant || !variant.isActive) {
        throw new NotFoundException(
          `Variante ${item.productVariantId} no encontrada o no disponible`,
        );
      }

      const branchEntry = variant.product.branches[0];
      const basePrice: Decimal =
        branchEntry?.priceOverride != null
          ? new Decimal(branchEntry.priceOverride.toString())
          : new Decimal(variant.price.toString());

      let modifiersTotal = new Decimal(0);
      if (item.modifierIds && item.modifierIds.length > 0) {
        const modifiers = await this.prisma.modifier.findMany({
          where: { id: { in: item.modifierIds }, isActive: true },
        });
        modifiersTotal = modifiers.reduce(
          (sum, m) => sum.add(new Decimal(m.priceAdjustment.toString())),
          new Decimal(0),
        );
      }

      const unitPrice = basePrice.add(modifiersTotal);
      const subtotal = unitPrice.mul(item.quantity);

      orderItemsData.push({
        productVariantId: item.productVariantId,
        quantity: item.quantity,
        unitPrice,
        subtotal,
        notes: item.notes,
        modifierIds: item.modifierIds,
      });
    }

    const subtotal = orderItemsData.reduce(
      (sum, i) => sum.add(i.subtotal),
      new Decimal(0),
    );

    // Create the order with all its items
    const order = await this.prisma.order.create({
      data: {
        branchId: table.branchId,
        tableId: table.id,
        orderNumber,
        type: 'dine_in',
        status: 'open',
        subtotal,
        total: subtotal,
        items: {
          create: orderItemsData.map((item) => ({
            productVariantId: item.productVariantId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            subtotal: item.subtotal,
            notes: item.notes,
            status: 'pending',
            modifiers:
              item.modifierIds && item.modifierIds.length > 0
                ? {
                    create: item.modifierIds.map((modifierId) => ({
                      modifierId,
                      priceAdjustment: 0,
                    })),
                  }
                : undefined,
          })),
        },
      },
      include: {
        items: {
          include: {
            productVariant: { include: { product: true } },
            modifiers: { include: { modifier: true } },
          },
        },
        table: true,
      },
    });

    // Update modifier price adjustments to the correct values
    for (const item of orderItemsData) {
      if (item.modifierIds && item.modifierIds.length > 0) {
        const modifiers = await this.prisma.modifier.findMany({
          where: { id: { in: item.modifierIds } },
        });
        const createdItem = order.items.find(
          (oi) => oi.productVariantId === item.productVariantId,
        );
        if (createdItem) {
          for (const mod of modifiers) {
            await this.prisma.orderItemModifier.updateMany({
              where: {
                orderItemId: createdItem.id,
                modifierId: mod.id,
              },
              data: { priceAdjustment: mod.priceAdjustment },
            });
          }
        }
      }
    }

    // Update table status to occupied
    await this.prisma.table.update({
      where: { id: table.id },
      data: { status: 'occupied' },
    });

    return order;
  }

  /**
   * Return the current open orders for the table identified by QR code.
   */
  async getOrderStatus(tableCode: string) {
    const table = await this.findTableByCode(tableCode);

    const orders = await this.prisma.order.findMany({
      where: {
        tableId: table.id,
        status: { notIn: ['closed', 'cancelled', 'void'] },
      },
      include: {
        items: {
          include: {
            productVariant: { include: { product: true } },
            modifiers: { include: { modifier: true } },
          },
        },
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      table: {
        id: table.id,
        number: table.number,
        name: table.name,
        status: table.status,
      },
      orders,
    };
  }

  /**
   * Emit a waiter-call notification for this table.
   * The caller (controller) is responsible for forwarding the event via a gateway.
   */
  async callWaiter(tableCode: string) {
    const table = await this.findTableByCode(tableCode);

    return {
      success: true,
      message: 'Mozo notificado',
      tableId: table.id,
      tableNumber: table.number,
      branchId: table.branchId,
      event: 'waiter:call',
    };
  }

  /**
   * Mark the table as bill_requested so the waiter knows to bring the check.
   */
  async requestBill(tableCode: string) {
    const table = await this.findTableByCode(tableCode);

    const updated = await this.prisma.table.update({
      where: { id: table.id },
      data: { status: 'bill_requested' },
    });

    return {
      success: true,
      message: 'Solicitud de cuenta enviada',
      table: updated,
    };
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private async findTableByCode(tableCode: string) {
    const table = await this.prisma.table.findUnique({
      where: { qrCode: tableCode },
    });
    if (!table) {
      throw new NotFoundException('Mesa no encontrada para este código QR');
    }
    return table;
  }
}
