import { Module } from '@nestjs/common';
import { KdsController } from './kds.controller';
import { KdsService } from './kds.service';
import { KdsGateway } from './kds.gateway';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [KdsController],
  providers: [KdsService, KdsGateway],
  exports: [KdsService],
})
export class KdsModule {}
