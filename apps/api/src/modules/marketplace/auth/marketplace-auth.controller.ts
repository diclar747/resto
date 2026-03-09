import { Controller, Post, Body } from '@nestjs/common';
import { MarketplaceAuthService } from './marketplace-auth.service';

@Controller('marketplace/auth')
export class MarketplaceAuthController {
    constructor(private readonly authService: MarketplaceAuthService) { }

    @Post('register')
    async register(@Body() body: any) {
        return this.authService.register(body);
    }

    @Post('login')
    async login(@Body() body: any) {
        return this.authService.login(body);
    }
}
