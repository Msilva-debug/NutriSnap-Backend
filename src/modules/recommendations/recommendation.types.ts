import { DailyFoodNote } from '../meal/entities/daily-food-note.entity';
import { Meal } from '../meal/entities/meal.entity';
import { FoodTextEmbeddingSourceType } from '../food-embedding/entities/food-text-embedding.entity';

export const recommendationPeriods = ['daily', 'range'] as const;

export type RecommendationPeriod = (typeof recommendationPeriods)[number];

export interface GetRecommendationsQuery {
  date?: string;
  endDate?: string;
  period?: string;
  startDate?: string;
}

export interface Recommendation {
  category?: string;
  description: string;
  title: string;
}

export interface RecommendationsResponse {
  period: RecommendationPeriod;
  recommendations: Recommendation[];
  summary?: string;
}

export interface RecommendationAnalysisInput {
  embeddingExclusions?: Array<{
    sourceId: number;
    sourceType: FoodTextEmbeddingSourceType;
  }>;
  meals: Meal[];
  notes: DailyFoodNote[];
  period: RecommendationPeriod;
  summary?: string;
  totalDays: number;
  userId: number;
}

export interface RecommendationStrategy {
  generate(
    userId: number,
    query: GetRecommendationsQuery,
  ): Promise<RecommendationsResponse>;
  period: RecommendationPeriod;
}
