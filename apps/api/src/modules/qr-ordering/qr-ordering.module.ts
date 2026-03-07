import { Module } from '@nestjs/common';
import { QrOrderingController } from './qr-ordering.controller';
import { QrOrderingService } from './qr-ordering.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { KdsModule } from '../kds/kds.module';

@Module({
  imports: [PrismaModule, KdsModule],
  controllers: [QrOrderingController],
  providers: [QrOrderingService],
  exports: [QrOrderingService],
})
export class QrOrderingModule { }
