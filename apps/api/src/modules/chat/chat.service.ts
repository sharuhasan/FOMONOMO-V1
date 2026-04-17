import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  async getMessages(activityId: string, page = 1, limit = 50) {
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
    });
    if (!activity) throw new NotFoundException('Activity not found');

    const skip = (page - 1) * limit;

    const [messages, total] = await Promise.all([
      this.prisma.activityMessage.findMany({
        where: { activityId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              profile: { select: { displayName: true, avatarUrl: true } },
            },
          },
        },
      }),
      this.prisma.activityMessage.count({ where: { activityId } }),
    ]);

    return {
      data: messages.reverse(),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async createMessage(activityId: string, userId: string, content: string) {
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
    });
    if (!activity) throw new NotFoundException('Activity not found');

    // Verify user is a participant
    const participant = await this.prisma.activityParticipant.findUnique({
      where: { activityId_userId: { activityId, userId } },
    });
    if (!participant)
      throw new ForbiddenException('Must be a participant to send messages');

    const message = await this.prisma.activityMessage.create({
      data: { activityId, userId, content },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            profile: { select: { displayName: true, avatarUrl: true } },
          },
        },
      },
    });

    // Notify other approved participants
    const senderName = message.user?.profile?.displayName || message.user?.fullName || 'Someone';
    const participants = await this.prisma.activityParticipant.findMany({
      where: { activityId, status: 'approved', userId: { not: userId } },
      select: { userId: true },
    });

    if (participants.length > 0) {
      await this.prisma.notification.createMany({
        data: participants.map((p) => ({
          userId: p.userId,
          type: 'chat' as const,
          message: `${senderName} sent a message in "${activity.title}"`,
          activityId,
          metadata: { route: 'activity_chat', activityId },
        })),
      });
    }

    return message;
  }
}
