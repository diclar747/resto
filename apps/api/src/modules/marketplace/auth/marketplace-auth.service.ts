import { Injectable, UnauthorizedException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class MarketplaceAuthService {
    private readonly logger = new Logger(MarketplaceAuthService.name);

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

    async loginByPin(pin: string) {
        // Validar que el PIN no esté vacío
        if (!pin || pin.trim() === '') {
            this.logger.warn('Intento de login con PIN vacío');
            throw new BadRequestException('El PIN es requerido');
        }

        const trimmedPin = pin.trim();
        this.logger.debug(`Buscando cliente con PIN: ${trimmedPin}`);

        try {
            const client = await this.prisma.client.findFirst({
                where: { 
                    pin: trimmedPin, 
                    isActive: true 
                }
            });

            if (!client) {
                this.logger.warn(`Cliente no encontrado con PIN: ${trimmedPin}`);
                throw new UnauthorizedException('PIN inválido');
            }

            this.logger.debug(`Cliente encontrado: ${client.email}`);
            return this.generateToken(client);
        } catch (error) {
            // Si ya es una excepción HTTP, re-lanzarla
            if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
                throw error;
            }
            this.logger.error('Error en loginByPin:', error);
            throw new UnauthorizedException('Error al procesar el login');
        }
    }

    private generateToken(client: any) {
        try {
            const payload = {
                sub: client.id,
                email: client.email || null,
                phone: client.phone || null,
                firstName: client.firstName,
                lastName: client.lastName,
                role: 'client'
            };

            this.logger.debug('Generando token para cliente:', client.id);
            const token = this.jwtService.sign(payload);

            return {
                client: {
                    id: client.id,
                    firstName: client.firstName,
                    lastName: client.lastName,
                    email: client.email || null,
                    phone: client.phone || null
                },
                token
            };
        } catch (error) {
            this.logger.error('Error generando token:', error);
            throw new UnauthorizedException('Error al generar el token de autenticación');
        }
    }
}
