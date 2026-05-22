import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Meal } from './entities/meal.entity';
import { MealService } from './meal.service';
import { MealController } from './meal.controller';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([Meal])],
  controllers: [MealController],
  providers: [MealService],
})
export class MealModule {}
