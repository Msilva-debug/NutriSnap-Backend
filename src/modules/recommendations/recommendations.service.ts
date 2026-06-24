import { Injectable } from '@nestjs/common';
import { RecommendationStrategyFactory } from './recommendation-strategy.factory';
import {
  GetRecommendationsQuery,
  RecommendationsResponse,
} from './recommendation.types';

@Injectable()
export class RecommendationsService {
  constructor(
    private readonly recommendationStrategyFactory: RecommendationStrategyFactory,
  ) {}

  getRecommendations(
    userId: number,
    query: GetRecommendationsQuery,
  ): Promise<RecommendationsResponse> {
    const strategy = this.recommendationStrategyFactory.getStrategy(
      query.period,
    );

    return strategy.generate(userId, query);
  }
}
