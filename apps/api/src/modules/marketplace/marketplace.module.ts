import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { MarketplaceController } from './marketplace.controller';
import { MarketplaceService } from './marketplace.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { OrdersModule } from '../orders/orders.module';
import { MarketplaceAuthController } from './auth/marketplace-auth.controller';
import { MarketplaceAuthService } from './auth/marketplace-auth.service';
import { MarketplaceOrdersController } from './orders/marketplace-orders.controller';

@Module({
    imports: [
        PrismaModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: (config: ConfigService) => ({
                secret: config.get<string>('JWT_SECRET')!,
                signOptions: { expiresIn: '7d' }, // Clients have 7 days token validity
            }),
            inject: [ConfigService],
        }),
        OrdersModule
    ],
    controllers: [
        MarketplaceController,
        MarketplaceAuthController,
        MarketplaceOrdersController
    ],
    providers: [MarketplaceService, MarketplaceAuthService],
    exports: [MarketplaceService],
})
export class MarketplaceModule { }
