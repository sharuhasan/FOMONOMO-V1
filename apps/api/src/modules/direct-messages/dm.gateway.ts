import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { DirectMessagesService } from './direct-messages.service';

@WebSocketGateway({ namespace: '/dm', cors: { origin: '*' } })
export class DmGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Map userId -> socketId for DM routing
  private userSockets = new Map<string, string>();

  constructor(private dmService: DirectMessagesService) {}

  async handleConnection(client: Socket) {
    const token = client.handshake.auth?.token;
    if (!token) {
      client.disconnect();
      return;
    }
    // Store user mapping after auth
    const userId = client.data.user?.sub;
    if (userId) {
      this.userSockets.set(userId, client.id);
      client.join(`user:${userId}`);
    }
    console.log(`DM client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.user?.sub;
    if (userId) {
      this.userSockets.delete(userId);
    }
    console.log(`DM client disconnected: ${client.id}`);
  }

  @SubscribeMessage('send_dm')
  async handleSendDm(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { receiverId: string; content: string },
  ) {
    const senderId = client.data.user?.sub;
    if (!senderId) return;

    try {
      const message = await this.dmService.sendMessage(
        senderId,
        data.receiverId,
        data.content,
      );

      // Send to receiver if online
      this.server.to(`user:${data.receiverId}`).emit('new_dm', message);
      // Echo back to sender
      client.emit('new_dm', message);

      return message;
    } catch (err: any) {
      client.emit('error', { message: err.message });
    }
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { senderId: string },
  ) {
    const receiverId = client.data.user?.sub;
    if (!receiverId) return;

    await this.dmService.markAsRead(data.senderId, receiverId);

    // Notify sender that messages were read
    this.server.to(`user:${data.senderId}`).emit('dm_read', {
      readBy: receiverId,
    });
  }

  @SubscribeMessage('typing_dm')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { receiverId: string },
  ) {
    const userId = client.data.user?.sub;
    this.server.to(`user:${data.receiverId}`).emit('user_typing_dm', {
      userId,
    });
  }
}
