import { Controller, Get } from '@nestjs/common';
import { KdsService } from './kds.service';

@Controller('kds')
export class KdsController {
  constructor(private kdsService: KdsService) {}

  @Get()
  async findAll() {
    return this.kdsService.findAll();
  }
}
