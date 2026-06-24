import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { DailyFoodNote } from '../meal/entities/daily-food-note.entity';
import { Meal } from '../meal/entities/meal.entity';
import { MonthlyFoodSummary } from '../meal/entities/monthly-food-summary.entity';
import { RecommendationAiService } from './recommendation-ai.service';
import { RecommendationRuleEngine } from './recommendation-rule-engine.service';
import { RecommendationStrategyFactory } from './recommendation-strategy.factory';
import { RecommendationsController } from './recommendations.controller';
import { RecommendationsService } from './recommendations.service';
import { DailyRecommendationStrategy } from './strategies/daily-recommendation.strategy';
import { MonthlyRecommendationStrategy } from './strategies/monthly-recommendation.strategy';
import { RangeRecommendationStrategy } from './strategies/range-recommendation.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([Meal, DailyFoodNote, MonthlyFoodSummary]),
    AuthModule,
  ],
  controllers: [RecommendationsController],
  providers: [
    RecommendationsService,
    RecommendationStrategyFactory,
    RecommendationAiService,
    RecommendationRuleEngine,
    DailyRecommendationStrategy,
    MonthlyRecommendationStrategy,
    RangeRecommendationStrategy,
  ],
})
export class RecommendationsModule {}
