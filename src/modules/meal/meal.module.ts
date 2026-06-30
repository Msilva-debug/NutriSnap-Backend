import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { FoodEmbeddingModule } from '../food-embedding/food-embedding.module';
import { GeminiModule } from '../gemini/gemini.module';
import { DailyFoodNote } from './entities/daily-food-note.entity';
import { Meal } from './entities/meal.entity';
import { MealGateway } from './meal.gateway';
import { MealService } from './meal.service';
import { MealController } from './meal.controller';
import { MealImageAnalysisService } from './meal-image-analysis.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Meal, DailyFoodNote]),
    AuthModule,
    FoodEmbeddingModule,
    GeminiModule,
  ],
  controllers: [MealController],
  providers: [MealService, MealGateway, MealImageAnalysisService],
  exports: [MealService],
})
export class MealModule {}
