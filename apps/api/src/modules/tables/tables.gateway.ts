import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  namespace: 'tables',
  cors: {
    origin: '*',
    credentials: true,
  },
})
export class TablesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // ─── Lifecycle ──────────────────────────────────────────────────────────────

  handleConnection(client: Socket) {
    console.log(`[TablesGateway] Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`[TablesGateway] Client disconnected: ${client.id}`);
  }

  // ─── Subscriptions ──────────────────────────────────────────────────────────

  /**
   * Client sends: { branchId: string }
   * Server: adds the socket to the branch-specific room so it receives
   *         real-time table status updates for that branch.
   */
  @SubscribeMessage('table:join-branch')
  handleJoinBranch(
    @MessageBody() data: { branchId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data?.branchId) {
      return { event: 'error', data: { message: 'branchId is required' } };
    }

    const room = this.branchRoom(data.branchId);
    client.join(room);

    console.log(`[TablesGateway] Client ${client.id} joined room "${room}"`);

    return {
      event: 'table:joined-branch',
      data: { branchId: data.branchId, room },
    };
  }

  /**
   * Client sends: { branchId: string }
   * Server: removes the socket from the branch room.
   */
  @SubscribeMessage('table:leave-branch')
  handleLeaveBranch(
    @MessageBody() data: { branchId: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (!data?.branchId) {
      return { event: 'error', data: { message: 'branchId is required' } };
    }

    const room = this.branchRoom(data.branchId);
    client.leave(room);

    console.log(`[TablesGateway] Client ${client.id} left room "${room}"`);

    return {
      event: 'table:left-branch',
      data: { branchId: data.branchId },
    };
  }

  // ─── Server-side emit helpers ────────────────────────────────────────────────

  /**
   * Emit a status-change event to every client that joined the branch room.
   * Called by TablesController after a successful status update.
   */
  emitTableStatusChanged(branchId: string, table: Record<string, any>) {
    const room = this.branchRoom(branchId);
    this.server.to(room).emit('table:status-changed', { table });
  }

  /**
   * Emit a generic table update event (e.g., after merge or split).
   */
  emitTableUpdated(branchId: string, table: Record<string, any>) {
    const room = this.branchRoom(branchId);
    this.server.to(room).emit('table:updated', { table });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  private branchRoom(branchId: string): string {
    return `branch:${branchId}`;
  }
}
