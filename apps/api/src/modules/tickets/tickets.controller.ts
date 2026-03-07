import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  /**
   * POST /tickets/generate
   * Generate and persist a new ticket for the given order.
   *
   * Body: { orderId: string }
   */
  @Post('generate')
  @RequirePermissions('tickets.manage')
  generate(@Body('orderId') orderId: string) {
    return this.ticketsService.generateTicket(orderId);
  }

  /**
   * GET /tickets/order/:orderId
   * Return all tickets that have been generated for an order.
   */
  @Get('order/:orderId')
  @RequirePermissions('tickets.view')
  findByOrder(@Param('orderId') orderId: string) {
    return this.ticketsService.findByOrder(orderId);
  }

  /**
   * POST /tickets/:id/reprint
   * Increment the reprint counter for an existing ticket.
   */
  @Post(':id/reprint')
  @RequirePermissions('tickets.manage')
  reprint(@Param('id') id: string) {
    return this.ticketsService.reprint(id);
  }
}
