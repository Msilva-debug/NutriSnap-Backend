import { Injectable } from '@nestjs/common';
import { FoodTextEmbeddingService } from '../food-embedding/food-text-embedding.service';
import { RecommendationStrategyFactory } from './recommendation-strategy.factory';
import {
  GetRecommendationsQuery,
  RecommendationsResponse,
} from './recommendation.types';

@Injectable()
export class RecommendationsService {
  constructor(
    private readonly recommendationStrategyFactory: RecommendationStrategyFactory,
    private readonly foodTextEmbeddingService: FoodTextEmbeddingService,
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

  backfillEmbeddings(userId: number) {
    return this.foodTextEmbeddingService.backfillUserEmbeddings(userId);
  }
}
