import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Meal } from './entities/meal.entity';
import { MealGateway } from './meal.gateway';
import { MealService } from './meal.service';
import { MealController } from './meal.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Meal]), AuthModule],
  controllers: [MealController],
  providers: [MealService, MealGateway],
})
export class MealModule {}
