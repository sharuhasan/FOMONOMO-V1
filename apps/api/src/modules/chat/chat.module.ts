import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatSuggestionsService } from './chat-suggestions.service';
import { ChatGateway } from './chat.gateway';
import { WsAuthGuard } from '../../common/guards/ws-auth.guard';

@Module({
  imports: [JwtModule, ConfigModule],
  controllers: [ChatController],
  providers: [ChatService, ChatSuggestionsService, ChatGateway, WsAuthGuard],
  exports: [ChatService, ChatSuggestionsService],
})
export class ChatModule {}
