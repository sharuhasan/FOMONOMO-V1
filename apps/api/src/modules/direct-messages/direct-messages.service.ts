import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DirectMessagesService {
  constructor(private prisma: PrismaService) {}

  async getConversations(userId: string) {
    // Get all DMs involving the user, grouped by partner
    const sent = await this.prisma.directMessage.findMany({
      where: { senderId: userId },
      select: { receiverId: true },
      distinct: ['receiverId'],
    });
    const received = await this.prisma.directMessage.findMany({
      where: { receiverId: userId },
      select: { senderId: true },
      distinct: ['senderId'],
    });

    const partnerIds = [
      ...new Set([
        ...sent.map((m) => m.receiverId),
        ...received.map((m) => m.senderId),
      ]),
    ];

    const conversations = await Promise.all(
      partnerIds.map(async (partnerId) => {
        const [latestMessage, unreadCount, partner] = await Promise.all([
          this.prisma.directMessage.findFirst({
            where: {
              OR: [
                { senderId: userId, receiverId: partnerId },
                { senderId: partnerId, receiverId: userId },
              ],
            },
            orderBy: { createdAt: 'desc' },
          }),
          this.prisma.directMessage.count({
            where: { senderId: partnerId, receiverId: userId, read: false },
          }),
          this.prisma.user.findUnique({
            where: { id: partnerId },
            select: {
              id: true,
              fullName: true,
              profile: { select: { displayName: true, avatarUrl: true } },
            },
          }),
        ]);

        return {
          partnerId,
          fullName: partner?.fullName,
          displayName: partner?.profile?.displayName ?? '',
          avatarUrl: partner?.profile?.avatarUrl ?? null,
          lastMessage: latestMessage?.content ?? '',
          lastMessageAt: latestMessage?.createdAt,
          unreadCount,
        };
      }),
    );

    return conversations.sort(
      (a, b) =>
        (b.lastMessageAt?.getTime() ?? 0) - (a.lastMessageAt?.getTime() ?? 0),
    );
  }

  async getMessages(userId: string, partnerId: string, page = 1, limit = 50) {
    const partner = await this.prisma.user.findUnique({
      where: { id: partnerId },
    });
    if (!partner) throw new NotFoundException('User not found');

    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.prisma.directMessage.findMany({
        where: {
          OR: [
            { senderId: userId, receiverId: partnerId },
            { senderId: partnerId, receiverId: userId },
          ],
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: {
              id: true,
              fullName: true,
              profile: { select: { displayName: true, avatarUrl: true } },
            },
          },
        },
      }),
      this.prisma.directMessage.count({
        where: {
          OR: [
            { senderId: userId, receiverId: partnerId },
            { senderId: partnerId, receiverId: userId },
          ],
        },
      }),
    ]);

    // Mark received messages as read
    await this.prisma.directMessage.updateMany({
      where: { senderId: partnerId, receiverId: userId, read: false },
      data: { read: true },
    });

    return {
      data: messages.reverse(),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async sendMessage(senderId: string, receiverId: string, content: string) {
    const receiver = await this.prisma.user.findUnique({
      where: { id: receiverId },
    });
    if (!receiver) throw new NotFoundException('User not found');

    const message = await this.prisma.directMessage.create({
      data: { senderId, receiverId, content },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            profile: { select: { displayName: true, avatarUrl: true } },
          },
        },
      },
    });

    // Create notification for receiver
    const senderName = message.sender?.profile?.displayName || message.sender?.fullName || 'someone';
    await this.prisma.notification.create({
      data: {
        userId: receiverId,
        type: 'chat',
        message: `New message from ${senderName}`,
        metadata: { route: 'dm', senderId },
      },
    });

    return message;
  }

  async markAsRead(senderId: string, receiverId: string) {
    await this.prisma.directMessage.updateMany({
      where: { senderId, receiverId, read: false },
      data: { read: true },
    });
    return { message: 'Messages marked as read' };
  }
}
