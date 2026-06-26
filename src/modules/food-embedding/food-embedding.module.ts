import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyFoodNote } from '../meal/entities/daily-food-note.entity';
import { Meal } from '../meal/entities/meal.entity';
import { FoodTextEmbedding } from './entities/food-text-embedding.entity';
import { FoodTextEmbeddingCron } from './food-text-embedding.cron';
import { FoodTextEmbeddingService } from './food-text-embedding.service';

@Module({
  imports: [TypeOrmModule.forFeature([FoodTextEmbedding, DailyFoodNote, Meal])],
  providers: [FoodTextEmbeddingService, FoodTextEmbeddingCron],
  exports: [FoodTextEmbeddingService],
})
export class FoodEmbeddingModule {}
