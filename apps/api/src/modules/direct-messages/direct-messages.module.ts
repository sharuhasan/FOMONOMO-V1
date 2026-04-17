import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { DirectMessagesController } from './direct-messages.controller';
import { DirectMessagesService } from './direct-messages.service';
import { DmGateway } from './dm.gateway';
import { WsAuthGuard } from '../../common/guards/ws-auth.guard';
import { ChatModule } from '../chat/chat.module';

@Module({
  imports: [JwtModule, ConfigModule, ChatModule],
  controllers: [DirectMessagesController],
  providers: [DirectMessagesService, DmGateway, WsAuthGuard],
  exports: [DirectMessagesService],
})
export class DirectMessagesModule {}
