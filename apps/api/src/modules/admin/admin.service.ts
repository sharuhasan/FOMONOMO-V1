import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AppRole } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getStats() {
    const [users, activities, activeActivities, reports, pendingReports] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.activity.count(),
        this.prisma.activity.count({ where: { isActive: true } }),
        this.prisma.report.count(),
        this.prisma.report.count({ where: { status: 'pending' } }),
      ]);

    return {
      totalUsers: users,
      totalActivities: activities,
      activeActivities,
      totalReports: reports,
      pendingReports,
    };
  }

  async getUsers(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' as const } },
            { fullName: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          fullName: true,
          emailVerified: true,
          createdAt: true,
          roles: { select: { role: true } },
          profile: { select: { displayName: true, avatarUrl: true } },
          _count: { select: { hostedActivities: true, participations: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users.map((u) => ({ ...u, roles: u.roles.map((r) => r.role) })),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getActivities(page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [activities, total] = await Promise.all([
      this.prisma.activity.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          host: { select: { id: true, fullName: true, email: true } },
          _count: { select: { participants: true, messages: true, reports: true } },
        },
      }),
      this.prisma.activity.count(),
    ]);

    return {
      data: activities,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async assignRole(userId: string, role: AppRole) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.userRole.upsert({
      where: { userId_role: { userId, role } },
      create: { userId, role },
      update: {},
    });
  }

  async removeRole(userId: string, role: AppRole) {
    return this.prisma.userRole.deleteMany({
      where: { userId, role },
    });
  }
}
