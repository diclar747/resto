import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { randomBytes } from 'crypto';

export type TableStatus =
  | 'free'
  | 'occupied'
  | 'waiting_order'
  | 'waiting_food'
  | 'bill_requested'
  | 'reserved';

const VALID_STATUSES: TableStatus[] = [
  'free',
  'occupied',
  'waiting_order',
  'waiting_food',
  'bill_requested',
  'reserved',
];

/**
 * Allowed status transitions map.
 * Key: current status -> Value: set of statuses it can move to.
 */
const STATUS_TRANSITIONS: Record<TableStatus, TableStatus[]> = {
  free: ['occupied', 'reserved'],
  reserved: ['free', 'occupied'],
  occupied: ['waiting_order', 'free'],
  waiting_order: ['waiting_food', 'occupied', 'free'],
  waiting_food: ['bill_requested', 'waiting_order', 'free'],
  bill_requested: ['free', 'occupied'],
};

export interface CreateTableDto {
  branchId: string;
  number: number;
  name?: string;
  zone?: string;
  capacity?: number;
  posX?: number;
  posY?: number;
  shape?: string;
}

export interface UpdateTableDto {
  number?: number;
  name?: string;
  zone?: string;
  capacity?: number;
  posX?: number;
  posY?: number;
  shape?: string;
  isActive?: boolean;
}

export interface MergeTablesDto {
  tableIds: string[];
  targetTableId: string;
}

export interface SplitTableDto {
  tableId: string;
  itemIds: string[];
  newTableId: string;
}

@Injectable()
export class TablesService {
  constructor(private prisma: PrismaService) {}

  // ─────────────────────────────────────────────
  // findAll
  // ─────────────────────────────────────────────
  async findAll(branchId: string) {
    const tables = await this.prisma.table.findMany({
      where: { branchId, isActive: true },
      orderBy: [{ zone: 'asc' }, { number: 'asc' }],
      include: {
        orders: {
          where: { status: { notIn: ['closed', 'cancelled'] } },
          select: {
            id: true,
            orderNumber: true,
            status: true,
            type: true,
            guestCount: true,
            subtotal: true,
            total: true,
            createdAt: true,
            waiter: {
              select: { id: true, firstName: true, lastName: true },
            },
            _count: { select: { items: true } },
          },
        },
      },
    });

    return tables.map((table) => ({
      ...table,
      currentOrder: table.orders[0] ?? null,
      activeOrderCount: table.orders.length,
    }));
  }

  // ─────────────────────────────────────────────
  // findById
  // ─────────────────────────────────────────────
  async findById(id: string) {
    const table = await this.prisma.table.findUnique({
      where: { id },
      include: {
        orders: {
          where: { status: { notIn: ['closed', 'cancelled'] } },
          include: {
            items: {
              include: {
                productVariant: {
                  include: { product: { select: { id: true, name: true } } },
                },
                modifiers: {
                  include: { modifier: { select: { id: true, name: true, priceAdjustment: true } } },
                },
              },
            },
            waiter: { select: { id: true, firstName: true, lastName: true } },
            payments: { select: { id: true, method: true, amount: true, status: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!table) {
      throw new NotFoundException(`Table with id "${id}" not found`);
    }

    return table;
  }

  // ─────────────────────────────────────────────
  // create
  // ─────────────────────────────────────────────
  async create(data: CreateTableDto) {
    // Check uniqueness of table number within branch
    const existing = await this.prisma.table.findUnique({
      where: { branchId_number: { branchId: data.branchId, number: data.number } },
    });

    if (existing) {
      throw new ConflictException(
        `Table number ${data.number} already exists in this branch`,
      );
    }

    return this.prisma.table.create({
      data: {
        branchId: data.branchId,
        number: data.number,
        name: data.name,
        zone: data.zone,
        capacity: data.capacity ?? 4,
        posX: data.posX,
        posY: data.posY,
        shape: data.shape ?? 'square',
        status: 'free',
        isActive: true,
      },
    });
  }

  // ─────────────────────────────────────────────
  // update
  // ─────────────────────────────────────────────
  async update(id: string, data: UpdateTableDto) {
    const table = await this.prisma.table.findUnique({ where: { id } });

    if (!table) {
      throw new NotFoundException(`Table with id "${id}" not found`);
    }

    // If the number is changing, check uniqueness within branch
    if (data.number !== undefined && data.number !== table.number) {
      const existing = await this.prisma.table.findUnique({
        where: { branchId_number: { branchId: table.branchId, number: data.number } },
      });
      if (existing) {
        throw new ConflictException(
          `Table number ${data.number} already exists in this branch`,
        );
      }
    }

    return this.prisma.table.update({
      where: { id },
      data: {
        ...(data.number !== undefined && { number: data.number }),
        ...(data.name !== undefined && { name: data.name }),
        ...(data.zone !== undefined && { zone: data.zone }),
        ...(data.capacity !== undefined && { capacity: data.capacity }),
        ...(data.posX !== undefined && { posX: data.posX }),
        ...(data.posY !== undefined && { posY: data.posY }),
        ...(data.shape !== undefined && { shape: data.shape }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
  }

  // ─────────────────────────────────────────────
  // delete (soft delete)
  // ─────────────────────────────────────────────
  async delete(id: string) {
    const table = await this.prisma.table.findUnique({ where: { id } });

    if (!table) {
      throw new NotFoundException(`Table with id "${id}" not found`);
    }

    // Prevent deleting a table that has active orders
    const activeOrders = await this.prisma.order.count({
      where: { tableId: id, status: { notIn: ['closed', 'cancelled'] } },
    });

    if (activeOrders > 0) {
      throw new BadRequestException(
        'Cannot delete a table that has active orders. Close or reassign orders first.',
      );
    }

    return this.prisma.table.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ─────────────────────────────────────────────
  // updateStatus
  // ─────────────────────────────────────────────
  async updateStatus(id: string, status: TableStatus) {
    if (!VALID_STATUSES.includes(status)) {
      throw new BadRequestException(
        `Invalid status "${status}". Valid values: ${VALID_STATUSES.join(', ')}`,
      );
    }

    const table = await this.prisma.table.findUnique({ where: { id } });

    if (!table) {
      throw new NotFoundException(`Table with id "${id}" not found`);
    }

    const currentStatus = table.status as TableStatus;
    const allowedTransitions = STATUS_TRANSITIONS[currentStatus] ?? [];

    if (!allowedTransitions.includes(status)) {
      throw new BadRequestException(
        `Invalid status transition from "${currentStatus}" to "${status}". ` +
          `Allowed transitions: ${allowedTransitions.join(', ') || 'none'}`,
      );
    }

    return this.prisma.table.update({
      where: { id },
      data: { status },
    });
  }

  // ─────────────────────────────────────────────
  // generateQrCode
  // ─────────────────────────────────────────────
  async generateQrCode(id: string) {
    const table = await this.prisma.table.findUnique({ where: { id } });

    if (!table) {
      throw new NotFoundException(`Table with id "${id}" not found`);
    }

    // Generate a unique, URL-safe QR code token
    const token = randomBytes(16).toString('hex');
    const qrCode = `table:${table.branchId}:${id}:${token}`;

    const updated = await this.prisma.table.update({
      where: { id },
      data: { qrCode },
    });

    return { qrCode: updated.qrCode, tableId: id, tableNumber: table.number };
  }

  // ─────────────────────────────────────────────
  // mergeTables
  // ─────────────────────────────────────────────
  async mergeTables(tableIds: string[], targetTableId: string) {
    if (!tableIds || tableIds.length === 0) {
      throw new BadRequestException('At least one source table ID must be provided');
    }

    if (tableIds.includes(targetTableId)) {
      throw new BadRequestException('Target table cannot be in the list of source tables');
    }

    // Verify all source tables exist and are active
    const sourceTables = await this.prisma.table.findMany({
      where: { id: { in: tableIds }, isActive: true },
    });

    if (sourceTables.length !== tableIds.length) {
      throw new NotFoundException('One or more source tables were not found or are inactive');
    }

    // Verify target table exists and is active
    const targetTable = await this.prisma.table.findUnique({
      where: { id: targetTableId },
    });

    if (!targetTable || !targetTable.isActive) {
      throw new NotFoundException(`Target table "${targetTableId}" not found or is inactive`);
    }

    // Move all active orders from source tables to the target table
    const result = await this.prisma.$transaction(async (tx) => {
      const updatedOrders = await tx.order.updateMany({
        where: {
          tableId: { in: tableIds },
          status: { notIn: ['closed', 'cancelled'] },
        },
        data: { tableId: targetTableId },
      });

      // Set source tables back to 'free'
      await tx.table.updateMany({
        where: { id: { in: tableIds } },
        data: { status: 'free' },
      });

      // Set the target table to 'occupied' if it had or received any orders
      await tx.table.update({
        where: { id: targetTableId },
        data: { status: 'occupied' },
      });

      return { movedOrderCount: updatedOrders.count, targetTableId };
    });

    return {
      message: 'Tables merged successfully',
      ...result,
    };
  }

  // ─────────────────────────────────────────────
  // splitTable
  // ─────────────────────────────────────────────
  async splitTable(tableId: string, itemIds: string[], newTableId: string) {
    if (!itemIds || itemIds.length === 0) {
      throw new BadRequestException('At least one order item ID must be provided');
    }

    // Verify source table exists
    const sourceTable = await this.prisma.table.findUnique({
      where: { id: tableId },
    });

    if (!sourceTable || !sourceTable.isActive) {
      throw new NotFoundException(`Source table "${tableId}" not found or is inactive`);
    }

    // Verify destination table exists
    const destTable = await this.prisma.table.findUnique({
      where: { id: newTableId },
    });

    if (!destTable || !destTable.isActive) {
      throw new NotFoundException(`Destination table "${newTableId}" not found or is inactive`);
    }

    // Find the active order on the source table
    const sourceOrder = await this.prisma.order.findFirst({
      where: {
        tableId,
        status: { notIn: ['closed', 'cancelled'] },
      },
      include: {
        items: true,
      },
    });

    if (!sourceOrder) {
      throw new BadRequestException(`No active order found on table "${tableId}"`);
    }

    // Verify that all the provided item IDs belong to the source order
    const sourceItemIds = sourceOrder.items.map((i) => i.id);
    const invalidItems = itemIds.filter((id) => !sourceItemIds.includes(id));

    if (invalidItems.length > 0) {
      throw new BadRequestException(
        `The following item IDs do not belong to the active order on this table: ${invalidItems.join(', ')}`,
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Determine the next order number within the branch
      const lastOrder = await tx.order.findFirst({
        where: { branchId: sourceOrder.branchId },
        orderBy: { orderNumber: 'desc' },
        select: { orderNumber: true },
      });

      const newOrderNumber = (lastOrder?.orderNumber ?? 0) + 1;

      // Create a new order on the destination table, linked to the source order
      const newOrder = await tx.order.create({
        data: {
          branchId: sourceOrder.branchId,
          orderNumber: newOrderNumber,
          type: sourceOrder.type,
          status: sourceOrder.status,
          tableId: newTableId,
          waiterId: sourceOrder.waiterId,
          guestCount: null,
          notes: sourceOrder.notes,
          subtotal: 0,
          discountAmount: 0,
          taxAmount: 0,
          tipAmount: 0,
          total: 0,
          parentOrderId: sourceOrder.id,
        },
      });

      // Move the specified items to the new order
      await tx.orderItem.updateMany({
        where: { id: { in: itemIds }, orderId: sourceOrder.id },
        data: { orderId: newOrder.id },
      });

      // Recalculate subtotals for both orders based on remaining/moved items
      const [remainingItems, movedItems] = await Promise.all([
        tx.orderItem.findMany({ where: { orderId: sourceOrder.id } }),
        tx.orderItem.findMany({ where: { orderId: newOrder.id } }),
      ]);

      const sumItems = (items: { subtotal: any }[]) =>
        items.reduce((acc, i) => acc + Number(i.subtotal), 0);

      const sourceSubtotal = sumItems(remainingItems);
      const newSubtotal = sumItems(movedItems);

      await tx.order.update({
        where: { id: sourceOrder.id },
        data: {
          subtotal: sourceSubtotal,
          total: sourceSubtotal,
        },
      });

      await tx.order.update({
        where: { id: newOrder.id },
        data: {
          subtotal: newSubtotal,
          total: newSubtotal,
        },
      });

      // Mark the destination table as occupied
      await tx.table.update({
        where: { id: newTableId },
        data: { status: 'occupied' },
      });

      return {
        originalOrderId: sourceOrder.id,
        newOrderId: newOrder.id,
        newOrderNumber,
        movedItemCount: itemIds.length,
      };
    });

    return {
      message: 'Table split successfully',
      ...result,
    };
  }
}
