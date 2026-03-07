import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CrmService } from './crm.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('crm')
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  // ----------------------------------------------------------------
  // Clients CRUD
  // ----------------------------------------------------------------

  @Get('clients/top')
  @RequirePermissions('crm:read')
  getTopClients(
    @Query('branchId') branchId: string,
    @Query('limit') limit?: string,
  ) {
    return this.crmService.getTopClients(branchId, limit ? parseInt(limit, 10) : 10);
  }

  @Get('clients')
  @RequirePermissions('crm:read')
  findAll(@Query('search') search?: string) {
    return this.crmService.findAll(search);
  }

  @Get('clients/:id')
  @RequirePermissions('crm:read')
  findById(@Param('id') id: string) {
    return this.crmService.findById(id);
  }

  @Get('clients/:id/history')
  @RequirePermissions('crm:read')
  getLoyaltyHistory(@Param('id') id: string) {
    return this.crmService.getLoyaltyHistory(id);
  }

  @Post('clients')
  @RequirePermissions('crm:write')
  create(
    @Body()
    body: {
      firstName: string;
      lastName?: string;
      email?: string;
      phone?: string;
      address?: string;
      birthday?: string;
      notes?: string;
    },
  ) {
    return this.crmService.create(body);
  }

  @Put('clients/:id')
  @RequirePermissions('crm:write')
  update(
    @Param('id') id: string,
    @Body()
    body: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      address?: string;
      birthday?: string;
      notes?: string;
    },
  ) {
    return this.crmService.update(id, body);
  }

  @Delete('clients/:id')
  @RequirePermissions('crm:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string) {
    return this.crmService.delete(id);
  }

  // ----------------------------------------------------------------
  // Loyalty
  // ----------------------------------------------------------------

  @Post('clients/:id/loyalty/earn')
  @RequirePermissions('crm:write')
  addLoyaltyPoints(
    @Param('id') id: string,
    @Body() body: { points: number; reason: string; orderId?: string },
  ) {
    return this.crmService.addLoyaltyPoints(id, body.points, body.reason, body.orderId);
  }

  @Post('clients/:id/loyalty/redeem')
  @RequirePermissions('crm:write')
  redeemPoints(
    @Param('id') id: string,
    @Body() body: { points: number },
  ) {
    return this.crmService.redeemPoints(id, body.points);
  }
}
