import { Controller, Post, Body, BadRequestException, Logger, Get, Version, VERSION_NEUTRAL, HttpException, InternalServerErrorException } from '@nestjs/common';
import { MarketplaceAuthService } from './marketplace-auth.service';

@Controller({ path: 'marketplace/auth', version: VERSION_NEUTRAL })
export class MarketplaceAuthController {
    private readonly logger = new Logger(MarketplaceAuthController.name);

    constructor(private readonly authService: MarketplaceAuthService) { }

    @Post('register')
    async register(@Body() body: any) {
        try {
            return await this.authService.register(body);
        } catch (error) {
            this.handleError(error, 'register');
        }
    }

    @Post('login')
    async login(@Body() body: any) {
        this.logger.log('=== LOGIN REQUEST ===');
        this.logger.log('Body:', JSON.stringify(body));
        try {
            return await this.authService.login(body);
        } catch (error) {
            this.handleError(error, 'login');
        }
    }

    @Post('login-pin')
    async loginPin(@Body() body: any) {
        this.logger.log('=== LOGIN PIN REQUEST ===');
        this.logger.log('Body:', JSON.stringify(body));
        
        try {
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
            return await this.authService.loginByPin(pin);
        } catch (error) {
            this.handleError(error, 'login-pin');
        }
    }

    // Endpoint de diagnóstico para verificar qué clientes tienen PIN
    @Get('debug-pins')
    async debugPins() {
        this.logger.log('=== DEBUG PINS REQUEST ===');
        try {
            return await this.authService.debugPins();
        } catch (error) {
            this.logger.error('Error en debug-pins:', error);
            return { 
                error: 'Error al obtener datos', 
                message: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            };
        }
    }

    // Health check simple
    @Get('health')
    async health() {
        try {
            // Verificar que la BD responde
            const dbStatus = await this.authService.checkDatabase();
            return { 
                status: 'ok', 
                timestamp: new Date().toISOString(), 
                service: 'marketplace-auth',
                database: dbStatus ? 'connected' : 'disconnected'
            };
        } catch (error) {
            return { 
                status: 'error', 
                timestamp: new Date().toISOString(), 
                service: 'marketplace-auth',
                error: error.message
            };
        }
    }

    private handleError(error: any, context: string): never {
        this.logger.error(`Error en ${context}:`, error);
        
        if (error instanceof HttpException) {
            throw error;
        }
        
        throw new InternalServerErrorException({
            message: 'Error interno del servidor',
            error: error.message,
            context: context
        });
    }
}
