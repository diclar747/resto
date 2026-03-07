import { Controller, Get } from '@nestjs/common';
import { CashRegisterService } from './cash-register.service';

@Controller('cash-register')
export class CashRegisterController {
  constructor(private cashRegisterService: CashRegisterService) {}

  @Get()
  async findAll() {
    return this.cashRegisterService.findAll();
  }
}
