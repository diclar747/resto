import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { QrOrderingService, QrOrderItem } from './qr-ordering.service';

/**
 * All endpoints in this controller are PUBLIC — no authentication required.
 * Customers scan a table QR code and interact with these routes directly.
 */
@Controller('qr')
export class QrOrderingController {
  constructor(private readonly qrOrderingService: QrOrderingService) {}

  /**
   * GET /qr/:tableCode/menu
   * Return the active menu for the branch that owns this table, grouped by category.
   */
  @Get(':tableCode/menu')
  getMenu(@Param('tableCode') tableCode: string) {
    return this.qrOrderingService.getMenu(tableCode);
  }

  /**
   * POST /qr/:tableCode/order
   * Place a new order for this table.
   *
   * Body: { items: QrOrderItem[] }
   * QrOrderItem: { productVariantId, quantity, notes?, modifierIds? }
   */
  @Post(':tableCode/order')
  placeOrder(
    @Param('tableCode') tableCode: string,
    @Body('items') items: QrOrderItem[],
  ) {
    return this.qrOrderingService.placeOrder(tableCode, items);
  }

  /**
   * GET /qr/:tableCode/status
   * Return the current open orders for this table including item statuses.
   */
  @Get(':tableCode/status')
  getOrderStatus(@Param('tableCode') tableCode: string) {
    return this.qrOrderingService.getOrderStatus(tableCode);
  }

  /**
   * POST /qr/:tableCode/call-waiter
   * Notify the waiter for this table.
   */
  @Post(':tableCode/call-waiter')
  callWaiter(@Param('tableCode') tableCode: string) {
    return this.qrOrderingService.callWaiter(tableCode);
  }

  /**
   * POST /qr/:tableCode/request-bill
   * Mark the table status as bill_requested.
   */
  @Post(':tableCode/request-bill')
  requestBill(@Param('tableCode') tableCode: string) {
    return this.qrOrderingService.requestBill(tableCode);
  }
}
