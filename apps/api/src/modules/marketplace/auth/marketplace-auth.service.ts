import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class MarketplaceAuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
        private configService: ConfigService,
    ) { }

    async register(data: any) {
        const { firstName, lastName, email, phone, password } = data;

        const existingClient = await this.prisma.client.findFirst({
            where: {
                OR: [
                    { email: email || undefined },
                    { phone: phone || undefined }
                ]
            }
        });

        if (existingClient) {
            throw new ConflictException('Ya existe un cliente con este email o teléfono');
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const client = await this.prisma.client.create({
            data: {
                firstName,
                lastName,
                email,
                phone,
                passwordHash
            }
        });

        return this.generateToken(client);
    }

    async login(data: any) {
        const { identifier, password } = data;

        const client = await this.prisma.client.findFirst({
            where: {
                OR: [
                    { email: identifier },
                    { phone: identifier }
                ]
            }
        });

        if (!client || !client.passwordHash) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        const isPasswordValid = await bcrypt.compare(password, client.passwordHash);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        if (!client.isActive) {
            throw new UnauthorizedException('Cuenta desactivada');
        }

        return this.generateToken(client);
    }

    async loginByPin(pin: string) {
        // First check marketplace clients
        const client = await this.prisma.client.findFirst({
            where: { pin, isActive: true }
        });

        if (client) {
            return this.generateToken(client);
        }

        // Fallback: check staff users table
        const staffUser = await this.prisma.user.findFirst({
            where: { pin, isActive: true },
            include: {
                branches: {
                    include: { role: true },
                },
            },
        });

        if (!staffUser || staffUser.branches.length === 0) {
            throw new UnauthorizedException('PIN inválido');
        }

        const userBranch = staffUser.branches[0];
        const permissions = (userBranch.role.permissions as string[]) || [];

        const payload = {
            sub: staffUser.id,
            email: staffUser.email,
            branchId: userBranch.branchId,
            role: userBranch.role.name,
            permissions,
            firstName: staffUser.firstName,
            lastName: staffUser.lastName,
        };

        const accessToken = this.jwtService.sign(payload as any);
        const refreshToken = this.jwtService.sign(payload as any, {
            secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
            expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRATION', '7d') as any,
        });

        return {
            type: 'staff' as const,
            accessToken,
            refreshToken,
            user: {
                id: staffUser.id,
                email: staffUser.email,
                branchId: userBranch.branchId,
                role: userBranch.role.name,
                permissions,
                firstName: staffUser.firstName,
                lastName: staffUser.lastName,
            },
        };
    }

    private generateToken(client: any) {
        const payload = {
            sub: client.id,
            email: client.email,
            phone: client.phone,
            firstName: client.firstName,
            lastName: client.lastName,
            role: 'client'
        };

        const token = this.jwtService.sign(payload);

        return {
            client: {
                id: client.id,
                firstName: client.firstName,
                lastName: client.lastName,
                email: client.email,
                phone: client.phone
            },
            token
        };
    }
}
