import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get('REDIS_HOST', 'localhost'),
          port: config.get('REDIS_PORT', 6379),
          password: config.get('REDIS_PASSWORD', undefined),
        },
      }),
    }),
    BullModule.registerQueue(
      { name: 'notifications' },
      { name: 'campaign-lifecycle' },
      { name: 'activity-cleanup' },
      { name: 'analytics' },
    ),
  ],
  exports: [BullModule],
})
export class JobsModule {}
