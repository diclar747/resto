import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { OrdersService } from '../../orders/orders.service';

@Controller('marketplace/orders')
export class MarketplaceOrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    async createOrder(@Request() req: any, @Body() data: any) {
        const { branchId, type, items, notes } = data;
        const clientId = req.user.id;

        // 1. Create the order
        const order = await this.ordersService.create({
            branchId,
            type: type || 'delivery',
            clientId,
            notes: notes || 'Pedido desde Marketplace',
        });

        // 2. Add the items
        if (items && items.length > 0) {
            await this.ordersService.addItems(order.id, items);
        }

        // 3. Send to Kitchen directly (generates KDS Tickets)
        await this.ordersService.sendToKitchen(order.id);

        return { success: true, orderId: order.id };
    }
}
