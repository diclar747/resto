import { Controller, Get } from '@nestjs/common';
import { CrmService } from './crm.service';

@Controller('crm')
export class CrmController {
  constructor(private crmService: CrmService) {}

  @Get()
  async findAll() {
    return this.crmService.findAll();
  }
}
