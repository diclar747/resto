import { Controller, Post, Body, BadRequestException, Logger } from '@nestjs/common';
import { MarketplaceAuthService } from './marketplace-auth.service';

@Controller('marketplace/auth')
export class MarketplaceAuthController {
    private readonly logger = new Logger(MarketplaceAuthController.name);

    constructor(private readonly authService: MarketplaceAuthService) { }

    @Post('register')
    async register(@Body() body: any) {
        return this.authService.register(body);
    }

    @Post('login')
    async login(@Body() body: any) {
        return this.authService.login(body);
    }

    @Post('login-pin')
    async loginPin(@Body() body: any) {
        this.logger.debug('Body recibido en login-pin:', body);
        
        // Aceptar tanto { pin: "1234" } como { "pin": "1234" }
        const pin = body?.pin || body?.PIN || body?.Pin;
        
        if (!pin) {
            this.logger.error('PIN no proporcionado en el body:', body);
            throw new BadRequestException('El PIN es requerido');
        }
        
        return this.authService.loginByPin(pin);
    }
}
