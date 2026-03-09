import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Get()
  @RequirePermissions('orders.view')
  findAll(
    @CurrentUser('branchId') branchId: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('tableId') tableId?: string,
    @Query('waiterId') waiterId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.ordersService.findAll(branchId, {
      status,
      type,
      tableId,
      waiterId,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
    });
  }

  @Get('active')
  @RequirePermissions('orders.view')
  findActiveByTable(@Query('tableId') tableId: string) {
    return this.ordersService.findActiveByTable(tableId);
  }

  @Get(':id')
  @RequirePermissions('orders.view')
  findById(@Param('id') id: string) {
    return this.ordersService.findById(id);
  }

  @Post()
  @RequirePermissions('orders.create')
  create(
    @CurrentUser('branchId') branchId: string,
    @CurrentUser('id') userId: string,
    @Body() body: any,
  ) {
    return this.ordersService.create({
      ...body,
      branchId,
      waiterId: body.waiterId || userId,
    });
  }

  @Post(':id/items')
  @RequirePermissions('orders.create')
  addItems(@Param('id') orderId: string, @Body('items') items: any[]) {
    return this.ordersService.addItems(orderId, items);
  }

  @Delete(':id/items/:itemId')
  @RequirePermissions('orders.edit')
  removeItem(@Param('id') orderId: string, @Param('itemId') itemId: string) {
    return this.ordersService.removeItem(orderId, itemId);
  }

  @Patch('items/:itemId/status')
  @RequirePermissions('orders.edit')
  updateItemStatus(@Param('itemId') itemId: string, @Body('status') status: string) {
    return this.ordersService.updateItemStatus(itemId, status);
  }

  @Post(':id/send-to-kitchen')
  @RequirePermissions('orders.create')
  sendToKitchen(@Param('id') orderId: string) {
    return this.ordersService.sendToKitchen(orderId);
  }

  @Post(':id/discount')
  @RequirePermissions('orders.discount')
  applyDiscount(
    @Param('id') orderId: string,
    @Body('discountType') discountType: string,
    @Body('discountAmount') discountAmount: number,
  ) {
    return this.ordersService.applyDiscount(orderId, discountType, discountAmount);
  }

  @Post(':id/tip')
  @RequirePermissions('orders.edit')
  addTip(@Param('id') orderId: string, @Body('tipAmount') tipAmount: number) {
    return this.ordersService.addTip(orderId, tipAmount);
  }

  @Post(':id/close')
  @RequirePermissions('orders.edit')
  closeOrder(@Param('id') orderId: string, @CurrentUser('id') cashierId: string) {
    return this.ordersService.closeOrder(orderId, cashierId);
  }

  @Post(':id/void')
  @RequirePermissions('orders.void')
  voidOrder(@Param('id') orderId: string) {
    return this.ordersService.voidOrder(orderId);
  }

  @Post(':id/split')
  @RequirePermissions('orders.edit')
  splitOrder(
    @Param('id') orderId: string,
    @Body('itemIds') itemIds: string[],
    @Body('newTableId') newTableId?: string,
  ) {
    return this.ordersService.splitOrder(orderId, itemIds, newTableId);
  }
}
