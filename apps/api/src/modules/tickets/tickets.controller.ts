import { Controller, Get } from '@nestjs/common';
import { TicketsService } from './tickets.service';

@Controller('tickets')
export class TicketsController {
  constructor(private ticketsService: TicketsService) {}

  @Get()
  async findAll() {
    return this.ticketsService.findAll();
  }
}
