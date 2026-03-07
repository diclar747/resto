import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class CrmService {
  constructor(private prisma: PrismaService) {}

  // ----------------------------------------------------------------
  // Clients
  // ----------------------------------------------------------------

  async findAll(search?: string) {
    const where: Prisma.ClientWhereInput = { isActive: true };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.client.findMany({
      where,
      orderBy: { firstName: 'asc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        address: true,
        birthday: true,
        loyaltyPoints: true,
        totalSpent: true,
        visitCount: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findById(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: {
        orders: {
          where: { status: 'closed' },
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            orderNumber: true,
            total: true,
            status: true,
            createdAt: true,
            branch: { select: { id: true, name: true } },
          },
        },
        loyaltyHistory: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    });

    if (!client) throw new NotFoundException(`Client ${id} not found`);
    return client;
  }

  async create(data: {
    firstName: string;
    lastName?: string;
    email?: string;
    phone?: string;
    address?: string;
    birthday?: string;
    notes?: string;
  }) {
    const { birthday, ...rest } = data;
    return this.prisma.client.create({
      data: {
        ...rest,
        birthday: birthday ? new Date(birthday) : undefined,
      },
    });
  }

  async update(
    id: string,
    data: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      address?: string;
      birthday?: string;
      notes?: string;
    },
  ) {
    await this.findById(id);
    const { birthday, ...rest } = data;
    return this.prisma.client.update({
      where: { id },
      data: {
        ...rest,
        birthday: birthday ? new Date(birthday) : undefined,
      },
    });
  }

  async delete(id: string) {
    await this.findById(id);
    return this.prisma.client.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ----------------------------------------------------------------
  // Loyalty
  // ----------------------------------------------------------------

  async addLoyaltyPoints(
    clientId: string,
    points: number,
    reason: string,
    orderId?: string,
  ) {
    if (points <= 0) {
      throw new BadRequestException('Points must be a positive number');
    }

    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });
    if (!client || !client.isActive) {
      throw new NotFoundException(`Client ${clientId} not found`);
    }

    const [history] = await this.prisma.$transaction([
      this.prisma.loyaltyHistory.create({
        data: {
          clientId,
          points,
          reason,
          orderId,
        },
      }),
      this.prisma.client.update({
        where: { id: clientId },
        data: { loyaltyPoints: { increment: points } },
      }),
    ]);

    const updatedClient = await this.prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true, firstName: true, lastName: true, loyaltyPoints: true },
    });

    return { history, client: updatedClient };
  }

  async redeemPoints(clientId: string, points: number) {
    if (points <= 0) {
      throw new BadRequestException('Points to redeem must be a positive number');
    }

    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });
    if (!client || !client.isActive) {
      throw new NotFoundException(`Client ${clientId} not found`);
    }

    if (client.loyaltyPoints < points) {
      throw new BadRequestException(
        `Insufficient loyalty points. Available: ${client.loyaltyPoints}, requested: ${points}`,
      );
    }

    const [history] = await this.prisma.$transaction([
      this.prisma.loyaltyHistory.create({
        data: {
          clientId,
          points: -points,
          reason: 'Points redeemed',
        },
      }),
      this.prisma.client.update({
        where: { id: clientId },
        data: { loyaltyPoints: { decrement: points } },
      }),
    ]);

    const updatedClient = await this.prisma.client.findUnique({
      where: { id: clientId },
      select: { id: true, firstName: true, lastName: true, loyaltyPoints: true },
    });

    return { history, client: updatedClient };
  }

  async getLoyaltyHistory(clientId: string) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });
    if (!client) throw new NotFoundException(`Client ${clientId} not found`);

    return this.prisma.loyaltyHistory.findMany({
      where: { clientId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ----------------------------------------------------------------
  // Analytics
  // ----------------------------------------------------------------

  async getTopClients(branchId: string, limit = 10) {
    // Get clients with closed orders for this branch, sorted by totalSpent
    const clients = await this.prisma.client.findMany({
      where: {
        isActive: true,
        orders: {
          some: {
            branchId,
            status: 'closed',
          },
        },
      },
      include: {
        _count: {
          select: {
            orders: {
              where: { branchId, status: 'closed' },
            },
          },
        },
      },
      orderBy: { totalSpent: 'desc' },
      take: limit,
    });

    return clients;
  }
}
