import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class MarketplaceAuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
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
