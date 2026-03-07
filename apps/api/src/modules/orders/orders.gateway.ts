import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/orders',
})
export class OrdersGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('order:join-branch')
  handleJoinBranch(
    @MessageBody() data: { branchId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`branch:${data.branchId}:orders`);
    return { event: 'joined', data: { room: `branch:${data.branchId}:orders` } };
  }

  @SubscribeMessage('order:join-table')
  handleJoinTable(
    @MessageBody() data: { tableId: string },
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`table:${data.tableId}`);
    return { event: 'joined', data: { room: `table:${data.tableId}` } };
  }

  emitOrderCreated(branchId: string, order: any) {
    this.server.to(`branch:${branchId}:orders`).emit('order:created', order);
    if (order.tableId) {
      this.server.to(`table:${order.tableId}`).emit('order:created', order);
    }
  }

  emitOrderUpdated(branchId: string, order: any) {
    this.server.to(`branch:${branchId}:orders`).emit('order:updated', order);
    if (order.tableId) {
      this.server.to(`table:${order.tableId}`).emit('order:updated', order);
    }
  }

  emitOrderItemStatusChanged(branchId: string, orderId: string, item: any) {
    this.server.to(`branch:${branchId}:orders`).emit('order:item-status-changed', {
      orderId,
      item,
    });
  }

  emitOrderReady(branchId: string, order: any) {
    this.server.to(`branch:${branchId}:orders`).emit('order:ready', order);
    if (order.tableId) {
      this.server.to(`table:${order.tableId}`).emit('order:ready', order);
    }
  }
}
