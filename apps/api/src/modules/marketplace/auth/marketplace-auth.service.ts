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
        this.logger.log('=== LOGIN BY PIN SERVICE ===');
        
        // Validar que el PIN no esté vacío
        if (!pin || pin.trim() === '') {
            this.logger.warn('❌ Intento de login con PIN vacío');
            throw new BadRequestException('El PIN es requerido');
        }

        const trimmedPin = pin.trim();
        this.logger.log(`🔍 Buscando cliente con PIN: "${trimmedPin}"`);

        try {
            // Primero ver cuántos clientes hay en total
            const totalClients = await this.prisma.client.count();
            this.logger.log(`📊 Total clientes en BD: ${totalClients}`);

            const client = await this.prisma.client.findFirst({
                where: { 
                    pin: trimmedPin, 
                    isActive: true 
                }
            });

            if (!client) {
                this.logger.warn(`❌ Cliente NO encontrado con PIN: "${trimmedPin}"`);
                
                // Buscar si hay algún cliente con PIN similar (para debug)
                const allWithPins = await this.prisma.client.findMany({
                    where: { pin: { not: null } },
                    select: { pin: true, firstName: true }
                });
                this.logger.log(`📋 Clientes con PIN en BD: ${allWithPins.map(c => `"${c.pin}" (${c.firstName})`).join(', ')}`);
                
                throw new UnauthorizedException('PIN inválido');
            }

            this.logger.log(`✅ Cliente encontrado: ${client.firstName} ${client.lastName} (${client.email})`);
            return this.generateToken(client);
        } catch (error) {
            // Si ya es una excepción HTTP, re-lanzarla
            if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
                throw error;
            }
            this.logger.error('💥 Error en loginByPin:', error);
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

    // Método de diagnóstico para verificar PINs
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
                totalClients: clients.length,
                clientsWithPin: clients.filter(c => c.pin !== null).length,
                clients: clients.map(c => ({
                    id: c.id,
                    name: `${c.firstName} ${c.lastName}`,
                    email: c.email,
                    pin: c.pin ? `${c.pin.substring(0, 2)}**` : null, // Ocultar parte del PIN por seguridad
                    hasPin: c.pin !== null,
                    isActive: c.isActive
                }))
            };
        } catch (error) {
            this.logger.error('Error en debugPins:', error);
            return { error: error.message };
        }
    }
}
