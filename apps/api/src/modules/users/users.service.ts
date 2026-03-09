import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAllRoles() {
    return this.prisma.role.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findAll(branchId?: string) {
    const where = branchId
      ? { branches: { some: { branchId } } }
      : {};

    return this.prisma.user.findMany({
      where,
      include: {
        branches: { include: { role: true, branch: true } },
      },
      orderBy: { firstName: 'asc' },
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        branches: { include: { role: true, branch: true } },
      },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  async create(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    pin?: string;
    branchId: string;
    roleId: string;
  }) {
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) throw new ConflictException('Email ya registrado');

    const passwordHash = await bcrypt.hash(data.password, 10);

    return this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        pin: data.pin,
        branches: {
          create: {
            branchId: data.branchId,
            roleId: data.roleId,
          },
        },
      },
      include: {
        branches: { include: { role: true, branch: true } },
      },
    });
  }

  async update(id: string, data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    pin?: string;
    isActive?: boolean;
  }) {
    return this.prisma.user.update({
      where: { id },
      data,
      include: {
        branches: { include: { role: true, branch: true } },
      },
    });
  }

  async updatePassword(id: string, newPassword: string) {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    return this.prisma.user.update({
      where: { id },
      data: { passwordHash },
    });
  }

  async updatePin(id: string, pin: string) {
    return this.prisma.user.update({
      where: { id },
      data: { pin },
    });
  }

  async assignBranch(userId: string, branchId: string, roleId: string) {
    return this.prisma.userBranch.upsert({
      where: { userId_branchId: { userId, branchId } },
      update: { roleId },
      create: { userId, branchId, roleId },
    });
  }

  async delete(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
