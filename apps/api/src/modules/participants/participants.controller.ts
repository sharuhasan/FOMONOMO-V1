import { Controller, Post, Delete, Get, Param, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ParticipantsService } from './participants.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@ApiTags('Participants')
@Controller('activities')
export class ParticipantsController {
  constructor(private readonly participantsService: ParticipantsService) {}

  @Post(':id/join')
  requestJoin(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.participantsService.requestJoin(id, user.sub);
  }

  @Patch(':id/approve/:userId')
  approve(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    return this.participantsService.approve(id, userId, user.sub);
  }

  @Patch(':id/reject/:userId')
  reject(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    return this.participantsService.reject(id, userId, user.sub);
  }

  @Get(':id/requests')
  getPendingRequests(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.participantsService.getPendingRequests(id, user.sub);
  }

  @Delete(':id/remove/:userId')
  removeMember(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Param('userId') userId: string,
  ) {
    return this.participantsService.removeMember(id, userId, user.sub);
  }

  @Delete(':id/leave')
  leave(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.participantsService.leave(id, user.sub);
  }

  @Get(':id/participants')
  getParticipants(@Param('id') id: string) {
    return this.participantsService.getParticipants(id);
  }
}
