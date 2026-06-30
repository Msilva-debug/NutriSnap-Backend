import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GeminiModule } from '../gemini/gemini.module';
import { MealModule } from '../meal/meal.module';
import { FoodPreparation } from './entities/food-preparation.entity';
import { FoodPreparationAiService } from './food-preparation-ai.service';
import { FoodPreparationController } from './food-preparation.controller';
import { FoodPreparationService } from './food-preparation.service';

@Module({
  imports: [TypeOrmModule.forFeature([FoodPreparation]), MealModule, GeminiModule],
  controllers: [FoodPreparationController],
  providers: [FoodPreparationService, FoodPreparationAiService],
})
export class FoodPreparationModule {}
