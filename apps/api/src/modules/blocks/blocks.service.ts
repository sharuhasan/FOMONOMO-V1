import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BlocksService {
  constructor(private prisma: PrismaService) {}

  async block(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) {
      throw new BadRequestException('Cannot block yourself');
    }

    const existing = await this.prisma.userBlock.findUnique({
      where: { blockerId_blockedId: { blockerId, blockedId } },
    });
    if (existing) {
      throw new ConflictException('User already blocked');
    }

    const block = await this.prisma.userBlock.create({
      data: { blockerId, blockedId },
    });

    // Reject any pending requests from the blocked user on the blocker's activities
    const blockerActivities = await this.prisma.activity.findMany({
      where: { hostId: blockerId },
      select: { id: true },
    });
    if (blockerActivities.length > 0) {
      await this.prisma.activityParticipant.updateMany({
        where: {
          userId: blockedId,
          activityId: { in: blockerActivities.map((a) => a.id) },
          status: 'pending',
        },
        data: { status: 'rejected' },
      });
    }

    // Also reject any pending requests from the blocker on the blocked user's activities
    const blockedActivities = await this.prisma.activity.findMany({
      where: { hostId: blockedId },
      select: { id: true },
    });
    if (blockedActivities.length > 0) {
      await this.prisma.activityParticipant.updateMany({
        where: {
          userId: blockerId,
          activityId: { in: blockedActivities.map((a) => a.id) },
          status: 'pending',
        },
        data: { status: 'rejected' },
      });
    }

    return block;
  }

  async unblock(blockerId: string, blockedId: string) {
    const existing = await this.prisma.userBlock.findUnique({
      where: { blockerId_blockedId: { blockerId, blockedId } },
    });
    if (!existing) {
      throw new NotFoundException('Block not found');
    }

    await this.prisma.userBlock.delete({
      where: { blockerId_blockedId: { blockerId, blockedId } },
    });
    return { message: 'User unblocked' };
  }

  async getBlockedUsers(blockerId: string) {
    const blocks = await this.prisma.userBlock.findMany({
      where: { blockerId },
      include: {
        blocked: {
          select: {
            id: true,
            fullName: true,
            profile: { select: { displayName: true, avatarUrl: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return blocks.map((b) => b.blocked);
  }

  async isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
    const block = await this.prisma.userBlock.findUnique({
      where: { blockerId_blockedId: { blockerId, blockedId } },
    });
    return !!block;
  }

  /** Returns user IDs that should be excluded from activity queries for a given viewer */
  async getExcludedHostIds(viewerId: string): Promise<string[]> {
    const [blockedByViewer, blockedViewer] = await Promise.all([
      // Users the viewer has blocked
      this.prisma.userBlock.findMany({
        where: { blockerId: viewerId },
        select: { blockedId: true },
      }),
      // Users who have blocked the viewer
      this.prisma.userBlock.findMany({
        where: { blockedId: viewerId },
        select: { blockerId: true },
      }),
    ]);

    const ids = new Set<string>();
    blockedByViewer.forEach((b) => ids.add(b.blockedId));
    blockedViewer.forEach((b) => ids.add(b.blockerId));
    return Array.from(ids);
  }
}
