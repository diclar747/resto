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
import { PromotionsService, OrderItemInput } from './promotions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  // ----------------------------------------------------------------
  // Promotions CRUD
  // ----------------------------------------------------------------

  @Get('active')
  @RequirePermissions('promotions:read')
  findActive(@Query('branchId') branchId: string) {
    return this.promotionsService.findActive(branchId);
  }

  @Get()
  @RequirePermissions('promotions:read')
  findAll(@Query('branchId') branchId?: string) {
    return this.promotionsService.findAll(branchId);
  }

  @Get(':id')
  @RequirePermissions('promotions:read')
  findById(@Param('id') id: string) {
    return this.promotionsService.findById(id);
  }

  @Post()
  @RequirePermissions('promotions:write')
  create(
    @Body()
    body: {
      name: string;
      description?: string;
      type: string;
      discountValue?: number;
      conditions?: Record<string, unknown>;
      startDate?: string;
      endDate?: string;
      startTime?: string;
      endTime?: string;
      daysOfWeek?: number[];
      isAutomatic?: boolean;
      branchIds?: string[];
    },
  ) {
    return this.promotionsService.create(body);
  }

  @Put(':id')
  @RequirePermissions('promotions:write')
  update(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      description?: string;
      type?: string;
      discountValue?: number;
      conditions?: Record<string, unknown>;
      startDate?: string;
      endDate?: string;
      startTime?: string;
      endTime?: string;
      daysOfWeek?: number[];
      isAutomatic?: boolean;
      isActive?: boolean;
      branchIds?: string[];
    },
  ) {
    return this.promotionsService.update(id, body);
  }

  @Delete(':id')
  @RequirePermissions('promotions:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id') id: string) {
    return this.promotionsService.delete(id);
  }

  // ----------------------------------------------------------------
  // Evaluation
  // ----------------------------------------------------------------

  @Post('evaluate')
  @RequirePermissions('promotions:read')
  evaluateForOrder(
    @Body()
    body: {
      branchId: string;
      orderItems: OrderItemInput[];
    },
  ) {
    return this.promotionsService.evaluateForOrder(body.branchId, body.orderItems);
  }
}
