import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ReportStatus } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async create(
    reporterId: string,
    data: {
      reportedUserId?: string;
      reportedActivityId?: string;
      reason: string;
    },
  ) {
    return this.prisma.report.create({
      data: {
        reporterId,
        reportedUserId: data.reportedUserId,
        reportedActivityId: data.reportedActivityId,
        reason: data.reason,
      },
    });
  }

  async findAll(page = 1, limit = 20, status?: ReportStatus) {
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};

    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          reporter: { select: { id: true, fullName: true, email: true } },
          reportedUser: { select: { id: true, fullName: true, email: true } },
          reportedActivity: { select: { id: true, title: true } },
        },
      }),
      this.prisma.report.count({ where }),
    ]);

    return {
      data: reports,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async updateStatus(id: string, status: ReportStatus) {
    const report = await this.prisma.report.findUnique({ where: { id } });
    if (!report) throw new NotFoundException('Report not found');

    return this.prisma.report.update({
      where: { id },
      data: { status },
    });
  }
}
