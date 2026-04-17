import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProfilesService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        profile: true,
        roles: { select: { role: true } },
        _count: {
          select: {
            hostedActivities: true,
            participations: true,
            givenReviews: true,
            receivedReviews: true,
          },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');

    return {
      ...user,
      roles: user.roles.map((r) => r.role),
    };
  }

  async updateMyProfile(
    userId: string,
    data: Prisma.ProfileUpdateInput & { fullName?: string },
  ) {
    const { fullName, ...profileData } = data;

    if (fullName !== undefined) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { fullName },
      });
    }

    const profile = await this.prisma.profile.update({
      where: { userId },
      data: profileData,
    });

    return profile;
  }

  /** Users who shared at least one approved activity with this user */
  async getFriends(userId: string) {
    // Find all activities the user participated in (approved)
    const myActivities = await this.prisma.activityParticipant.findMany({
      where: { userId, status: 'approved' },
      select: { activityId: true },
    });
    const activityIds = myActivities.map((a) => a.activityId);

    if (activityIds.length === 0) return [];

    // Find all other approved participants in those activities
    const coParticipants = await this.prisma.activityParticipant.findMany({
      where: {
        activityId: { in: activityIds },
        status: 'approved',
        userId: { not: userId },
      },
      select: {
        userId: true,
        user: {
          select: {
            id: true,
            fullName: true,
            profile: { select: { displayName: true, avatarUrl: true, bio: true } },
          },
        },
      },
    });

    // Deduplicate by userId and count shared activities
    const friendMap = new Map<string, { user: any; sharedCount: number }>();
    for (const p of coParticipants) {
      const existing = friendMap.get(p.userId);
      if (existing) {
        existing.sharedCount++;
      } else {
        friendMap.set(p.userId, { user: p.user, sharedCount: 1 });
      }
    }

    return Array.from(friendMap.values())
      .sort((a, b) => b.sharedCount - a.sharedCount)
      .map((f) => ({ ...f.user, sharedActivities: f.sharedCount }));
  }

  async getStats(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const [hosted, joined, avgRating, reviewCount] = await Promise.all([
      this.prisma.activity.count({ where: { hostId: userId } }),
      this.prisma.activityParticipant.count({ where: { userId } }),
      this.prisma.review.aggregate({
        where: { revieweeId: userId },
        _avg: { rating: true },
      }),
      this.prisma.review.count({ where: { revieweeId: userId } }),
    ]);

    return {
      activitiesHosted: hosted,
      activitiesJoined: joined,
      averageRating: avgRating._avg.rating ?? 0,
      totalReviews: reviewCount,
    };
  }
}
