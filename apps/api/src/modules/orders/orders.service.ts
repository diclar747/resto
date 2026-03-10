import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) { }

  async findAll(branchId: string, filters?: {
    status?: string;
    type?: string;
    tableId?: string;
    waiterId?: string;
    from?: Date;
    to?: Date;
  }) {
    const where: any = { branchId };
    if (filters?.status) where.status = filters.status;
    if (filters?.type) where.type = filters.type;
    if (filters?.tableId) where.tableId = filters.tableId;
    if (filters?.waiterId) where.waiterId = filters.waiterId;
    if (filters?.from || filters?.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt.gte = filters.from;
      if (filters.to) where.createdAt.lte = filters.to;
    }

    return this.prisma.order.findMany({
      where,
      include: {
        table: true,
        waiter: { select: { id: true, firstName: true, lastName: true } },
        client: { select: { id: true, firstName: true, lastName: true } },
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
  }

  async findActiveByTable(tableId: string) {
    return this.prisma.order.findFirst({
      where: {
        tableId,
        status: { in: ['open', 'in_progress'] },
      },
      include: {
        table: true,
        waiter: { select: { id: true, firstName: true, lastName: true } },
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
  }

  async findById(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        table: true,
        waiter: { select: { id: true, firstName: true, lastName: true } },
        cashier: { select: { id: true, firstName: true, lastName: true } },
        client: true,
        items: {
          include: {
            productVariant: { include: { product: true } },
            modifiers: { include: { modifier: true } },
          },
        },
        payments: true,
        kdsTickets: { include: { kitchenStation: true, items: true } },
      },
    });
    if (!order) throw new NotFoundException('Orden no encontrada');
    return order;
  }

  async create(data: {
    branchId: string;
    type: string;
    tableId?: string;
    waiterId?: string;
    clientId?: string;
    guestCount?: number;
    notes?: string;
    deliveryData?: {
      customerName: string;
      customerPhone: string;
      deliveryAddress: string;
    };
  }) {
    const { deliveryData, ...orderData } = data;
    // Get next order number for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const lastOrder = await this.prisma.order.findFirst({
      where: {
        branchId: data.branchId,
        createdAt: { gte: today, lt: tomorrow },
      },
      orderBy: { orderNumber: 'desc' },
    });

    const orderNumber = (lastOrder?.orderNumber ?? 0) + 1;

    const order = await this.prisma.order.create({
      data: {
        ...orderData,
        orderNumber,
      },
      include: {
        table: true,
        waiter: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // Update table status if dine-in
    if (orderData.tableId) {
      await this.prisma.table.update({
        where: { id: orderData.tableId },
        data: { status: 'occupied' },
      });
    }

    // Create delivery record if type is delivery
    if (orderData.type === 'delivery' && deliveryData) {
      // Get delivery fee from branch settings if possible
      const branch = await this.prisma.branch.findUnique({
        where: { id: orderData.branchId },
        select: { settings: true },
      });
      const settings = (branch?.settings as any) || {};
      const deliveryFee = settings.deliveryFee || 0;

      await this.prisma.delivery.create({
        data: {
          orderId: order.id,
          customerName: deliveryData.customerName,
          customerPhone: deliveryData.customerPhone,
          deliveryAddress: deliveryData.deliveryAddress,
          deliveryFee,
          status: 'pending',
        },
      });
    }

    return order;
  }

  async addItems(orderId: string, items: {
    productVariantId: string;
    quantity: number;
    notes?: string;
    seat?: number;
    courseNumber?: number;
    modifierIds?: string[];
  }[]) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Orden no encontrada');
    if (order.status === 'closed' || order.status === 'cancelled') {
      throw new BadRequestException('No se pueden agregar items a una orden cerrada');
    }

    const createdItems = [];

    for (const item of items) {
      const variant = await this.prisma.productVariant.findUnique({
        where: { id: item.productVariantId },
      });
      if (!variant) throw new NotFoundException(`Variante ${item.productVariantId} no encontrada`);

      // Calculate modifiers price
      let modifiersTotal = new Decimal(0);
      if (item.modifierIds && item.modifierIds.length > 0) {
        const modifiers = await this.prisma.modifier.findMany({
          where: { id: { in: item.modifierIds } },
        });
        modifiersTotal = modifiers.reduce(
          (sum, m) => sum.add(m.priceAdjustment),
          new Decimal(0),
        );
      }

      const unitPrice = variant.price.add(modifiersTotal);
      const subtotal = unitPrice.mul(item.quantity);

      const orderItem = await this.prisma.orderItem.create({
        data: {
          orderId,
          productVariantId: item.productVariantId,
          quantity: item.quantity,
          unitPrice,
          subtotal,
          notes: item.notes,
          seat: item.seat,
          courseNumber: item.courseNumber ?? 1,
          modifiers: item.modifierIds
            ? {
              create: item.modifierIds.map((modifierId) => {
                const mod = modifiersTotal; // simplified
                return { modifierId, priceAdjustment: 0 };
              }),
            }
            : undefined,
        },
        include: {
          productVariant: { include: { product: true } },
          modifiers: { include: { modifier: true } },
        },
      });

      // Fix modifier price adjustments
      if (item.modifierIds && item.modifierIds.length > 0) {
        const modifiers = await this.prisma.modifier.findMany({
          where: { id: { in: item.modifierIds } },
        });
        for (const mod of modifiers) {
          await this.prisma.orderItemModifier.updateMany({
            where: {
              orderItemId: orderItem.id,
              modifierId: mod.id,
            },
            data: { priceAdjustment: mod.priceAdjustment },
          });
        }
      }

      createdItems.push(orderItem);
    }

    // Recalculate order totals
    await this.recalculateTotals(orderId);

    return createdItems;
  }

  async removeItem(orderId: string, itemId: string) {
    const item = await this.prisma.orderItem.findFirst({
      where: { id: itemId, orderId },
    });
    if (!item) throw new NotFoundException('Item no encontrado');

    if (item.status !== 'pending') {
      throw new BadRequestException('Solo se pueden eliminar items pendientes');
    }

    await this.prisma.orderItemModifier.deleteMany({ where: { orderItemId: itemId } });
    await this.prisma.orderItem.delete({ where: { id: itemId } });
    await this.recalculateTotals(orderId);

    return { success: true };
  }

  async updateItemStatus(itemId: string, status: string) {
    const now = new Date();
    const updateData: any = { status };

    switch (status) {
      case 'sent_to_kitchen':
        updateData.sentToKitchenAt = now;
        break;
      case 'preparing':
        updateData.prepStartedAt = now;
        break;
      case 'ready':
        updateData.readyAt = now;
        break;
      case 'delivered':
        updateData.deliveredAt = now;
        break;
    }

    return this.prisma.orderItem.update({
      where: { id: itemId },
      data: updateData,
      include: {
        productVariant: { include: { product: true } },
        modifiers: { include: { modifier: true } },
      },
    });
  }

  async sendToKitchen(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          where: { status: 'pending' },
          include: {
            productVariant: {
              include: { product: { include: { kitchenStation: true } } },
            },
            modifiers: { include: { modifier: true } },
          },
        },
      },
    });

    if (!order) throw new NotFoundException('Orden no encontrada');
    if (order.items.length === 0) {
      throw new BadRequestException('No hay items pendientes para enviar a cocina');
    }

    // Mark items as sent to kitchen
    const now = new Date();
    await this.prisma.orderItem.updateMany({
      where: {
        orderId,
        status: 'pending',
      },
      data: {
        status: 'sent_to_kitchen',
        sentToKitchenAt: now,
      },
    });

    // Group items by kitchen station and create KDS tickets
    const stationGroups = new Map<string, string[]>();
    for (const item of order.items) {
      const stationId = item.productVariant.product.kitchenStationId;
      if (stationId) {
        if (!stationGroups.has(stationId)) {
          stationGroups.set(stationId, []);
        }
        stationGroups.get(stationId)!.push(item.id);
      }
    }

    const kdsTickets = [];
    for (const [stationId, itemIds] of stationGroups) {
      const ticket = await this.prisma.kdsTicket.create({
        data: {
          orderId,
          kitchenStationId: stationId,
          items: {
            create: itemIds.map((orderItemId) => ({ orderItemId })),
          },
        },
        include: {
          kitchenStation: true,
          items: {
            include: {
              orderItem: {
                include: {
                  productVariant: { include: { product: true } },
                  modifiers: { include: { modifier: true } },
                },
              },
            },
          },
          order: { include: { table: true } },
        },
      });
      kdsTickets.push(ticket);
    }

    // Update order status
    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'in_progress' },
    });

    // Update table status
    if (order.tableId) {
      await this.prisma.table.update({
        where: { id: order.tableId },
        data: { status: 'waiting_food' },
      });
    }

    return { order: await this.findById(orderId), kdsTickets };
  }

  async applyDiscount(orderId: string, discountType: string, discountAmount: number) {
    await this.prisma.order.update({
      where: { id: orderId },
      data: { discountType, discountAmount },
    });
    return this.recalculateTotals(orderId);
  }

  async addTip(orderId: string, tipAmount: number) {
    await this.prisma.order.update({
      where: { id: orderId },
      data: { tipAmount },
    });
    return this.recalculateTotals(orderId);
  }

  async closeOrder(orderId: string, cashierId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true },
    });

    if (!order) throw new NotFoundException('Orden no encontrada');

    const totalPaid = order.payments.reduce(
      (sum, p) => sum.add(p.amount),
      new Decimal(0),
    );

    if (totalPaid.lt(order.total)) {
      throw new BadRequestException('Falta pago para cerrar la orden');
    }

    const closedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'closed',
        cashierId,
        closedAt: new Date(),
      },
    });

    // Free the table
    if (order.tableId) {
      // Check if table has other open orders
      const otherOrders = await this.prisma.order.count({
        where: {
          tableId: order.tableId,
          status: { notIn: ['closed', 'cancelled', 'void'] },
          id: { not: orderId },
        },
      });

      if (otherOrders === 0) {
        await this.prisma.table.update({
          where: { id: order.tableId },
          data: { status: 'free' },
        });
      }
    }

    return closedOrder;
  }

  async voidOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Orden no encontrada');

    await this.prisma.order.update({
      where: { id: orderId },
      data: { status: 'void' },
    });

    if (order.tableId) {
      const otherOrders = await this.prisma.order.count({
        where: {
          tableId: order.tableId,
          status: { notIn: ['closed', 'cancelled', 'void'] },
          id: { not: orderId },
        },
      });
      if (otherOrders === 0) {
        await this.prisma.table.update({
          where: { id: order.tableId },
          data: { status: 'free' },
        });
      }
    }

    return { success: true };
  }

  async splitOrder(orderId: string, itemIds: string[], newTableId?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Orden no encontrada');

    // Create child order
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const lastOrder = await this.prisma.order.findFirst({
      where: { branchId: order.branchId, createdAt: { gte: today, lt: tomorrow } },
      orderBy: { orderNumber: 'desc' },
    });

    const newOrder = await this.prisma.order.create({
      data: {
        branchId: order.branchId,
        orderNumber: (lastOrder?.orderNumber ?? 0) + 1,
        type: order.type,
        tableId: newTableId || order.tableId,
        waiterId: order.waiterId,
        parentOrderId: orderId,
      },
    });

    // Move items to new order
    await this.prisma.orderItem.updateMany({
      where: { id: { in: itemIds }, orderId },
      data: { orderId: newOrder.id },
    });

    // Recalculate both orders
    await this.recalculateTotals(orderId);
    await this.recalculateTotals(newOrder.id);

    return {
      originalOrder: await this.findById(orderId),
      newOrder: await this.findById(newOrder.id),
    };
  }

  private async recalculateTotals(orderId: string) {
    const items = await this.prisma.orderItem.findMany({
      where: { orderId, status: { not: 'cancelled' } },
    });

    const subtotal = items.reduce(
      (sum, item) => sum.add(item.subtotal),
      new Decimal(0),
    );

    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return;

    let discountAmount = order.discountAmount;
    if (order.discountType === 'percentage') {
      discountAmount = subtotal.mul(order.discountAmount).div(100);
    }

    const taxableAmount = subtotal.sub(discountAmount);
    const taxAmount = new Decimal(0); // No tax for now
    const total = taxableAmount.add(taxAmount).add(order.tipAmount);

    return this.prisma.order.update({
      where: { id: orderId },
      data: { subtotal, discountAmount, taxAmount, total },
    });
  }
}
