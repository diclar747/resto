import { Controller, Get } from '@nestjs/common';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Get()
  async findAll() {
    return this.ordersService.findAll();
  }
}
