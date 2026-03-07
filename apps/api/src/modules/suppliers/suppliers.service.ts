import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class SuppliersService {
  constructor(private prisma: PrismaService) {}

  // ----------------------------------------------------------------
  // Suppliers
  // ----------------------------------------------------------------

  async findAll(branchId?: string) {
    const where: Prisma.SupplierWhereInput = { isActive: true };

    if (branchId) {
      where.branches = { some: { branchId } };
    }

    return this.prisma.supplier.findMany({
      where,
      include: {
        branches: {
          include: { branch: { select: { id: true, name: true } } },
        },
        _count: { select: { purchaseOrders: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id },
      include: {
        branches: {
          include: { branch: { select: { id: true, name: true } } },
        },
        purchaseOrders: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            items: { include: { ingredient: true } },
            payables: true,
          },
        },
      },
    });

    if (!supplier) throw new NotFoundException(`Supplier ${id} not found`);
    return supplier;
  }

  async create(data: {
    name: string;
    contactName?: string;
    email?: string;
    phone?: string;
    address?: string;
    taxId?: string;
    notes?: string;
    branchIds?: string[];
  }) {
    const { branchIds = [], ...supplierData } = data;

    return this.prisma.supplier.create({
      data: {
        ...supplierData,
        branches: {
          create: branchIds.map((branchId) => ({ branchId })),
        },
      },
      include: {
        branches: {
          include: { branch: { select: { id: true, name: true } } },
        },
      },
    });
  }

  async update(
    id: string,
    data: {
      name?: string;
      contactName?: string;
      email?: string;
      phone?: string;
      address?: string;
      taxId?: string;
      notes?: string;
      branchIds?: string[];
    },
  ) {
    await this.findById(id);

    const { branchIds, ...supplierData } = data;

    if (branchIds !== undefined) {
      // Replace all branch associations
      await this.prisma.supplierBranch.deleteMany({ where: { supplierId: id } });
      await this.prisma.supplierBranch.createMany({
        data: branchIds.map((branchId) => ({ supplierId: id, branchId })),
      });
    }

    return this.prisma.supplier.update({
      where: { id },
      data: supplierData,
      include: {
        branches: {
          include: { branch: { select: { id: true, name: true } } },
        },
      },
    });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.supplier.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ----------------------------------------------------------------
  // Purchase Orders
  // ----------------------------------------------------------------

  async createPurchaseOrder(data: {
    supplierId: string;
    branchId: string;
    items: { ingredientId: string; quantity: number; unitPrice: number }[];
    notes?: string;
    expectedDate?: string;
  }) {
    const { supplierId, branchId, items, notes, expectedDate } = data;

    const supplier = await this.prisma.supplier.findUnique({
      where: { id: supplierId },
    });
    if (!supplier || !supplier.isActive) {
      throw new NotFoundException(`Supplier ${supplierId} not found`);
    }

    if (!items || items.length === 0) {
      throw new BadRequestException('Purchase order must have at least one item');
    }

    // Build subtotal
    let subtotal = 0;
    const orderItems = items.map((item) => {
      const lineSubtotal = Number(item.quantity) * Number(item.unitPrice);
      subtotal += lineSubtotal;
      return {
        ingredientId: item.ingredientId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        subtotal: lineSubtotal,
      };
    });

    // Generate order number
    const count = await this.prisma.purchaseOrder.count();
    const orderNumber = `PO-${String(count + 1).padStart(6, '0')}`;

    const po = await this.prisma.purchaseOrder.create({
      data: {
        supplierId,
        branchId,
        orderNumber,
        status: 'pending',
        subtotal,
        taxAmount: 0,
        total: subtotal,
        notes,
        expectedDate: expectedDate ? new Date(expectedDate) : undefined,
        items: { create: orderItems },
        payables: {
          create: {
            amount: subtotal,
            dueDate: expectedDate ? new Date(expectedDate) : new Date(),
            status: 'pending',
          },
        },
      },
      include: {
        supplier: true,
        items: { include: { ingredient: true } },
        payables: true,
      },
    });

    return po;
  }

  async receivePurchaseOrder(
    purchaseOrderId: string,
    items: { ingredientId: string; receivedQty: number }[],
  ) {
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: { items: true },
    });

    if (!po) throw new NotFoundException(`Purchase order ${purchaseOrderId} not found`);
    if (po.status === 'received') {
      throw new BadRequestException('Purchase order already received');
    }

    // Update each item's received quantity and upsert stock
    await this.prisma.$transaction(async (tx) => {
      for (const received of items) {
        const poItem = po.items.find(
          (i) => i.ingredientId === received.ingredientId,
        );
        if (!poItem) continue;

        await tx.purchaseOrderItem.update({
          where: { id: poItem.id },
          data: { receivedQty: received.receivedQty },
        });

        // Upsert stock item for this branch
        const existing = await tx.stockItem.findUnique({
          where: {
            branchId_ingredientId: {
              branchId: po.branchId,
              ingredientId: received.ingredientId,
            },
          },
        });

        if (existing) {
          await tx.stockItem.update({
            where: { id: existing.id },
            data: {
              currentStock: {
                increment: received.receivedQty,
              },
              lastRestockedAt: new Date(),
            },
          });
        } else {
          await tx.stockItem.create({
            data: {
              branchId: po.branchId,
              ingredientId: received.ingredientId,
              currentStock: received.receivedQty,
              lastRestockedAt: new Date(),
            },
          });
        }
      }

      await tx.purchaseOrder.update({
        where: { id: purchaseOrderId },
        data: { status: 'received', receivedDate: new Date() },
      });
    });

    return this.prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: {
        supplier: true,
        items: { include: { ingredient: true } },
        payables: true,
      },
    });
  }

  async findPurchaseOrders(
    branchId: string,
    supplierId?: string,
    status?: string,
  ) {
    const where: Prisma.PurchaseOrderWhereInput = { branchId };
    if (supplierId) where.supplierId = supplierId;
    if (status) where.status = status;

    return this.prisma.purchaseOrder.findMany({
      where,
      include: {
        supplier: { select: { id: true, name: true } },
        items: { include: { ingredient: { select: { id: true, name: true, unit: true } } } },
        payables: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ----------------------------------------------------------------
  // Accounts Payable
  // ----------------------------------------------------------------

  async findAccountsPayable(branchId: string, status?: string) {
    const where: Prisma.AccountPayableWhereInput = {
      purchaseOrder: { branchId },
    };
    if (status) where.status = status;

    return this.prisma.accountPayable.findMany({
      where,
      include: {
        purchaseOrder: {
          include: {
            supplier: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async payAccount(accountId: string, amount: number) {
    const account = await this.prisma.accountPayable.findUnique({
      where: { id: accountId },
    });

    if (!account) throw new NotFoundException(`Account payable ${accountId} not found`);
    if (account.status === 'paid') {
      throw new BadRequestException('Account already fully paid');
    }

    const newPaidAmount = Number(account.paidAmount) + amount;
    const totalAmount = Number(account.amount);

    if (newPaidAmount > totalAmount) {
      throw new BadRequestException(
        `Payment amount exceeds outstanding balance of ${totalAmount - Number(account.paidAmount)}`,
      );
    }

    const newStatus = newPaidAmount >= totalAmount ? 'paid' : 'partial';

    return this.prisma.accountPayable.update({
      where: { id: accountId },
      data: {
        paidAmount: newPaidAmount,
        status: newStatus,
        paidDate: newStatus === 'paid' ? new Date() : null,
      },
      include: {
        purchaseOrder: {
          include: { supplier: { select: { id: true, name: true } } },
        },
      },
    });
  }
}
