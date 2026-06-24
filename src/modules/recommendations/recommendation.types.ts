import { DailyFoodNote } from '../meal/entities/daily-food-note.entity';
import { Meal } from '../meal/entities/meal.entity';

export const recommendationPeriods = ['daily', 'monthly', 'range'] as const;

export type RecommendationPeriod = (typeof recommendationPeriods)[number];

export interface GetRecommendationsQuery {
  date?: string;
  endDate?: string;
  month?: string;
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
  meals: Meal[];
  notes: DailyFoodNote[];
  period: RecommendationPeriod;
  summary?: string;
  totalDays: number;
}

export interface RecommendationStrategy {
  generate(
    userId: number,
    query: GetRecommendationsQuery,
  ): Promise<RecommendationsResponse>;
  period: RecommendationPeriod;
}
