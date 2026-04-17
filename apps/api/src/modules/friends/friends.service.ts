import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const USER_SELECT = {
  id: true,
  fullName: true,
  profile: { select: { displayName: true, avatarUrl: true, bio: true } },
};

@Injectable()
export class FriendsService {
  constructor(private prisma: PrismaService) {}

  /** Send a friend request */
  async sendRequest(requesterId: string, addresseeId: string) {
    if (requesterId === addresseeId) {
      throw new BadRequestException('Cannot send friend request to yourself');
    }

    // Check if any friendship exists in either direction
    const existing = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId, addresseeId },
          { requesterId: addresseeId, addresseeId: requesterId },
        ],
      },
    });

    if (existing) {
      if (existing.status === 'accepted') throw new ConflictException('Already friends');
      if (existing.status === 'pending' && existing.requesterId === requesterId) {
        throw new ConflictException('Friend request already sent');
      }
      if (existing.status === 'pending' && existing.addresseeId === requesterId) {
        // They sent us a request — auto-accept
        return this.acceptRequest(requesterId, addresseeId);
      }
      if (existing.status === 'rejected') {
        // Allow re-request: update back to pending
        return this.prisma.friendship.update({
          where: { id: existing.id },
          data: {
            status: 'pending',
            requesterId,
            addresseeId,
          },
        });
      }
    }

    const friendship = await this.prisma.friendship.create({
      data: { requesterId, addresseeId },
    });

    // Notify addressee
    await this.prisma.notification.create({
      data: {
        userId: addresseeId,
        type: 'join',
        message: 'You have a new friend request',
        metadata: { route: 'friends' },
      },
    });

    return friendship;
  }

  /** Accept a friend request */
  async acceptRequest(userId: string, requesterId: string) {
    const friendship = await this.prisma.friendship.findFirst({
      where: {
        requesterId,
        addresseeId: userId,
        status: 'pending',
      },
    });
    if (!friendship) throw new NotFoundException('Friend request not found');

    const updated = await this.prisma.friendship.update({
      where: { id: friendship.id },
      data: { status: 'accepted' },
    });

    // Notify requester
    await this.prisma.notification.create({
      data: {
        userId: requesterId,
        type: 'join',
        message: 'Your friend request was accepted!',
        metadata: { route: 'friends' },
      },
    });

    return updated;
  }

  /** Reject a friend request */
  async rejectRequest(userId: string, requesterId: string) {
    const friendship = await this.prisma.friendship.findFirst({
      where: {
        requesterId,
        addresseeId: userId,
        status: 'pending',
      },
    });
    if (!friendship) throw new NotFoundException('Friend request not found');

    return this.prisma.friendship.update({
      where: { id: friendship.id },
      data: { status: 'rejected' },
    });
  }

  /** Withdraw a sent friend request */
  async withdrawRequest(requesterId: string, addresseeId: string) {
    const friendship = await this.prisma.friendship.findFirst({
      where: { requesterId, addresseeId, status: 'pending' },
    });
    if (!friendship) throw new NotFoundException('Pending request not found');

    await this.prisma.friendship.delete({ where: { id: friendship.id } });
    return { message: 'Friend request withdrawn' };
  }

  /** Remove a friend (either side can do it) */
  async removeFriend(userId: string, friendId: string) {
    const friendship = await this.prisma.friendship.findFirst({
      where: {
        status: 'accepted',
        OR: [
          { requesterId: userId, addresseeId: friendId },
          { requesterId: friendId, addresseeId: userId },
        ],
      },
    });
    if (!friendship) throw new NotFoundException('Friendship not found');

    await this.prisma.friendship.delete({ where: { id: friendship.id } });
    return { message: 'Friend removed' };
  }

  /** Get accepted friends */
  async getFriends(userId: string) {
    const friendships = await this.prisma.friendship.findMany({
      where: {
        status: 'accepted',
        OR: [{ requesterId: userId }, { addresseeId: userId }],
      },
      include: {
        requester: { select: USER_SELECT },
        addressee: { select: USER_SELECT },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return friendships.map((f) =>
      f.requesterId === userId ? f.addressee : f.requester,
    );
  }

  /** Get pending requests received */
  async getIncomingRequests(userId: string) {
    const requests = await this.prisma.friendship.findMany({
      where: { addresseeId: userId, status: 'pending' },
      include: { requester: { select: USER_SELECT } },
      orderBy: { createdAt: 'desc' },
    });
    return requests.map((r) => r.requester);
  }

  /** Get pending requests sent */
  async getOutgoingRequests(userId: string) {
    const requests = await this.prisma.friendship.findMany({
      where: { requesterId: userId, status: 'pending' },
      include: { addressee: { select: USER_SELECT } },
      orderBy: { createdAt: 'desc' },
    });
    return requests.map((r) => r.addressee);
  }

  /** Get friendship status between two users */
  async getStatus(userId: string, otherUserId: string) {
    const friendship = await this.prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: userId, addresseeId: otherUserId },
          { requesterId: otherUserId, addresseeId: userId },
        ],
      },
    });

    if (!friendship) return { status: 'none' };

    return {
      status: friendship.status,
      direction: friendship.requesterId === userId ? 'outgoing' : 'incoming',
    };
  }
}
