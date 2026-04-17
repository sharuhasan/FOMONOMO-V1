import { Module } from '@nestjs/common';
import { ActivitiesController } from './activities.controller';
import { ActivitiesService } from './activities.service';
import { GeoModule } from '../geo/geo.module';
import { BlocksModule } from '../blocks/blocks.module';

@Module({
  imports: [GeoModule, BlocksModule],
  controllers: [ActivitiesController],
  providers: [ActivitiesService],
  exports: [ActivitiesService],
})
export class ActivitiesModule {}
