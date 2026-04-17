import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RecommendationsService {
  constructor(private prisma: PrismaService) {}

  async getRecommendations(userId: string) {
    // Get user's interests from profile
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    const interests = profile?.interests ?? [];

    // Get user's past activity categories
    const pastActivities = await this.prisma.activityParticipant.findMany({
      where: { userId },
      include: { activity: { select: { category: true } } },
    });
    const pastCategories = [
      ...new Set(pastActivities.map((p) => p.activity.category)),
    ];

    // Score categories based on interests + past participation
    const allCategories = [
      'Sports', 'Food', 'Study', 'Music', 'Art', 'Social', 'Fitness', 'Gaming',
    ];

    const scored = allCategories.map((category) => {
      let score = 0;

      // Boost if matches user interests
      if (interests.some((i) => i.toLowerCase().includes(category.toLowerCase()))) {
        score += 3;
      }

      // Boost if user has participated in this category before
      if (pastCategories.includes(category as any)) {
        score += 2;
      }

      // Small random factor for discovery
      score += Math.random();

      return { category, score };
    });

    scored.sort((a, b) => b.score - a.score);

    // Get recommended activities from top categories
    const topCategories = scored.slice(0, 4).map((s) => s.category);

    const recommended = await this.prisma.activity.findMany({
      where: {
        isActive: true,
        scheduledTime: { gte: new Date() },
        category: { in: topCategories as any },
        // Exclude user's own activities
        hostId: { not: userId },
        // Exclude already joined
        participants: { none: { userId } },
      },
      take: 10,
      orderBy: { scheduledTime: 'asc' },
      include: {
        host: {
          select: {
            id: true,
            fullName: true,
            profile: { select: { displayName: true, avatarUrl: true } },
          },
        },
        _count: { select: { participants: true } },
      },
    });

    return {
      suggestedCategories: scored.slice(0, 4).map((s) => s.category),
      activities: recommended,
    };
  }
}
