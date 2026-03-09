import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class MarketplaceClientsService {
    constructor(private prisma: PrismaService) { }

    async getProfile(clientId: string) {
        return this.prisma.client.findUnique({
            where: { id: clientId },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                avatarUrl: true,
                address: true,
                birthday: true,
                loyaltyPoints: true,
                totalSpent: true,
                settings: true,
                createdAt: true,
            },
        });
    }

    async updateProfile(clientId: string, data: any) {
        const { firstName, lastName, phone, address, avatarUrl, birthday } = data;
        return this.prisma.client.update({
            where: { id: clientId },
            data: {
                firstName,
                lastName,
                phone,
                address,
                avatarUrl,
                birthday: birthday ? new Date(birthday) : undefined,
            },
        });
    }

    async updateSecurity(clientId: string, data: { password?: string; pin?: string }) {
        const updateData: any = {};
        if (data.password) {
            updateData.passwordHash = await bcrypt.hash(data.password, 10);
        }
        if (data.pin) {
            updateData.pin = data.pin; // Storing PIN as plain text as per common pattern for quick entry, or could hash if requested.
        }
        return this.prisma.client.update({
            where: { id: clientId },
            data: updateData,
        });
    }

    async getOrders(clientId: string) {
        return this.prisma.order.findMany({
            where: { clientId },
            orderBy: { createdAt: 'desc' },
            include: {
                branch: {
                    select: {
                        name: true,
                        settings: true,
                    },
                },
                items: {
                    include: {
                        productVariant: {
                            include: {
                                product: true,
                            },
                        },
                    },
                },
            },
        });
    }

    async updateSettings(clientId: string, settings: any) {
        return this.prisma.client.update({
            where: { id: clientId },
            data: { settings },
        });
    }
}
