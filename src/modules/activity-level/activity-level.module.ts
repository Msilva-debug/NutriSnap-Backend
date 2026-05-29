import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityLevelController } from './activity-level.controller';
import { ActivityLevelService } from './activity-level.service';
import { ActivityLevel } from './entities/activity-level.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ActivityLevel])],
  controllers: [ActivityLevelController],
  providers: [ActivityLevelService],
  exports: [ActivityLevelService],
})
export class ActivityLevelModule {}
