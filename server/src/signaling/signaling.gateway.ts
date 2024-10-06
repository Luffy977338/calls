import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: true })
export class SignalingGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('offer')
  handleOffer(@MessageBody() data: any): void {
    this.server.emit('offer', data);
  }

  @SubscribeMessage('answer')
  handleAnswer(@MessageBody() data: any): void {
    this.server.emit('answer', data);
  }

  @SubscribeMessage('candidate')
  handleCandidate(@MessageBody() data: any): void {
    this.server.emit('candidate', data);
  }
}
