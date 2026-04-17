import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GeoService } from '../geo/geo.service';
import { BlocksService } from '../blocks/blocks.service';
import { Prisma, ActivityCategory, GenderFilter } from '@prisma/client';

interface CreateActivityDto {
  title: string;
  description?: string;
  category: ActivityCategory;
  societyTag?: string;
  apartmentCommunity?: string;
  location: string;
  lat: number;
  lng: number;
  scheduledTime: string;
  maxParticipants?: number;
  durationMinutes?: number | null;
  imageUrl?: string;
  genderFilter?: GenderFilter;
  minAge?: number;
  maxAge?: number;
}

interface ActivityQueryDto {
  category?: ActivityCategory;
  search?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
  upcoming?: boolean;
  hostId?: string;
  page?: number;
  limit?: number;
  viewerId?: string;
}

@Injectable()
export class ActivitiesService {
  constructor(
    private prisma: PrismaService,
    private geoService: GeoService,
    private blocksService: BlocksService,
  ) {}

  async create(hostId: string, data: CreateActivityDto) {
    const activity = await this.prisma.activity.create({
      data: {
        hostId,
        title: data.title,
        description: data.description ?? '',
        category: data.category,
        societyTag: data.societyTag,
        apartmentCommunity: data.apartmentCommunity,
        location: data.location,
        lat: data.lat,
        lng: data.lng,
        scheduledTime: new Date(data.scheduledTime),
        maxParticipants: data.maxParticipants ?? 10,
        durationMinutes: data.durationMinutes ?? null,
        imageUrl: data.imageUrl,
        genderFilter: data.genderFilter,
        minAge: data.minAge,
        maxAge: data.maxAge,
      },
      include: {
        host: {
          select: { id: true, fullName: true, profile: { select: { displayName: true, avatarUrl: true } } },
        },
        _count: { select: { participants: true } },
      },
    });

    // Auto-join host as approved participant
    await this.prisma.activityParticipant.create({
      data: { activityId: activity.id, userId: hostId, status: 'approved' },
    });

    return activity;
  }

  async findAll(query: ActivityQueryDto) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 50);
    const skip = (page - 1) * limit;

    // Geo query path
    if (query.lat && query.lng && query.radiusKm) {
      const nearby = await this.geoService.findNearby(
        query.lat,
        query.lng,
        query.radiusKm,
      );
      return nearby;
    }

    // Standard query path
    const where: Prisma.ActivityWhereInput = { isActive: true };

    // Exclude activities from blocked/blocking users
    if (query.viewerId) {
      const excludedIds = await this.blocksService.getExcludedHostIds(query.viewerId);
      if (excludedIds.length > 0) {
        where.hostId = { notIn: excludedIds };
      }
    }

    if (query.category) where.category = query.category;
    if (query.hostId) {
      // If block filter already set a notIn, combine with AND
      if (where.hostId) {
        where.AND = [
          { hostId: where.hostId },
          { hostId: query.hostId },
        ];
        delete where.hostId;
      } else {
        where.hostId = query.hostId;
      }
    }
    if (query.upcoming) where.scheduledTime = { gte: new Date() };
    if (query.search) {
      where.OR = [
        { title: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { location: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [activities, total] = await Promise.all([
      this.prisma.activity.findMany({
        where,
        skip,
        take: limit,
        orderBy: { scheduledTime: 'asc' },
        include: {
          host: {
            select: { id: true, fullName: true, profile: { select: { displayName: true, avatarUrl: true } } },
          },
          _count: { select: { participants: { where: { status: 'approved' } } } },
        },
      }),
      this.prisma.activity.count({ where }),
    ]);

    return {
      data: activities,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string, userId?: string) {
    const activity = await this.prisma.activity.findUnique({
      where: { id },
      include: {
        host: {
          select: { id: true, fullName: true, profile: { select: { displayName: true, avatarUrl: true } } },
        },
        participants: {
          where: { status: 'approved' },
          include: {
            user: {
              select: { id: true, fullName: true, profile: { select: { displayName: true, avatarUrl: true } } },
            },
          },
        },
        _count: { select: { participants: { where: { status: 'approved' } }, messages: true } },
      },
    });
    if (!activity) throw new NotFoundException('Activity not found');

    // Include the current user's participant entry (even if pending/rejected) so frontend knows their status
    let myStatus: string | null = null;
    if (userId) {
      const myEntry = await this.prisma.activityParticipant.findUnique({
        where: { activityId_userId: { activityId: id, userId } },
      });
      myStatus = myEntry?.status ?? null;
    }

    return { ...activity, myStatus };
  }

  async update(
    id: string,
    userId: string,
    data: Partial<CreateActivityDto>,
  ) {
    const activity = await this.prisma.activity.findUnique({
      where: { id },
    });
    if (!activity) throw new NotFoundException('Activity not found');
    if (activity.hostId !== userId)
      throw new ForbiddenException('Only the host can update this activity');

    const updateData: Prisma.ActivityUpdateInput = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.lat !== undefined) updateData.lat = data.lat;
    if (data.lng !== undefined) updateData.lng = data.lng;
    if (data.scheduledTime !== undefined) updateData.scheduledTime = new Date(data.scheduledTime);
    if (data.maxParticipants !== undefined) updateData.maxParticipants = data.maxParticipants;
    if (data.durationMinutes !== undefined) updateData.durationMinutes = data.durationMinutes;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.genderFilter !== undefined) updateData.genderFilter = data.genderFilter;
    if (data.minAge !== undefined) updateData.minAge = data.minAge;
    if (data.maxAge !== undefined) updateData.maxAge = data.maxAge;

    return this.prisma.activity.update({
      where: { id },
      data: updateData,
      include: {
        host: {
          select: { id: true, fullName: true, profile: { select: { displayName: true, avatarUrl: true } } },
        },
        _count: { select: { participants: true } },
      },
    });
  }

  async getMyHistory(userId: string) {
    const activities = await this.prisma.activity.findMany({
      where: {
        scheduledTime: { lt: new Date() },
        OR: [
          { hostId: userId },
          { participants: { some: { userId, status: 'approved' } } },
        ],
      },
      orderBy: { scheduledTime: 'desc' },
      take: 50,
      include: {
        host: {
          select: { id: true, fullName: true, profile: { select: { displayName: true, avatarUrl: true } } },
        },
        _count: { select: { participants: { where: { status: 'approved' } } } },
      },
    });
    return activities;
  }

  async remove(id: string, userId: string) {
    const activity = await this.prisma.activity.findUnique({
      where: { id },
    });
    if (!activity) throw new NotFoundException('Activity not found');
    if (activity.hostId !== userId)
      throw new ForbiddenException('Only the host can delete this activity');

    await this.prisma.activity.delete({ where: { id } });
    return { message: 'Activity deleted' };
  }
}
