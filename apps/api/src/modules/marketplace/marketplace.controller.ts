import { Controller, Get, Param } from '@nestjs/common';
import { MarketplaceService } from './marketplace.service';

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
}
