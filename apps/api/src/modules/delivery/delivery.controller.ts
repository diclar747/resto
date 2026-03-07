import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DeliveryService, DeliveryStatus } from './delivery.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('delivery')
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  /**
   * GET /delivery?branchId=&status=
   * List all deliveries for a branch, optionally filtered by status.
   */
  @Get()
  @RequirePermissions('delivery.view')
  findAll(
    @Query('branchId') branchId: string,
    @Query('status') status?: string,
  ) {
    return this.deliveryService.findAll(branchId, status);
  }

  /**
   * GET /delivery/driver/:driverId
   * List deliveries assigned to a specific driver.
   */
  @Get('driver/:driverId')
  @RequirePermissions('delivery.view')
  findByDriver(@Param('driverId') driverId: string) {
    return this.deliveryService.findByDriver(driverId);
  }

  /**
   * GET /delivery/:id
   * Get a single delivery by ID.
   */
  @Get(':id')
  @RequirePermissions('delivery.view')
  findById(@Param('id') id: string) {
    return this.deliveryService.findById(id);
  }

  /**
   * POST /delivery
   * Create a delivery record for an existing order.
   */
  @Post()
  @RequirePermissions('delivery.manage')
  create(
    @Body()
    body: {
      orderId: string;
      customerName: string;
      customerPhone: string;
      deliveryAddress: string;
      deliveryFee: number;
      notes?: string;
    },
  ) {
    return this.deliveryService.createDelivery(body);
  }

  /**
   * PATCH /delivery/:id/assign
   * Assign a driver to a delivery (pending -> assigned).
   */
  @Patch(':id/assign')
  @RequirePermissions('delivery.manage')
  assignDriver(
    @Param('id') id: string,
    @Body('driverId') driverId: string,
  ) {
    return this.deliveryService.assignDriver(id, driverId);
  }

  /**
   * PATCH /delivery/:id/status
   * Advance the delivery status along the state machine.
   */
  @Patch(':id/status')
  @RequirePermissions('delivery.manage')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: DeliveryStatus,
  ) {
    return this.deliveryService.updateStatus(id, status);
  }
}
