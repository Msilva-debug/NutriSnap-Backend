import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { FoodTextEmbeddingSourceType } from '../../food-embedding/entities/food-text-embedding.entity';
import { DailyFoodNote } from '../../meal/entities/daily-food-note.entity';
import { Meal } from '../../meal/entities/meal.entity';
import { RecommendationAiService } from '../recommendation-ai.service';
import {
  buildTwoMonthComparisonWindow,
  countInclusiveDays,
  validateDateRange,
} from '../recommendation-date.utils';
import { RecommendationRuleEngine } from '../recommendation-rule-engine.service';
import {
  GetRecommendationsQuery,
  RecommendationStrategy,
  RecommendationsResponse,
} from '../recommendation.types';

@Injectable()
export class RangeRecommendationStrategy implements RecommendationStrategy {
  readonly period = 'range' as const;

  constructor(
    @InjectRepository(Meal)
    private readonly mealRepository: Repository<Meal>,
    @InjectRepository(DailyFoodNote)
    private readonly dailyFoodNoteRepository: Repository<DailyFoodNote>,
    private readonly recommendationAiService: RecommendationAiService,
    private readonly recommendationRuleEngine: RecommendationRuleEngine,
  ) {}

  async generate(
    userId: number,
    query: GetRecommendationsQuery,
  ): Promise<RecommendationsResponse> {
    const { startDate, endDate } = validateDateRange(
      query.startDate,
      query.endDate,
    );
    const [meals, notes] = await Promise.all([
      this.mealRepository.find({
        where: {
          userId,
          date: Between(startDate, endDate),
        },
        order: {
          date: 'ASC',
          time: 'ASC',
        },
      }),
      this.dailyFoodNoteRepository.find({
        where: {
          userId,
          date: Between(startDate, endDate),
        },
        order: {
          date: 'ASC',
        },
      }),
    ]);

    const input = {
      userId,
      period: this.period,
      meals,
      notes,
      totalDays: countInclusiveDays(startDate, endDate),
      semanticMemoryComparisonWindow: buildTwoMonthComparisonWindow(startDate),
      embeddingExclusions: notes.map((note) => ({
        sourceType: FoodTextEmbeddingSourceType.DAILY_NOTE,
        sourceId: note.id,
      })),
    };
    const aiRecommendations = await this.recommendationAiService.buildFromText(
      input,
      this.buildRangeContext(startDate, endDate, notes, meals),
    );

    return aiRecommendations ?? this.recommendationRuleEngine.build(input);
  }

  private buildRangeContext(
    startDate: string,
    endDate: string,
    notes: DailyFoodNote[],
    meals: Meal[],
  ): string {
    return [
      `Rango: ${startDate} a ${endDate}`,
      notes.length ? 'Notas diarias del rango:' : '',
      ...notes.map((note) => `- ${note.date}: ${note.note}`),
      meals.length ? 'Comidas registradas del rango:' : '',
      ...meals.map(
        (meal) =>
          `- ${meal.date} ${meal.type}: ${meal.name}, ${meal.calories} kcal, proteinas ${meal.proteins ?? 0}g, carbohidratos ${meal.carbs ?? 0}g, grasas ${meal.fats ?? 0}g`,
      ),
    ]
      .filter(Boolean)
      .join('\n');
  }
}
