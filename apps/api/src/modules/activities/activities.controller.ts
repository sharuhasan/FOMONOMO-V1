import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ActivitiesService } from './activities.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@ApiTags('Activities')
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  create(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      title: string;
      description?: string;
      category: string;
      societyTag?: string;
      apartmentCommunity?: string;
      location: string;
      lat: number;
      lng: number;
      scheduledTime: string;
      maxParticipants?: number;
      imageUrl?: string;
      genderFilter?: string;
      minAge?: number;
      maxAge?: number;
    },
  ) {
    return this.activitiesService.create(user.sub, body as any);
  }

  @Get()
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query()
    query: {
      category?: string;
      search?: string;
      lat?: string;
      lng?: string;
      radiusKm?: string;
      upcoming?: string;
      hostId?: string;
      page?: string;
      limit?: string;
    },
  ) {
    return this.activitiesService.findAll({
      category: query.category as any,
      search: query.search,
      lat: query.lat ? parseFloat(query.lat) : undefined,
      lng: query.lng ? parseFloat(query.lng) : undefined,
      radiusKm: query.radiusKm ? parseFloat(query.radiusKm) : undefined,
      upcoming: query.upcoming === 'true',
      hostId: query.hostId,
      page: query.page ? parseInt(query.page) : undefined,
      limit: query.limit ? parseInt(query.limit) : undefined,
      viewerId: user.sub,
    });
  }

  @Get('my/history')
  getMyHistory(@CurrentUser() user: JwtPayload) {
    return this.activitiesService.getMyHistory(user.sub);
  }

  @Get(':id')
  findOne(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.activitiesService.findOne(id, user.sub);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: Record<string, any>,
  ) {
    return this.activitiesService.update(id, user.sub, body as any);
  }

  @Delete(':id')
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.activitiesService.remove(id, user.sub);
  }
}
