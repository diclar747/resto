import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

/**
 * KdsGateway
 *
 * Manages real-time WebSocket communication for the Kitchen Display System.
 *
 * Room naming conventions:
 *   branch:<branchId>:kds              – all KDS displays for a branch
 *   branch:<branchId>:kds:station:<stationId> – a specific station display
 */
@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/kds',
})
export class KdsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(KdsGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`KDS client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`KDS client disconnected: ${client.id}`);
  }

  // ─── Room Subscriptions ──────────────────────────────────────────────────

  /**
   * Client event: kds:join-station
   * Payload: { branchId: string; stationId?: string }
   *
   * Joins the client to:
   *   - The branch-wide KDS room (always)
   *   - The station-specific room (when stationId is provided)
   */
  @SubscribeMessage('kds:join-station')
  joinStationRoom(
    @MessageBody() data: { branchId: string; stationId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const branchRoom = `branch:${data.branchId}:kds`;
    client.join(branchRoom);

    const rooms: string[] = [branchRoom];

    if (data.stationId) {
      const stationRoom = `branch:${data.branchId}:kds:station:${data.stationId}`;
      client.join(stationRoom);
      rooms.push(stationRoom);
    }

    this.logger.log(
      `Client ${client.id} joined KDS rooms: ${rooms.join(', ')}`,
    );

    return { event: 'kds:joined', data: { rooms } };
  }

  /**
   * Client event: kds:leave-station
   * Payload: { branchId: string; stationId?: string }
   *
   * Leaves the specified rooms.
   */
  @SubscribeMessage('kds:leave-station')
  leaveStationRoom(
    @MessageBody() data: { branchId: string; stationId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    const branchRoom = `branch:${data.branchId}:kds`;
    client.leave(branchRoom);

    const rooms: string[] = [branchRoom];

    if (data.stationId) {
      const stationRoom = `branch:${data.branchId}:kds:station:${data.stationId}`;
      client.leave(stationRoom);
      rooms.push(stationRoom);
    }

    return { event: 'kds:left', data: { rooms } };
  }

  // ─── Server Emitters ─────────────────────────────────────────────────────

  /**
   * Emit a new ticket to all KDS displays for a branch and optionally a
   * specific station room.
   *
   * Server event name: kds:ticket-new
   */
  emitNewTicket(branchId: string, stationId: string, ticket: any) {
    const branchRoom = `branch:${branchId}:kds`;
    const stationRoom = `branch:${branchId}:kds:station:${stationId}`;

    this.server.to(branchRoom).emit('kds:ticket-new', ticket);
    this.server.to(stationRoom).emit('kds:ticket-new', ticket);

    this.logger.log(
      `Emitted kds:ticket-new for branch ${branchId}, station ${stationId}`,
    );
  }

  /**
   * Emit a ticket status update to all relevant KDS displays.
   *
   * Server event name: kds:ticket-updated
   */
  emitTicketUpdated(branchId: string, stationId: string, ticket: any) {
    const branchRoom = `branch:${branchId}:kds`;
    const stationRoom = `branch:${branchId}:kds:station:${stationId}`;

    this.server.to(branchRoom).emit('kds:ticket-updated', ticket);
    this.server.to(stationRoom).emit('kds:ticket-updated', ticket);

    this.logger.log(
      `Emitted kds:ticket-updated (status=${ticket.status}) for branch ${branchId}, station ${stationId}`,
    );
  }

  /**
   * Emit a ticket bump event (ticket dismissed from screen).
   *
   * Server event name: kds:ticket-bumped
   */
  emitTicketBumped(branchId: string, stationId: string, ticketId: string) {
    const branchRoom = `branch:${branchId}:kds`;
    const stationRoom = `branch:${branchId}:kds:station:${stationId}`;

    const payload = { ticketId, stationId };
    this.server.to(branchRoom).emit('kds:ticket-bumped', payload);
    this.server.to(stationRoom).emit('kds:ticket-bumped', payload);

    this.logger.log(
      `Emitted kds:ticket-bumped for ticket ${ticketId}, station ${stationId}`,
    );
  }
}
