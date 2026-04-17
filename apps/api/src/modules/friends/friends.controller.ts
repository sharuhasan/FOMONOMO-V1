import { Controller, Post, Delete, Get, Param, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { FriendsService } from './friends.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@ApiTags('Friends')
@Controller('friends')
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Get()
  getFriends(@CurrentUser() user: JwtPayload) {
    return this.friendsService.getFriends(user.sub);
  }

  @Get('requests/incoming')
  getIncomingRequests(@CurrentUser() user: JwtPayload) {
    return this.friendsService.getIncomingRequests(user.sub);
  }

  @Get('requests/outgoing')
  getOutgoingRequests(@CurrentUser() user: JwtPayload) {
    return this.friendsService.getOutgoingRequests(user.sub);
  }

  @Get('status/:userId')
  getStatus(@CurrentUser() user: JwtPayload, @Param('userId') userId: string) {
    return this.friendsService.getStatus(user.sub, userId);
  }

  @Post('request/:userId')
  sendRequest(@CurrentUser() user: JwtPayload, @Param('userId') userId: string) {
    return this.friendsService.sendRequest(user.sub, userId);
  }

  @Patch('accept/:userId')
  acceptRequest(@CurrentUser() user: JwtPayload, @Param('userId') userId: string) {
    return this.friendsService.acceptRequest(user.sub, userId);
  }

  @Patch('reject/:userId')
  rejectRequest(@CurrentUser() user: JwtPayload, @Param('userId') userId: string) {
    return this.friendsService.rejectRequest(user.sub, userId);
  }

  @Delete('request/:userId')
  withdrawRequest(@CurrentUser() user: JwtPayload, @Param('userId') userId: string) {
    return this.friendsService.withdrawRequest(user.sub, userId);
  }

  @Delete(':userId')
  removeFriend(@CurrentUser() user: JwtPayload, @Param('userId') userId: string) {
    return this.friendsService.removeFriend(user.sub, userId);
  }
}
