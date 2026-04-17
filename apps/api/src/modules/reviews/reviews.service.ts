import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(
    reviewerId: string,
    data: { revieweeId: string; rating: number; text?: string; tags?: string[] },
  ) {
    if (reviewerId === data.revieweeId)
      throw new BadRequestException('Cannot review yourself');
    if (data.rating < 1 || data.rating > 5)
      throw new BadRequestException('Rating must be between 1 and 5');

    const existing = await this.prisma.review.findUnique({
      where: {
        reviewerId_revieweeId: {
          reviewerId,
          revieweeId: data.revieweeId,
        },
      },
    });
    if (existing) throw new ConflictException('You already reviewed this user');

    return this.prisma.review.create({
      data: {
        reviewerId,
        revieweeId: data.revieweeId,
        rating: data.rating,
        text: data.text ?? '',
        tags: data.tags ?? [],
      },
      include: {
        reviewer: {
          select: {
            id: true,
            fullName: true,
            profile: { select: { displayName: true, avatarUrl: true } },
          },
        },
      },
    });
  }

  async getForUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const [reviews, aggregate] = await Promise.all([
      this.prisma.review.findMany({
        where: { revieweeId: userId },
        include: {
          reviewer: {
            select: {
              id: true,
              fullName: true,
              profile: { select: { displayName: true, avatarUrl: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.review.aggregate({
        where: { revieweeId: userId },
        _avg: { rating: true },
        _count: true,
      }),
    ]);

    return {
      reviews,
      averageRating: aggregate._avg.rating ?? 0,
      totalReviews: aggregate._count,
    };
  }

  async update(
    id: string,
    reviewerId: string,
    data: { rating?: number; text?: string; tags?: string[] },
  ) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Review not found');
    if (review.reviewerId !== reviewerId)
      throw new BadRequestException('Can only update your own review');

    if (data.rating !== undefined && (data.rating < 1 || data.rating > 5))
      throw new BadRequestException('Rating must be between 1 and 5');

    return this.prisma.review.update({
      where: { id },
      data: {
        ...(data.rating !== undefined && { rating: data.rating }),
        ...(data.text !== undefined && { text: data.text }),
        ...(data.tags !== undefined && { tags: data.tags }),
      },
    });
  }
}
