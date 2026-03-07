import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { BranchesModule } from './modules/branches/branches.module';
import { MenuModule } from './modules/menu/menu.module';
import { TablesModule } from './modules/tables/tables.module';
import { OrdersModule } from './modules/orders/orders.module';
import { KdsModule } from './modules/kds/kds.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { CashRegisterModule } from './modules/cash-register/cash-register.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { SuppliersModule } from './modules/suppliers/suppliers.module';
import { CrmModule } from './modules/crm/crm.module';
import { PromotionsModule } from './modules/promotions/promotions.module';
import { DeliveryModule } from './modules/delivery/delivery.module';
import { QrOrderingModule } from './modules/qr-ordering/qr-ordering.module';
import { ReportsModule } from './modules/reports/reports.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['../../.env.local', '../../.env'],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    BranchesModule,
    MenuModule,
    TablesModule,
    OrdersModule,
    KdsModule,
    PaymentsModule,
    CashRegisterModule,
    InventoryModule,
    SuppliersModule,
    CrmModule,
    PromotionsModule,
    DeliveryModule,
    QrOrderingModule,
    ReportsModule,
    TicketsModule,
    NotificationsModule,
  ],
})
export class AppModule {}
