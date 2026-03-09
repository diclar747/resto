import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MarketplaceService {
    constructor(private prisma: PrismaService) { }

    async findAllBranches() {
        const branches = await this.prisma.branch.findMany({
            where: { isActive: true },
            select: {
                id: true,
                name: true,
                address: true,
                phone: true,
                whatsapp: true,
                bannerUrl: true,
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
                reviews: {
                    select: {
                        rating: true,
                    },
                },
                _count: {
                    select: {
                        reviews: true,
                    }
                }
            },
            orderBy: { name: 'asc' },
        });

        return branches.map((b) => {
            const avgRating = b.reviews.length > 0
                ? b.reviews.reduce((acc, r) => acc + r.rating, 0) / b.reviews.length
                : 5;
            return {
                ...b,
                avgRating,
                reviewCount: b._count.reviews,
                reviews: undefined,
            };
        });
    }

    async getBranchReviews(branchId: string) {
        return this.prisma.branchReview.findMany({
            where: { branchId },
            orderBy: { createdAt: 'desc' },
            take: 10,
        });
    }

    async addBranchReview(branchId: string, data: { userName: string; rating: number; comment?: string }) {
        return this.prisma.branchReview.create({
            data: {
                branchId,
                userName: data.userName,
                rating: data.rating,
                comment: data.comment,
            }
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
