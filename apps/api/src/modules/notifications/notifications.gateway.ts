import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ namespace: '/notifications', cors: { origin: '*' } })
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  async handleConnection(client: Socket) {
    const token = client.handshake.auth?.token;
    if (!token) {
      client.disconnect();
      return;
    }
    const userId = client.data.user?.sub;
    if (userId) {
      client.join(`user:${userId}`);
    }
    console.log(`Notifications client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Notifications client disconnected: ${client.id}`);
  }

  /** Push a notification to a specific user in real-time */
  sendToUser(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('new_notification', notification);
  }

  /** Push updated unread count to a user */
  sendUnreadCount(userId: string, count: number) {
    this.server.to(`user:${userId}`).emit('unread_count', { count });
  }
}
