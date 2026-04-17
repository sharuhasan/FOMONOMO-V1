import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AnnouncementType } from '@prisma/client';

@Injectable()
export class AnnouncementsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.announcement.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      include: {
        admin: { select: { id: true, fullName: true } },
      },
    });
  }

  async create(
    adminId: string,
    data: { title: string; message: string; type?: AnnouncementType },
  ) {
    return this.prisma.announcement.create({
      data: {
        adminId,
        title: data.title,
        message: data.message,
        type: data.type ?? 'info',
      },
    });
  }

  async update(
    id: string,
    data: { title?: string; message?: string; type?: AnnouncementType; isActive?: boolean },
  ) {
    const announcement = await this.prisma.announcement.findUnique({ where: { id } });
    if (!announcement) throw new NotFoundException('Announcement not found');

    return this.prisma.announcement.update({
      where: { id },
      data,
    });
  }
}
