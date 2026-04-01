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
            env: {
                hasDatabaseUrl: !!process.env.DATABASE_URL,
                hasJwtSecret: !!process.env.JWT_SECRET,
                nodeEnv: process.env.NODE_ENV
            }
        };
    }
}
