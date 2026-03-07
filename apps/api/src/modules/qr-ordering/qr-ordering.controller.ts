import { Controller, Get } from '@nestjs/common';
import { QrOrderingService } from './qr-ordering.service';

@Controller('qr-ordering')
export class QrOrderingController {
  constructor(private qrOrderingService: QrOrderingService) {}

  @Get()
  async findAll() {
    return this.qrOrderingService.findAll();
  }
}
