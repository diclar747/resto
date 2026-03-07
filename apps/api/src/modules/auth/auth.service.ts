import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';

interface JwtPayload {
  sub: string;
  email: string;
  branchId: string;
  role: string;
  permissions: string[];
}

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

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
    });
  }

  async pinLogin(pin: string, branchId: string) {
    const user = await this.prisma.user.findFirst({
      where: { pin, isActive: true },
      include: {
        branches: {
          where: { branchId },
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
      });
    } catch {
      throw new UnauthorizedException('Token de refresh inválido');
    }
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
      },
    };
  }
}
