import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { FoodEmbeddingModule } from '../food-embedding/food-embedding.module';
import { DailyFoodNote } from '../meal/entities/daily-food-note.entity';
import { Meal } from '../meal/entities/meal.entity';
import { NutritionPlan } from '../nutrition-plan/entities/nutrition-plan.entity';
import { NutritionRecommendationAgent } from './agents/nutrition-recommendation.agent';
import { RecommendationAiService } from './recommendation-ai.service';
import { RecommendationRuleEngine } from './recommendation-rule-engine.service';
import { RecommendationStrategyFactory } from './recommendation-strategy.factory';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';
import { DailyRecommendationStrategy } from './strategies/daily-recommendation.strategy';
import { RangeRecommendationStrategy } from './strategies/range-recommendation.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([Meal, DailyFoodNote, NutritionPlan]),
    AuthModule,
    FoodEmbeddingModule,
  ],
  controllers: [RecommendationsController],
  providers: [
    RecommendationsService,
    RecommendationStrategyFactory,
    NutritionRecommendationAgent,
    RecommendationAiService,
    RecommendationRuleEngine,
    DailyRecommendationStrategy,
    RangeRecommendationStrategy,
  ],
})
export class RecommendationsModule {}
