import { Controller, Post, Body, BadRequestException, Logger, Get, Version, VERSION_NEUTRAL } from '@nestjs/common';
import { MarketplaceAuthService } from './marketplace-auth.service';

@Controller({ path: 'marketplace/auth', version: VERSION_NEUTRAL })
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
        this.logger.log('=== LOGIN PIN REQUEST ===');
        this.logger.log('Headers:', JSON.stringify(body));
        
        // Aceptar tanto { pin: "1234" } como variantes
        const pin = body?.pin || body?.PIN || body?.Pin;
        
        if (!pin) {
            this.logger.error('❌ PIN no proporcionado. Body:', JSON.stringify(body));
            throw new BadRequestException('El PIN es requerido');
        }
        
        if (typeof pin !== 'string') {
            this.logger.error(`❌ PIN no es string. Tipo: ${typeof pin}, valor:`, pin);
            throw new BadRequestException('El PIN debe ser texto');
        }
        
        this.logger.log(`✅ PIN recibido: "${pin}"`);
        return this.authService.loginByPin(pin);
    }

    // Endpoint de diagnóstico para verificar qué clientes tienen PIN
    @Get('debug-pins')
    async debugPins() {
        this.logger.log('=== DEBUG PINS REQUEST ===');
        return this.authService.debugPins();
    }

    // Health check simple
    @Get('health')
    health() {
        return { status: 'ok', timestamp: new Date().toISOString(), service: 'marketplace-auth' };
    }
}
