import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

interface TicketModifier {
  name: string;
  priceAdjustment: string;
}

interface TicketItem {
  name: string;
  variant: string;
  quantity: number;
  unitPrice: string;
  subtotal: string;
  notes?: string;
  modifiers: TicketModifier[];
}

interface TicketContent {
  header: {
    branchId: string;
    orderNumber: number;
    orderType: string;
    tableNumber?: number;
    tableName?: string;
    waiter?: string;
    cashier?: string;
  };
  date: string;
  items: TicketItem[];
  subtotal: string;
  discountAmount: string;
  discountType?: string;
  taxAmount: string;
  tipAmount: string;
  total: string;
  payments: Array<{ method: string; amount: string }>;
  footer: string;
}

@Injectable()
export class TicketsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generate a new ticket for an order.
   * Builds the full ticket content JSON and persists it.
   */
  async generateTicket(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        branch: true,
        table: true,
        waiter: { select: { firstName: true, lastName: true } },
        cashier: { select: { firstName: true, lastName: true } },
        items: {
          where: { status: { not: 'cancelled' } },
          include: {
            productVariant: { include: { product: true } },
            modifiers: { include: { modifier: true } },
          },
          orderBy: { courseNumber: 'asc' },
        },
        payments: { where: { status: 'completed' } },
        tickets: { orderBy: { printedAt: 'desc' }, take: 1 },
      },
    });

    if (!order) throw new NotFoundException('Orden no encontrada');

    // Build ticket number: reuse last existing ticket number or generate a new one
    const lastTicket = order.tickets[0];
    const ticketNumber = lastTicket
      ? lastTicket.ticketNumber
      : this.buildTicketNumber(order.orderNumber, order.createdAt);

    const ticketItems: TicketItem[] = order.items.map((item) => ({
      name: item.productVariant.product.name,
      variant: item.productVariant.name,
      quantity: item.quantity,
      unitPrice: new Decimal(item.unitPrice.toString()).toFixed(2),
      subtotal: new Decimal(item.subtotal.toString()).toFixed(2),
      notes: item.notes ?? undefined,
      modifiers: item.modifiers.map((m) => ({
        name: m.modifier.name,
        priceAdjustment: new Decimal(
          m.priceAdjustment.toString(),
        ).toFixed(2),
      })),
    }));

    const content: TicketContent = {
      header: {
        branchId: order.branchId,
        orderNumber: order.orderNumber,
        orderType: order.type,
        tableNumber: order.table?.number,
        tableName: order.table?.name ?? undefined,
        waiter: order.waiter
          ? `${order.waiter.firstName} ${order.waiter.lastName}`
          : undefined,
        cashier: order.cashier
          ? `${order.cashier.firstName} ${order.cashier.lastName}`
          : undefined,
      },
      date: new Date().toISOString(),
      items: ticketItems,
      subtotal: new Decimal(order.subtotal.toString()).toFixed(2),
      discountAmount: new Decimal(order.discountAmount.toString()).toFixed(2),
      discountType: order.discountType ?? undefined,
      taxAmount: new Decimal(order.taxAmount.toString()).toFixed(2),
      tipAmount: new Decimal(order.tipAmount.toString()).toFixed(2),
      total: new Decimal(order.total.toString()).toFixed(2),
      payments: order.payments.map((p) => ({
        method: p.method,
        amount: new Decimal(p.amount.toString()).toFixed(2),
      })),
      footer: '¡Gracias por su visita!',
    };

    const ticket = await this.prisma.ticket.create({
      data: {
        orderId,
        ticketNumber,
        content: content as any,
        reprintCount: 0,
      },
      include: { order: { select: { orderNumber: true, branchId: true } } },
    });

    return ticket;
  }

  /**
   * Find all tickets for an order.
   */
  async findByOrder(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException('Orden no encontrada');

    return this.prisma.ticket.findMany({
      where: { orderId },
      orderBy: { printedAt: 'desc' },
    });
  }

  /**
   * Increment the reprint counter for an existing ticket.
   */
  async reprint(ticketId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });
    if (!ticket) throw new NotFoundException('Ticket no encontrado');

    return this.prisma.ticket.update({
      where: { id: ticketId },
      data: { reprintCount: { increment: 1 } },
    });
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private buildTicketNumber(orderNumber: number, date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const num = String(orderNumber).padStart(4, '0');
    return `${y}${m}${d}-${num}`;
  }
}
