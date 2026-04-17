import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import Anthropic from '@anthropic-ai/sdk';

@Injectable()
export class ChatSuggestionsService {
  private readonly logger = new Logger(ChatSuggestionsService.name);
  private client: Anthropic | null = null;

  constructor(private prisma: PrismaService) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      this.client = new Anthropic({ apiKey });
    }
  }

  async getActivityChatSuggestions(
    activityId: string,
    userId: string,
  ): Promise<string[]> {
    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
      select: {
        title: true,
        category: true,
        description: true,
        location: true,
        scheduledTime: true,
        hostId: true,
      },
    });
    if (!activity) return this.getDefaultActivitySuggestions('Social', false);

    const isHost = activity.hostId === userId;

    // Get recent messages for context
    const recentMessages = await this.prisma.activityMessage.findMany({
      where: { activityId },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        user: {
          select: { fullName: true, profile: { select: { displayName: true } } },
        },
      },
    });

    if (!this.client) {
      return this.getDefaultActivitySuggestions(activity.category, isHost);
    }

    try {
      const chatContext = recentMessages
        .reverse()
        .map((m) => `${m.user?.profile?.displayName || m.user?.fullName || 'User'}: ${m.content}`)
        .join('\n');

      const response = await this.client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [
          {
            role: 'user',
            content: `You are a chat suggestion assistant for a social activity app. Generate 4 short, natural reply suggestions for a group chat.

Activity: "${activity.title}" (${activity.category})
Location: ${activity.location}
Time: ${activity.scheduledTime}
User is ${isHost ? 'the host' : 'a participant'}

${chatContext ? `Recent messages:\n${chatContext}` : 'No messages yet — suggest conversation starters.'}

Return ONLY a JSON array of 4 short strings (max 40 chars each). No explanation.`,
          },
        ],
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '';
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.slice(0, 4).map(String);
      }
    } catch (e) {
      this.logger.warn('AI suggestion failed, using defaults', e);
    }

    return this.getDefaultActivitySuggestions(activity.category, isHost);
  }

  async getDmSuggestions(
    userId: string,
    partnerId: string,
  ): Promise<string[]> {
    const recentMessages = await this.prisma.directMessage.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: partnerId },
          { senderId: partnerId, receiverId: userId },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        sender: {
          select: { fullName: true, profile: { select: { displayName: true } } },
        },
      },
    });

    if (!this.client) {
      return this.getDefaultDmSuggestions(recentMessages.length === 0);
    }

    try {
      const chatContext = recentMessages
        .reverse()
        .map((m) => `${m.sender?.profile?.displayName || m.sender?.fullName || 'User'}: ${m.content}`)
        .join('\n');

      const response = await this.client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [
          {
            role: 'user',
            content: `You are a chat suggestion assistant for a social app. Generate 4 short, friendly reply suggestions for a direct message conversation.

${chatContext ? `Recent messages:\n${chatContext}` : 'No messages yet — suggest conversation starters.'}

Return ONLY a JSON array of 4 short strings (max 40 chars each). No explanation.`,
          },
        ],
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '';
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.slice(0, 4).map(String);
      }
    } catch (e) {
      this.logger.warn('AI suggestion failed, using defaults', e);
    }

    return this.getDefaultDmSuggestions(recentMessages.length === 0);
  }

  private getDefaultActivitySuggestions(category: string, isHost: boolean): string[] {
    const categoryTemplates: Record<string, string[]> = {
      Sports: ['Who\'s bringing equipment?', 'Let\'s warm up first!', 'Good game everyone!', 'What\'s the plan?'],
      Food: ['Any dietary restrictions?', 'I\'ll bring drinks!', 'Looks delicious!', 'What should I bring?'],
      Study: ['What topics are we covering?', 'I\'ll bring my notes', 'Anyone need help?', 'Great session!'],
      Music: ['What are we playing?', 'I\'ll bring my guitar!', 'Great vibes!', 'Any song requests?'],
      Art: ['What supplies do we need?', 'Love the creativity!', 'This is so fun!', 'Great work everyone!'],
      Fitness: ['Let\'s crush it!', 'Don\'t forget water!', 'Great workout!', 'What\'s the routine?'],
      Gaming: ['What are we playing?', 'GG everyone!', 'One more round?', 'Who\'s ready?'],
    };

    const general = isHost
      ? ['Welcome everyone!', 'See you all there!', 'Any questions?', 'Running on time!']
      : ['Hey everyone!', 'On my way!', 'Can\'t wait!', 'See you soon!'];

    return categoryTemplates[category] ?? general;
  }

  private getDefaultDmSuggestions(isEmpty: boolean): string[] {
    if (isEmpty) {
      return ['Hey! How are you?', 'Want to hang out?', 'Saw your activity!', 'Nice to meet you!'];
    }
    return ['Sounds good!', 'When works for you?', 'See you there!', 'Thanks!'];
  }
}
