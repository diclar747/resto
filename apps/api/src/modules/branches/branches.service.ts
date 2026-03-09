import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BranchesService {
  constructor(private prisma: PrismaService) {}

  async findAll(includeInactive = false) {
    return this.prisma.branch.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        users: {
          include: { user: { select: { id: true, firstName: true, lastName: true, email: true, isActive: true } }, role: true },
        },
        _count: { select: { orders: true, tables: true } },
      },
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

  async createWithAdmin(branchData: {
    name: string;
    address?: string;
    phone?: string;
    timezone?: string;
    currency?: string;
  }, adminData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    pin?: string;
  }) {
    const existing = await this.prisma.user.findUnique({ where: { email: adminData.email } });
    if (existing) throw new ConflictException('Email ya registrado');

    const adminRole = await this.prisma.role.findFirst({ where: { name: 'admin' } });
    if (!adminRole) throw new NotFoundException('Rol admin no encontrado');

    const passwordHash = await bcrypt.hash(adminData.password, 10);

    return this.prisma.$transaction(async (tx) => {
      const branch = await tx.branch.create({ data: branchData });

      const user = await tx.user.create({
        data: {
          email: adminData.email,
          passwordHash,
          firstName: adminData.firstName,
          lastName: adminData.lastName,
          phone: adminData.phone,
          pin: adminData.pin,
          branches: {
            create: { branchId: branch.id, roleId: adminRole.id },
          },
        },
      });

      return { branch, admin: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName } };
    });
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
