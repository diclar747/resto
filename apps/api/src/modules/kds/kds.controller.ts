import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { KdsService, KdsTicketStatus } from './kds.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { KdsGateway } from './kds.gateway';

@Controller('kds')
@UseGuards(JwtAuthGuard, RolesGuard)
export class KdsController {
  constructor(
    private readonly kdsService: KdsService,
    private readonly kdsGateway: KdsGateway,
  ) {}

  // ─── Tickets ─────────────────────────────────────────────────────────────

  /**
   * GET /kds/tickets?branchId=&stationId=&status=
   * List KDS tickets with optional filters.
   */
  @Get('tickets')
  @RequirePermissions('kds.view')
  findTickets(
    @Query('branchId') branchId: string,
    @Query('stationId') stationId?: string,
    @Query('status') status?: string,
  ) {
    return this.kdsService.findTickets(branchId, stationId, status);
  }

  /**
   * GET /kds/tickets/:id
   * Get a single KDS ticket with full relations.
   */
  @Get('tickets/:id')
  @RequirePermissions('kds.view')
  findTicketById(@Param('id') id: string) {
    return this.kdsService.findTicketById(id);
  }

  /**
   * PATCH /kds/tickets/:id/status
   * Advance or update ticket status (pending→preparing→ready→delivered→bumped).
   */
  @Patch('tickets/:id/status')
  @RequirePermissions('kds.update')
  async updateTicketStatus(
    @Param('id') id: string,
    @Body('status') status: KdsTicketStatus,
    @Query('branchId') branchId?: string,
  ) {
    const ticket = await this.kdsService.updateTicketStatus(id, status);

    if (branchId) {
      this.kdsGateway.emitTicketUpdated(
        branchId,
        ticket.kitchenStationId,
        ticket,
      );
    }

    return ticket;
  }

  /**
   * POST /kds/tickets/:id/bump
   * Bump a ticket (mark as done and dismiss from screen).
   */
  @Post('tickets/:id/bump')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('kds.update')
  async bumpTicket(
    @Param('id') id: string,
    @Query('branchId') branchId?: string,
  ) {
    const ticket = await this.kdsService.bumpTicket(id);

    if (branchId) {
      this.kdsGateway.emitTicketUpdated(
        branchId,
        ticket.kitchenStationId,
        ticket,
      );
    }

    return ticket;
  }

  // ─── Stations ────────────────────────────────────────────────────────────

  /**
   * GET /kds/stations?branchId=
   * List all active kitchen stations for a branch.
   */
  @Get('stations')
  @RequirePermissions('kds.view')
  findStations(@Query('branchId') branchId: string) {
    return this.kdsService.findStations(branchId);
  }

  /**
   * POST /kds/stations
   * Create a new kitchen station.
   */
  @Post('stations')
  @RequirePermissions('kds.update')
  createStation(
    @Body('branchId') branchId: string,
    @Body('name') name: string,
    @Body('color') color?: string,
  ) {
    return this.kdsService.createStation({ branchId, name, color });
  }

  /**
   * PATCH /kds/stations/:id
   * Update an existing kitchen station.
   */
  @Patch('stations/:id')
  @RequirePermissions('kds.update')
  updateStation(
    @Param('id') id: string,
    @Body() body: { name?: string; color?: string; isActive?: boolean },
  ) {
    return this.kdsService.updateStation(id, body);
  }

  /**
   * DELETE /kds/stations/:id
   * Soft-delete (deactivate) a kitchen station.
   */
  @Delete('stations/:id')
  @RequirePermissions('kds.update')
  deleteStation(@Param('id') id: string) {
    return this.kdsService.deleteStation(id);
  }

  // ─── Statistics ──────────────────────────────────────────────────────────

  /**
   * GET /kds/stats/prep-time?branchId=&stationId=
   * Get average preparation time for completed tickets.
   */
  @Get('stats/prep-time')
  @RequirePermissions('kds.view')
  getAveragePrepTime(
    @Query('branchId') branchId: string,
    @Query('stationId') stationId?: string,
  ) {
    return this.kdsService.getAveragePrepTime(branchId, stationId);
  }
}
