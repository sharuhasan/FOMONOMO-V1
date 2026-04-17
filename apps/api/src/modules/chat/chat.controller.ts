import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { ChatSuggestionsService } from './chat-suggestions.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../../common/interfaces/jwt-payload.interface';

@ApiTags('Chat')
@Controller('activities')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly suggestionsService: ChatSuggestionsService,
  ) {}

  @Get(':id/messages')
  getMessages(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.chatService.getMessages(
      id,
      page ? parseInt(page) : undefined,
      limit ? parseInt(limit) : undefined,
    );
  }

  @Post(':id/messages')
  sendMessage(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body() body: { content: string },
  ) {
    return this.chatService.createMessage(id, user.sub, body.content);
  }

  @Get(':id/chat-suggestions')
  getChatSuggestions(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ) {
    return this.suggestionsService.getActivityChatSuggestions(id, user.sub);
  }
}
