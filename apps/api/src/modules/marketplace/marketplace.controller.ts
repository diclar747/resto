import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('marketplace')
export class MarketplaceController {
    constructor(private readonly marketplaceService: MarketplaceService) { }

    @Get('branches')
    async getAllBranches() {
        return this.marketplaceService.findAllBranches();
    }

    @Get('branches/:id/menu')
    async getBranchMenu(@Param('id') id: string) {
        return this.marketplaceService.getBranchMenu(id);
    }

    @Get('branches/:id/reviews')
    async getBranchReviews(@Param('id') id: string) {
        return this.marketplaceService.getBranchReviews(id);
    }

    @UseGuards(JwtAuthGuard)
    @Post('branches/:id/reviews')
    async addBranchReview(
        @Param('id') id: string,
        @Request() req: any,
        @Body() data: { rating: number; comment?: string }
    ) {
        const userName = req.user.firstName
            ? `${req.user.firstName} ${req.user.lastName || ''}`.trim()
            : 'Cliente Anónimo';

        return this.marketplaceService.addBranchReview(id, {
            userName,
            rating: data.rating,
            comment: data.comment,
        });
    }
}
