import { Controller, Get, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { MarketplaceClientsService } from './marketplace-clients.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';

@Controller('marketplace/client')
@UseGuards(JwtAuthGuard)
export class MarketplaceClientsController {
    constructor(private readonly clientsService: MarketplaceClientsService) { }

    @Get('profile')
    async getProfile(@Request() req: any) {
        return this.clientsService.getProfile(req.user.id);
    }

    @Patch('profile')
    async updateProfile(@Request() req: any, @Body() data: any) {
        return this.clientsService.updateProfile(req.user.id, data);
    }

    @Patch('security')
    async updateSecurity(@Request() req: any, @Body() data: { password?: string; pin?: string }) {
        return this.clientsService.updateSecurity(req.user.id, data);
    }

    @Get('orders')
    async getOrders(@Request() req: any) {
        return this.clientsService.getOrders(req.user.id);
    }

    @Patch('settings')
    async updateSettings(@Request() req: any, @Body() settings: any) {
        return this.clientsService.updateSettings(req.user.id, settings);
    }
}
