import { Controller, Get, Logger } from '@nestjs/common';

@Controller('marketplace/test')
export class TestController {
    private readonly logger = new Logger(TestController.name);

    @Get('simple')
    simple() {
        this.logger.log('Test simple endpoint llamado');
        return { 
            message: 'OK', 
            timestamp: new Date().toISOString(),
            service: 'test',
            version: '2025-01-04-v2',
            env: {
                hasDatabaseUrl: !!process.env.DATABASE_URL,
                hasJwtSecret: !!process.env.JWT_SECRET,
                nodeEnv: process.env.NODE_ENV
            }
        };
    }

    @Get('version')
    version() {
        return {
            version: '2025-01-04-v2',
            build: 'manual',
            timestamp: new Date().toISOString(),
            features: [
                'marketplace-auth',
                'login-pin',
                'login-email',
                'setup-endpoint'
            ]
        };
    }
}
