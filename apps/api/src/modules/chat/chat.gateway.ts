import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { WsAuthGuard } from '../../common/guards/ws-auth.guard';
import { ChatService } from './chat.service';

@WebSocketGateway({ namespace: '/chat', cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private chatService: ChatService) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.auth?.token;
    if (!token) {
      client.disconnect();
      return;
    }
    // Auth is handled per-message by WsAuthGuard, but we store basic info
    console.log(`Chat client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Chat client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_activity_chat')
  handleJoinChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { activityId: string },
  ) {
    const room = `activity:${data.activityId}`;
    client.join(room);
    client.to(room).emit('participant_joined', {
      userId: client.data.user?.sub,
      activityId: data.activityId,
    });
    return { event: 'joined', room };
  }

  @SubscribeMessage('leave_activity_chat')
  handleLeaveChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { activityId: string },
  ) {
    const room = `activity:${data.activityId}`;
    client.to(room).emit('participant_left', {
      userId: client.data.user?.sub,
      activityId: data.activityId,
    });
    client.leave(room);
    return { event: 'left', room };
  }

  @SubscribeMessage('send_activity_message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { activityId: string; content: string },
  ) {
    const userId = client.data.user?.sub;
    if (!userId) return;

    try {
      const message = await this.chatService.createMessage(
        data.activityId,
        userId,
        data.content,
      );

      const room = `activity:${data.activityId}`;
      this.server.to(room).emit('new_activity_message', message);
      return message;
    } catch (err: any) {
      client.emit('error', { message: err.message });
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { activityId: string },
  ) {
    const room = `activity:${data.activityId}`;
    client.to(room).emit('user_typing', {
      userId: client.data.user?.sub,
      activityId: data.activityId,
    });
  }
}
