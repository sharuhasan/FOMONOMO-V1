import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { DirectMessagesService } from './direct-messages.service';
import { ChatSuggestionsService } from '../chat/chat-suggestions.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@ApiTags('DirectMessages')
@Controller('dm')
export class DirectMessagesController {
  constructor(
    private readonly directMessagesService: DirectMessagesService,
    private readonly suggestionsService: ChatSuggestionsService,
  ) {}

  @Get('conversations')
  getConversations(@CurrentUser() user: JwtPayload) {
    return this.directMessagesService.getConversations(user.sub);
  }

  @Get('suggestions/:userId')
  getSuggestions(
    @CurrentUser() user: JwtPayload,
    @Param('userId') partnerId: string,
  ) {
    return this.suggestionsService.getDmSuggestions(user.sub, partnerId);
  }

  @Get(':userId')
  getMessages(
    @CurrentUser() user: JwtPayload,
    @Param('userId') partnerId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.directMessagesService.getMessages(
      user.sub,
      partnerId,
      page ? parseInt(page) : undefined,
      limit ? parseInt(limit) : undefined,
    );
  }

  @Post(':userId')
  sendMessage(
    @CurrentUser() user: JwtPayload,
    @Param('userId') receiverId: string,
    @Body() body: { content: string },
  ) {
    return this.directMessagesService.sendMessage(
      user.sub,
      receiverId,
      body.content,
    );
  }
}
