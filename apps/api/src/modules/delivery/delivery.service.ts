import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type DeliveryStatus =
  | 'pending'
  | 'assigned'
  | 'picked_up'
  | 'in_transit'
  | 'delivered';

const STATUS_TRANSITIONS: Record<DeliveryStatus, DeliveryStatus[]> = {
  pending: ['assigned'],
  assigned: ['picked_up'],
  picked_up: ['in_transit'],
  in_transit: ['delivered'],
  delivered: [],
};

const deliveryInclude = {
  order: {
    include: {
      items: {
        include: {
          productVariant: { include: { product: true } },
          modifiers: { include: { modifier: true } },
        },
      },
      payments: true,
      table: true,
    },
  },
  driver: {
    select: { id: true, firstName: true, lastName: true, phone: true },
  },
} as const;

@Injectable()
export class DeliveryService {
  constructor(private prisma: PrismaService) {}

  async findAll(branchId: string, status?: string) {
    const where: any = { order: { branchId } };
    if (status) where.status = status;

    return this.prisma.delivery.findMany({
      where,
      include: deliveryInclude,
      orderBy: { order: { createdAt: 'desc' } },
    });
  }

  async findById(id: string) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id },
      include: deliveryInclude,
    });
    if (!delivery) throw new NotFoundException('Delivery no encontrado');
    return delivery;
  }

  async createDelivery(data: {
    orderId: string;
    customerName: string;
    customerPhone: string;
    deliveryAddress: string;
    deliveryFee: number;
    notes?: string;
  }) {
    const order = await this.prisma.order.findUnique({
      where: { id: data.orderId },
    });
    if (!order) throw new NotFoundException('Orden no encontrada');

    const existing = await this.prisma.delivery.findUnique({
      where: { orderId: data.orderId },
    });
    if (existing) {
      throw new BadRequestException(
        'Ya existe un delivery para esta orden',
      );
    }

    return this.prisma.delivery.create({
      data: {
        orderId: data.orderId,
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        deliveryAddress: data.deliveryAddress,
        deliveryFee: data.deliveryFee,
        notes: data.notes,
        status: 'pending',
      },
      include: deliveryInclude,
    });
  }

  async assignDriver(deliveryId: string, driverId: string) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
    });
    if (!delivery) throw new NotFoundException('Delivery no encontrado');

    const driver = await this.prisma.user.findUnique({
      where: { id: driverId },
    });
    if (!driver) throw new NotFoundException('Conductor no encontrado');

    if (delivery.status !== 'pending') {
      throw new BadRequestException(
        'Solo se puede asignar conductor en estado pendiente',
      );
    }

    return this.prisma.delivery.update({
      where: { id: deliveryId },
      data: {
        driverId,
        status: 'assigned',
        assignedAt: new Date(),
      },
      include: deliveryInclude,
    });
  }

  async updateStatus(deliveryId: string, status: DeliveryStatus) {
    const delivery = await this.prisma.delivery.findUnique({
      where: { id: deliveryId },
    });
    if (!delivery) throw new NotFoundException('Delivery no encontrado');

    const currentStatus = delivery.status as DeliveryStatus;
    const allowed = STATUS_TRANSITIONS[currentStatus];
    if (!allowed.includes(status)) {
      throw new BadRequestException(
        `No se puede transicionar de "${currentStatus}" a "${status}"`,
      );
    }

    const updateData: any = { status };
    if (status === 'picked_up') updateData.pickedUpAt = new Date();
    if (status === 'delivered') updateData.deliveredAt = new Date();

    return this.prisma.delivery.update({
      where: { id: deliveryId },
      data: updateData,
      include: deliveryInclude,
    });
  }

  async findByDriver(driverId: string) {
    return this.prisma.delivery.findMany({
      where: { driverId },
      include: deliveryInclude,
      orderBy: { order: { createdAt: 'desc' } },
    });
  }
}
