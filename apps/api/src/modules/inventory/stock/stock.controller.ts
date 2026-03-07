import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  StockService,
  OrderItemInput,
  RestockItemInput,
} from './stock.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { RequirePermissions } from '../../../common/decorators/permissions.decorator';

@Controller('inventory/stock')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StockController {
  constructor(private stockService: StockService) {}

  @Get()
  @RequirePermissions('inventory.view')
  findAll(@Query('branchId') branchId: string) {
    return this.stockService.findAll(branchId);
  }

  @Get('alerts')
  @RequirePermissions('inventory.view')
  findAlerts(@Query('branchId') branchId: string) {
    return this.stockService.findAlerts(branchId);
  }

  @Post('adjust')
  @RequirePermissions('inventory.manage')
  adjustStock(
    @Body()
    body: {
      branchId: string;
      ingredientId: string;
      quantity: number;
      reason: string;
    },
  ) {
    return this.stockService.adjustStock(
      body.branchId,
      body.ingredientId,
      body.quantity,
      body.reason,
    );
  }

  @Post('deduct')
  @RequirePermissions('inventory.manage')
  deductByOrder(
    @Body() body: { branchId: string; orderItems: OrderItemInput[] },
  ) {
    return this.stockService.deductByOrder(body.branchId, body.orderItems);
  }

  @Post('restock')
  @RequirePermissions('inventory.manage')
  restockFromPurchase(
    @Body() body: { branchId: string; items: RestockItemInput[] },
  ) {
    return this.stockService.restockFromPurchase(body.branchId, body.items);
  }

  @Patch('min-max')
  @RequirePermissions('inventory.manage')
  setMinMax(
    @Body()
    body: {
      branchId: string;
      ingredientId: string;
      min: number;
      max?: number | null;
    },
  ) {
    return this.stockService.setMinMax(
      body.branchId,
      body.ingredientId,
      body.min,
      body.max,
    );
  }
}
