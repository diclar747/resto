import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class MarketplaceAuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    async login(data: any) {
        const { identifier, password } = data;

        if (!identifier || !password) {
            throw new UnauthorizedException('Credenciales requeridas');
        }

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

        const isValid = await bcrypt.compare(password, client.passwordHash);
        if (!isValid) {
            throw new UnauthorizedException('Credenciales inválidas');
        }

        return this.generateToken(client);
    }

    async loginByPin(pin: string) {
        if (!pin) {
            throw new UnauthorizedException('PIN requerido');
        }

        const client = await this.prisma.client.findFirst({
            where: { pin: pin.trim(), isActive: true }
        });

        if (!client) {
            throw new UnauthorizedException('PIN inválido');
        }

        return this.generateToken(client);
    }

    async debugPins() {
        try {
            const clients = await this.prisma.client.findMany({
                select: {
                    id: true,
                    email: true,
                    firstName: true,
                    lastName: true,
                    pin: true,
                    isActive: true,
                }
            });

            return {
                total: clients.length,
                withPin: clients.filter(c => c.pin !== null).length,
                clients: clients.map(c => ({
                    name: `${c.firstName} ${c.lastName}`,
                    pin: c.pin ? `${c.pin.substring(0, 2)}**` : null,
                    active: c.isActive
                }))
            };
        } catch (error) {
            return { error: error.message };
        }
    }

    private generateToken(client: any) {
        const payload = {
            sub: client.id,
            email: client.email,
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
