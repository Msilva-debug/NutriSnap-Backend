import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DailyFoodNote } from '../../meal/entities/daily-food-note.entity';
import { Meal } from '../../meal/entities/meal.entity';
import { RecommendationAiService } from '../recommendation-ai.service';
import { validateDateParam } from '../recommendation-date.utils';
import { RecommendationRuleEngine } from '../recommendation-rule-engine.service';
import {
  GetRecommendationsQuery,
  RecommendationStrategy,
  RecommendationsResponse,
} from '../recommendation.types';

@Injectable()
export class DailyRecommendationStrategy implements RecommendationStrategy {
  readonly period = 'daily' as const;

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
    const date = validateDateParam(query.date, 'date');
    const [meals, dailyFoodNote] = await Promise.all([
      this.mealRepository.find({
        where: { userId, date },
        order: { time: 'ASC' },
      }),
      this.dailyFoodNoteRepository.findOne({
        where: { userId, date },
      }),
    ]);

    const input = {
      period: this.period,
      meals,
      notes: dailyFoodNote ? [dailyFoodNote] : [],
      totalDays: 1,
      summary: dailyFoodNote?.note,
    };
    const aiRecommendations = await this.recommendationAiService.buildFromText(
      input,
      this.buildDailyContext(date, dailyFoodNote, meals),
    );
    console.log('AI Recommendations:', aiRecommendations);

    return aiRecommendations ?? this.recommendationRuleEngine.build(input);
  }

  private buildDailyContext(
    date: string,
    dailyFoodNote: DailyFoodNote | null,
    meals: Meal[],
  ): string {
    return [
      `Fecha: ${date}`,
      dailyFoodNote ? `Nota diaria: ${dailyFoodNote.note}` : '',
      meals.length ? 'Comidas registradas:' : '',
      ...meals.map(
        (meal) =>
          `- ${meal.type}: ${meal.name}, ${meal.calories} kcal, proteinas ${meal.proteins ?? 0}g, carbohidratos ${meal.carbs ?? 0}g, grasas ${meal.fats ?? 0}g`,
      ),
    ]
      .filter(Boolean)
      .join('\n');
  }
}
