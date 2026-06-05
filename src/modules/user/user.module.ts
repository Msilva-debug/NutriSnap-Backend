import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ActivityLevel } from '../activity-level/entities/activity-level.entity';
import { NutritionPlanModule } from '../nutrition-plan/nutrition-plan.module';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { UsersController } from './user.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, ActivityLevel]),
    NutritionPlanModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
