import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProfilesService } from './profiles.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@ApiTags('Profiles')
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Get('me')
  getMyProfile(@CurrentUser() user: JwtPayload) {
    return this.profilesService.getProfile(user.sub);
  }

  @Patch('me')
  updateMyProfile(
    @CurrentUser() user: JwtPayload,
    @Body()
    body: {
      displayName?: string;
      bio?: string;
      age?: number;
      gender?: string;
      interests?: string[];
      societies?: string[];
      profilePrimary?: string;
      profileSecondary?: string;
      profileAccent?: string;
      fullName?: string;
    },
  ) {
    return this.profilesService.updateMyProfile(user.sub, body as any);
  }

  @Get(':id')
  getProfile(@Param('id') id: string) {
    return this.profilesService.getProfile(id);
  }

  @Get(':id/stats')
  getStats(@Param('id') id: string) {
    return this.profilesService.getStats(id);
  }
}
