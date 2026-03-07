import { Controller, Get } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';

@Controller('suppliers')
export class SuppliersController {
  constructor(private suppliersService: SuppliersService) {}

  @Get()
  async findAll() {
    return this.suppliersService.findAll();
  }
}
