import { Controller, Get } from '@nestjs/common';
import { StockService } from './stock.service';

@Controller('stock')
export class StockController {
  constructor(private stockService: StockService) {}

  @Get()
  async findAll() {
    return this.stockService.findAll();
  }
}
