import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BranchesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.branch.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async findById(id: string) {
    const branch = await this.prisma.branch.findUnique({ where: { id } });
    if (!branch) throw new NotFoundException('Sucursal no encontrada');
    return branch;
  }

  async create(data: {
    name: string;
    address?: string;
    phone?: string;
    timezone?: string;
    currency?: string;
    settings?: any;
  }) {
    return this.prisma.branch.create({ data });
  }

  async update(id: string, data: {
    name?: string;
    address?: string;
    phone?: string;
    timezone?: string;
    currency?: string;
    settings?: any;
    isActive?: boolean;
  }) {
    return this.prisma.branch.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.branch.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
