import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';

@WebSocketGateway({
  namespace: 'kds',
})
export class KdsGateway {
  @SubscribeMessage('message')
  handleMessage(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
    return {
      event: 'message',
      data,
    };
  }
}
