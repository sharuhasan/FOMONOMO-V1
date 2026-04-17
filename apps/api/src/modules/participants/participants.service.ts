import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const PARTICIPANT_USER_SELECT = {
  id: true,
  fullName: true,
  profile: { select: { displayName: true, avatarUrl: true } },
};

@Injectable()
export class ParticipantsService {
  constructor(private prisma: PrismaService) {}

  /** User requests to join — creates a pending entry */
  async requestJoin(activityId: string, userId: string) {
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
      include: { _count: { select: { participants: { where: { status: 'approved' } } } } },
    });
    if (!activity) throw new NotFoundException('Activity not found');
    if (!activity.isActive) throw new BadRequestException('Activity is no longer active');

    const approvedCount = activity._count.participants;
    if (approvedCount >= activity.maxParticipants)
      throw new BadRequestException('Activity is full');

    const existing = await this.prisma.activityParticipant.findUnique({
      where: { activityId_userId: { activityId, userId } },
    });
    if (existing) {
      if (existing.status === 'pending') throw new ConflictException('Request already pending');
      if (existing.status === 'approved') throw new ConflictException('Already joined this activity');
      if (existing.status === 'rejected') {
        // Allow re-request: update back to pending
        const updated = await this.prisma.activityParticipant.update({
          where: { id: existing.id },
          data: { status: 'pending' },
          include: { user: { select: PARTICIPANT_USER_SELECT } },
        });

        if (activity.hostId !== userId) {
          await this.prisma.notification.create({
            data: {
              userId: activity.hostId,
              type: 'join',
              message: `Someone re-requested to join "${activity.title}"`,
              activityId,
            },
          });
        }

        return updated;
      }
    }

    const participant = await this.prisma.activityParticipant.create({
      data: { activityId, userId, status: 'pending' },
      include: { user: { select: PARTICIPANT_USER_SELECT } },
    });

    // Notify the host
    if (activity.hostId !== userId) {
      await this.prisma.notification.create({
        data: {
          userId: activity.hostId,
          type: 'join',
          message: `Someone requested to join "${activity.title}"`,
          activityId,
        },
      });
    }

    return participant;
  }

  /** Host approves a join request */
  async approve(activityId: string, requesterId: string, hostId: string) {
    const activity = await this.prisma.activity.findUnique({ where: { id: activityId } });
    if (!activity) throw new NotFoundException('Activity not found');
    if (activity.hostId !== hostId) throw new ForbiddenException('Only the host can approve requests');

    const participant = await this.prisma.activityParticipant.findUnique({
      where: { activityId_userId: { activityId, userId: requesterId } },
    });
    if (!participant) throw new NotFoundException('Request not found');
    if (participant.status === 'approved') throw new ConflictException('Already approved');

    const updated = await this.prisma.activityParticipant.update({
      where: { id: participant.id },
      data: { status: 'approved' },
      include: { user: { select: PARTICIPANT_USER_SELECT } },
    });

    // Notify the requester
    await this.prisma.notification.create({
      data: {
        userId: requesterId,
        type: 'join',
        message: `You've been accepted to "${activity.title}"!`,
        activityId,
      },
    });

    return updated;
  }

  /** Host rejects a join request */
  async reject(activityId: string, requesterId: string, hostId: string) {
    const activity = await this.prisma.activity.findUnique({ where: { id: activityId } });
    if (!activity) throw new NotFoundException('Activity not found');
    if (activity.hostId !== hostId) throw new ForbiddenException('Only the host can reject requests');

    const participant = await this.prisma.activityParticipant.findUnique({
      where: { activityId_userId: { activityId, userId: requesterId } },
    });
    if (!participant) throw new NotFoundException('Request not found');

    const updated = await this.prisma.activityParticipant.update({
      where: { id: participant.id },
      data: { status: 'rejected' },
      include: { user: { select: PARTICIPANT_USER_SELECT } },
    });

    // Notify the requester
    await this.prisma.notification.create({
      data: {
        userId: requesterId,
        type: 'join',
        message: `Your request to join "${activity.title}" was declined`,
        activityId,
      },
    });

    return updated;
  }

  /** Get pending requests for an activity (host only) */
  async getPendingRequests(activityId: string, hostId: string) {
    const activity = await this.prisma.activity.findUnique({ where: { id: activityId } });
    if (!activity) throw new NotFoundException('Activity not found');
    if (activity.hostId !== hostId) throw new ForbiddenException('Only the host can view requests');

    return this.prisma.activityParticipant.findMany({
      where: { activityId, status: 'pending' },
      include: { user: { select: PARTICIPANT_USER_SELECT } },
      orderBy: { joinedAt: 'asc' },
    });
  }

  async leave(activityId: string, userId: string) {
    const activity = await this.prisma.activity.findUnique({ where: { id: activityId } });
    if (!activity) throw new NotFoundException('Activity not found');
    if (activity.hostId === userId) throw new BadRequestException('Host cannot leave their own activity');

    const participant = await this.prisma.activityParticipant.findUnique({
      where: { activityId_userId: { activityId, userId } },
    });
    if (!participant) throw new NotFoundException('Not a participant');

    await this.prisma.activityParticipant.delete({ where: { id: participant.id } });
    return { message: 'Left activity' };
  }

  /** Host removes an approved member */
  async removeMember(activityId: string, memberId: string, hostId: string) {
    const activity = await this.prisma.activity.findUnique({ where: { id: activityId } });
    if (!activity) throw new NotFoundException('Activity not found');
    if (activity.hostId !== hostId) throw new ForbiddenException('Only the host can remove members');
    if (memberId === hostId) throw new BadRequestException('Host cannot remove themselves');

    const participant = await this.prisma.activityParticipant.findUnique({
      where: { activityId_userId: { activityId, userId: memberId } },
    });
    if (!participant) throw new NotFoundException('Member not found');

    await this.prisma.activityParticipant.delete({ where: { id: participant.id } });

    await this.prisma.notification.create({
      data: {
        userId: memberId,
        type: 'join',
        message: `You were removed from "${activity.title}"`,
        activityId,
      },
    });

    return { message: 'Member removed' };
  }

  /** Get approved participants */
  async getParticipants(activityId: string) {
    const activity = await this.prisma.activity.findUnique({ where: { id: activityId } });
    if (!activity) throw new NotFoundException('Activity not found');

    return this.prisma.activityParticipant.findMany({
      where: { activityId, status: 'approved' },
      include: { user: { select: PARTICIPANT_USER_SELECT } },
      orderBy: { joinedAt: 'asc' },
    });
  }
}
