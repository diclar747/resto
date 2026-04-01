import { Controller, Post, Body, Logger, Get } from '@nestjs/common';
import { MarketplaceAuthService } from './marketplace-auth.service';

@Controller('marketplace/auth')
export class MarketplaceAuthController {
    private readonly logger = new Logger(MarketplaceAuthController.name);

    constructor(private readonly authService: MarketplaceAuthService) { }

    @Post('login')
    async login(@Body() body: any) {
        this.logger.log('Login request');
        return this.authService.login(body);
    }

    @Post('login-pin')
    async loginPin(@Body() body: any) {
        this.logger.log('Login PIN request: ' + JSON.stringify(body));
        const pin = body?.pin;
        
        if (!pin) {
            return { error: 'PIN requerido' };
        }
        
        return this.authService.loginByPin(pin);
    }

    @Get('debug')
    async debug() {
        return this.authService.debugPins();
    }
}
