import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MarketplaceService {
    constructor(private prisma: PrismaService) { }

    async findAllBranches() {
        return this.prisma.branch.findMany({
            where: { isActive: true },
            select: {
                id: true,
                name: true,
                address: true,
                phone: true,
                settings: true,
                categories: {
                    where: { isActive: true, parentId: null },
                    take: 5,
                    select: {
                        id: true,
                        name: true,
                        imageUrl: true,
                    },
                },
            },
            orderBy: { name: 'asc' },
        });
    }

    async getBranchMenu(branchId: string) {
        return this.prisma.category.findMany({
            where: { branchId, isActive: true, parentId: null },
            orderBy: { sortOrder: 'asc' },
            include: {
                products: {
                    where: { isActive: true },
                    include: {
                        variants: {
                            where: { isActive: true },
                        },
                        branches: {
                            where: { branchId },
                        },
                    },
                },
            },
        });
    }
}
