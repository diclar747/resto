import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export type KdsTicketStatus =
  | 'pending'
  | 'preparing'
  | 'ready'
  | 'delivered'
  | 'bumped';

const STATUS_TRANSITIONS: Record<KdsTicketStatus, KdsTicketStatus[]> = {
  pending: ['preparing'],
  preparing: ['ready'],
  ready: ['delivered', 'bumped'],
  delivered: ['bumped'],
  bumped: [],
};

@Injectable()
export class KdsService {
  constructor(private prisma: PrismaService) {}

  // ─── Tickets ─────────────────────────────────────────────────────────────

  async findTickets(
    branchId: string,
    stationId?: string,
    status?: string,
  ) {
    const where: any = {
      order: { branchId },
    };

    if (stationId) {
      where.kitchenStationId = stationId;
    }

    if (status) {
      where.status = status;
    }

    return this.prisma.kdsTicket.findMany({
      where,
      include: {
        kitchenStation: true,
        order: {
          include: {
            table: { select: { id: true, number: true, name: true, zone: true } },
            waiter: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        items: {
          include: {
            orderItem: {
              include: {
                productVariant: {
                  include: {
                    product: {
                      select: {
                        id: true,
                        name: true,
                        prepTime: true,
                        kitchenStationId: true,
                      },
                    },
                  },
                },
                modifiers: {
                  include: {
                    modifier: { select: { id: true, name: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async findTicketById(id: string) {
    const ticket = await this.prisma.kdsTicket.findUnique({
      where: { id },
      include: {
        kitchenStation: true,
        order: {
          include: {
            table: { select: { id: true, number: true, name: true, zone: true } },
            waiter: { select: { id: true, firstName: true, lastName: true } },
            client: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        items: {
          include: {
            orderItem: {
              include: {
                productVariant: {
                  include: {
                    product: {
                      select: {
                        id: true,
                        name: true,
                        prepTime: true,
                        kitchenStationId: true,
                      },
                    },
                  },
                },
                modifiers: {
                  include: {
                    modifier: { select: { id: true, name: true, priceAdjustment: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException(`KDS ticket ${id} not found`);
    }

    return ticket;
  }

  async updateTicketStatus(id: string, status: KdsTicketStatus) {
    const ticket = await this.prisma.kdsTicket.findUnique({ where: { id } });
    if (!ticket) {
      throw new NotFoundException(`KDS ticket ${id} not found`);
    }

    const currentStatus = ticket.status as KdsTicketStatus;
    const allowed = STATUS_TRANSITIONS[currentStatus];

    if (!allowed.includes(status)) {
      throw new BadRequestException(
        `Cannot transition ticket from '${currentStatus}' to '${status}'. ` +
          `Allowed transitions: ${allowed.join(', ') || 'none'}`,
      );
    }

    const now = new Date();
    const updateData: any = { status };

    if (status === 'preparing' && !ticket.startedAt) {
      updateData.startedAt = now;
    }

    if (status === 'ready' || status === 'delivered' || status === 'bumped') {
      if (!ticket.completedAt) {
        updateData.completedAt = now;
      }
    }

    const updated = await this.prisma.kdsTicket.update({
      where: { id },
      data: updateData,
      include: {
        kitchenStation: true,
        order: {
          include: {
            table: { select: { id: true, number: true, name: true, zone: true } },
            waiter: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        items: {
          include: {
            orderItem: {
              include: {
                productVariant: {
                  include: { product: { select: { id: true, name: true } } },
                },
                modifiers: {
                  include: { modifier: { select: { id: true, name: true } } },
                },
              },
            },
          },
        },
      },
    });

    return updated;
  }

  async bumpTicket(id: string) {
    const ticket = await this.prisma.kdsTicket.findUnique({ where: { id } });
    if (!ticket) {
      throw new NotFoundException(`KDS ticket ${id} not found`);
    }

    const bumpableStatuses: KdsTicketStatus[] = ['ready', 'delivered'];
    if (!bumpableStatuses.includes(ticket.status as KdsTicketStatus)) {
      throw new BadRequestException(
        `Ticket can only be bumped from 'ready' or 'delivered' status. ` +
          `Current status: '${ticket.status}'`,
      );
    }

    const now = new Date();
    const updated = await this.prisma.kdsTicket.update({
      where: { id },
      data: {
        status: 'bumped',
        completedAt: ticket.completedAt ?? now,
      },
      include: {
        kitchenStation: true,
        order: {
          include: {
            table: { select: { id: true, number: true, name: true, zone: true } },
            waiter: { select: { id: true, firstName: true, lastName: true } },
          },
        },
        items: {
          include: {
            orderItem: {
              include: {
                productVariant: {
                  include: { product: { select: { id: true, name: true } } },
                },
              },
            },
          },
        },
      },
    });

    return updated;
  }

  // ─── Stations ────────────────────────────────────────────────────────────

  async findStations(branchId: string) {
    return this.prisma.kitchenStation.findMany({
      where: { branchId, isActive: true },
      include: {
        _count: {
          select: {
            kdsTickets: true,
            products: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createStation(data: {
    branchId: string;
    name: string;
    color?: string;
  }) {
    return this.prisma.kitchenStation.create({
      data: {
        branchId: data.branchId,
        name: data.name,
        color: data.color,
      },
    });
  }

  async updateStation(
    id: string,
    data: { name?: string; color?: string; isActive?: boolean },
  ) {
    const station = await this.prisma.kitchenStation.findUnique({ where: { id } });
    if (!station) {
      throw new NotFoundException(`Kitchen station ${id} not found`);
    }

    return this.prisma.kitchenStation.update({
      where: { id },
      data,
    });
  }

  async deleteStation(id: string) {
    const station = await this.prisma.kitchenStation.findUnique({ where: { id } });
    if (!station) {
      throw new NotFoundException(`Kitchen station ${id} not found`);
    }

    // Soft-delete: mark as inactive rather than hard-delete to preserve ticket history
    return this.prisma.kitchenStation.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ─── Statistics ──────────────────────────────────────────────────────────

  async getAveragePrepTime(branchId: string, stationId?: string) {
    const where: any = {
      order: { branchId },
      startedAt: { not: null },
      completedAt: { not: null },
      status: { in: ['ready', 'delivered', 'bumped'] },
    };

    if (stationId) {
      where.kitchenStationId = stationId;
    }

    const tickets = await this.prisma.kdsTicket.findMany({
      where,
      select: {
        id: true,
        kitchenStationId: true,
        startedAt: true,
        completedAt: true,
        kitchenStation: { select: { id: true, name: true, color: true } },
      },
    });

    if (tickets.length === 0) {
      return {
        averagePrepTimeSeconds: null,
        averagePrepTimeMinutes: null,
        ticketCount: 0,
        stationId: stationId ?? null,
      };
    }

    const totalSeconds = tickets.reduce((acc, ticket) => {
      const diffMs =
        ticket.completedAt!.getTime() - ticket.startedAt!.getTime();
      return acc + diffMs / 1000;
    }, 0);

    const averageSeconds = totalSeconds / tickets.length;

    // If no specific station requested, also break down by station
    let byStation: any[] | undefined;
    if (!stationId) {
      const stationMap = new Map<
        string,
        { station: any; totalSeconds: number; count: number }
      >();

      for (const ticket of tickets) {
        const entry = stationMap.get(ticket.kitchenStationId);
        const diffMs =
          ticket.completedAt!.getTime() - ticket.startedAt!.getTime();
        if (entry) {
          entry.totalSeconds += diffMs / 1000;
          entry.count += 1;
        } else {
          stationMap.set(ticket.kitchenStationId, {
            station: ticket.kitchenStation,
            totalSeconds: diffMs / 1000,
            count: 1,
          });
        }
      }

      byStation = Array.from(stationMap.values()).map((entry) => ({
        station: entry.station,
        averagePrepTimeSeconds: Math.round(entry.totalSeconds / entry.count),
        averagePrepTimeMinutes: parseFloat(
          (entry.totalSeconds / entry.count / 60).toFixed(2),
        ),
        ticketCount: entry.count,
      }));
    }

    return {
      averagePrepTimeSeconds: Math.round(averageSeconds),
      averagePrepTimeMinutes: parseFloat((averageSeconds / 60).toFixed(2)),
      ticketCount: tickets.length,
      stationId: stationId ?? null,
      ...(byStation ? { byStation } : {}),
    };
  }
}
