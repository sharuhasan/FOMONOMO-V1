import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { AuthModule } from './modules/auth/auth.module';
import { ProfilesModule } from './modules/profiles/profiles.module';
import { ActivitiesModule } from './modules/activities/activities.module';
import { ParticipantsModule } from './modules/participants/participants.module';
import { ChatModule } from './modules/chat/chat.module';
import { DirectMessagesModule } from './modules/direct-messages/direct-messages.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReportsModule } from './modules/reports/reports.module';
import { SponsorsModule } from './modules/sponsors/sponsors.module';
import { AnnouncementsModule } from './modules/announcements/announcements.module';
import { AdminModule } from './modules/admin/admin.module';
import { RecommendationsModule } from './modules/recommendations/recommendations.module';
import { UploadModule } from './modules/upload/upload.module';
import { BlocksModule } from './modules/blocks/blocks.module';
import { FriendsModule } from './modules/friends/friends.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    RedisModule,
    AuthModule,
    ProfilesModule,
    ActivitiesModule,
    ParticipantsModule,
    ChatModule,
    DirectMessagesModule,
    ReviewsModule,
    NotificationsModule,
    ReportsModule,
    SponsorsModule,
    AnnouncementsModule,
    AdminModule,
    RecommendationsModule,
    UploadModule,
    BlocksModule,
    FriendsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
