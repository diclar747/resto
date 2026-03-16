import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';

interface JwtPayload {
  sub: string;
  email: string;
  branchId: string;
  role: string;
  permissions: string[];
  firstName: string;
  lastName: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) { }

  async login(email: string, password: string, branchId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        branches: {
          include: { role: true, branch: true },
        },
      },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (user.branches.length === 0) {
      throw new UnauthorizedException('Usuario sin sucursal asignada');
    }

    const userBranch = branchId
      ? user.branches.find((ub) => ub.branchId === branchId)
      : user.branches[0];

    if (!userBranch) {
      throw new UnauthorizedException('Sin acceso a esta sucursal');
    }

    const permissions = (userBranch.role.permissions as string[]) || [];

    return this.generateTokens({
      sub: user.id,
      email: user.email,
      branchId: userBranch.branchId,
      role: userBranch.role.name,
      permissions,
      firstName: user.firstName,
      lastName: user.lastName,
    });
  }

  async pinLogin(pin: string, branchId?: string) {
    const user = await this.prisma.user.findFirst({
      where: { pin, isActive: true },
      include: {
        branches: {
          ...(branchId ? { where: { branchId } } : {}),
          include: { role: true },
        },
      },
    });

    if (!user || user.branches.length === 0) {
      throw new UnauthorizedException('PIN inválido');
    }

    const userBranch = user.branches[0];
    const permissions = (userBranch.role.permissions as string[]) || [];

    return this.generateTokens({
      sub: user.id,
      email: user.email,
      branchId: userBranch.branchId,
      role: userBranch.role.name,
      permissions,
      firstName: user.firstName,
      lastName: user.lastName,
    });
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        include: {
          branches: {
            where: { branchId: payload.branchId },
            include: { role: true },
          },
        },
      });

      if (!user || !user.isActive || user.branches.length === 0) {
        throw new UnauthorizedException('Token inválido');
      }

      const userBranch = user.branches[0];
      const permissions = (userBranch.role.permissions as string[]) || [];

      return this.generateTokens({
        sub: user.id,
        email: user.email,
        branchId: userBranch.branchId,
        role: userBranch.role.name,
        permissions,
        firstName: user.firstName,
        lastName: user.lastName,
      });
    } catch {
      throw new UnauthorizedException('Token de refresh inválido');
    }
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        phone: true, avatarUrl: true, isActive: true, createdAt: true,
        branches: { include: { role: true, branch: true } },
      },
    });
    if (!user) throw new UnauthorizedException('Usuario no encontrado');
    return user;
  }

  async updateProfile(userId: string, data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatarUrl?: string;
    pin?: string;
  }) {
    const { firstName, lastName, phone, avatarUrl, pin } = data;
    return this.prisma.user.update({
      where: { id: userId },
      data: { firstName, lastName, phone, avatarUrl, pin },
      select: {
        id: true, email: true, firstName: true, lastName: true,
        phone: true, avatarUrl: true, isActive: true,
      },
    });
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new UnauthorizedException('Usuario no encontrado');

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new BadRequestException('Contraseña actual incorrecta');

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    return { message: 'Contraseña actualizada' };
  }

  private generateTokens(payload: JwtPayload) {
    const accessToken = this.jwtService.sign(payload as any);
    const refreshToken = this.jwtService.sign(payload as any, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d') as any,
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: payload.sub,
        email: payload.email,
        branchId: payload.branchId,
        role: payload.role,
        permissions: payload.permissions,
        firstName: payload.firstName,
        lastName: payload.lastName,
      },
    };
  }
}
