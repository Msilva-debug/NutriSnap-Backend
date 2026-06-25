import { BadRequestException, Injectable } from '@nestjs/common';
import { DailyRecommendationStrategy } from './strategies/daily-recommendation.strategy';
import { RangeRecommendationStrategy } from './strategies/range-recommendation.strategy';
import {
  RecommendationPeriod,
  RecommendationStrategy,
  recommendationPeriods,
} from './recommendation.types';

@Injectable()
export class RecommendationStrategyFactory {
  private readonly strategies: Record<
    RecommendationPeriod,
    RecommendationStrategy
  >;

  constructor(
    dailyRecommendationStrategy: DailyRecommendationStrategy,
    rangeRecommendationStrategy: RangeRecommendationStrategy,
  ) {
    this.strategies = {
      daily: dailyRecommendationStrategy,
      range: rangeRecommendationStrategy,
    };
  }

  getStrategy(period?: string): RecommendationStrategy {
    if (!period?.trim()) {
      throw new BadRequestException('period es requerido');
    }

    const normalizedPeriod = period.trim() as RecommendationPeriod;

    if (!recommendationPeriods.includes(normalizedPeriod)) {
      throw new BadRequestException('period solo puede ser: daily, range');
    }

    return this.strategies[normalizedPeriod];
  }
}
