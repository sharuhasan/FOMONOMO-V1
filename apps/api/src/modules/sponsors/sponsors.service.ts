import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CampaignType, CampaignStatus } from '@prisma/client';

@Injectable()
export class SponsorsService {
  constructor(private prisma: PrismaService) {}

  async create(
    sponsorId: string,
    data: {
      activityId?: string;
      campaignType?: CampaignType;
      budget?: number;
      durationDays?: number;
      targetCategories?: string[];
      targetRadiusKm?: number;
    },
  ) {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (data.durationDays ?? 3));

    return this.prisma.sponsorCampaign.create({
      data: {
        sponsorId,
        activityId: data.activityId,
        campaignType: data.campaignType ?? 'boost',
        budget: data.budget ?? 0,
        durationDays: data.durationDays ?? 3,
        targetCategories: data.targetCategories ?? [],
        targetRadiusKm: data.targetRadiusKm ?? 5,
        expiresAt,
      },
    });
  }

  async getMyCampaigns(sponsorId: string) {
    return this.prisma.sponsorCampaign.findMany({
      where: { sponsorId },
      orderBy: { createdAt: 'desc' },
      include: {
        activity: { select: { id: true, title: true, category: true } },
      },
    });
  }

  async getStats(sponsorId: string) {
    const campaigns = await this.prisma.sponsorCampaign.findMany({
      where: { sponsorId },
    });

    return {
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter((c) => c.status === 'active').length,
      totalImpressions: campaigns.reduce((sum, c) => sum + c.impressions, 0),
      totalClicks: campaigns.reduce((sum, c) => sum + c.clicks, 0),
      totalJoins: campaigns.reduce((sum, c) => sum + c.joins, 0),
      totalBudget: campaigns.reduce((sum, c) => sum + Number(c.budget), 0),
    };
  }

  async updateStatus(id: string, sponsorId: string, status: CampaignStatus) {
    const campaign = await this.prisma.sponsorCampaign.findUnique({ where: { id } });
    if (!campaign) throw new NotFoundException('Campaign not found');
    if (campaign.sponsorId !== sponsorId)
      throw new ForbiddenException('Not your campaign');

    return this.prisma.sponsorCampaign.update({
      where: { id },
      data: { status },
    });
  }
}
