import { Controller, Post, Get, Patch, Param, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SponsorsService } from './sponsors.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@ApiTags('Sponsors')
@Controller('sponsors')
export class SponsorsController {
  constructor(private readonly sponsorsService: SponsorsService) {}

  @Post('campaigns')
  create(
    @CurrentUser() user: JwtPayload,
    @Body() body: {
      activityId?: string;
      campaignType?: string;
      budget?: number;
      durationDays?: number;
      targetCategories?: string[];
      targetRadiusKm?: number;
    },
  ) {
    return this.sponsorsService.create(user.sub, body as any);
  }

  @Get('campaigns')
  getMyCampaigns(@CurrentUser() user: JwtPayload) {
    return this.sponsorsService.getMyCampaigns(user.sub);
  }

  @Get('stats')
  getStats(@CurrentUser() user: JwtPayload) {
    return this.sponsorsService.getStats(user.sub);
  }

  @Patch('campaigns/:id')
  updateStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.sponsorsService.updateStatus(id, user.sub, body.status as any);
  }
}
