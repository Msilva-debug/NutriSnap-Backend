import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { DailyFoodNote } from '../../meal/entities/daily-food-note.entity';
import { Meal } from '../../meal/entities/meal.entity';
import { MonthlyFoodSummary } from '../../meal/entities/monthly-food-summary.entity';
import { RecommendationAiService } from '../recommendation-ai.service';
import {
  countInclusiveDays,
  validateMonthParam,
} from '../recommendation-date.utils';
import { RecommendationRuleEngine } from '../recommendation-rule-engine.service';
import {
  GetRecommendationsQuery,
  RecommendationStrategy,
  RecommendationsResponse,
} from '../recommendation.types';

@Injectable()
export class MonthlyRecommendationStrategy implements RecommendationStrategy {
  readonly period = 'monthly' as const;

  constructor(
    @InjectRepository(Meal)
    private readonly mealRepository: Repository<Meal>,
    @InjectRepository(DailyFoodNote)
    private readonly dailyFoodNoteRepository: Repository<DailyFoodNote>,
    @InjectRepository(MonthlyFoodSummary)
    private readonly monthlyFoodSummaryRepository: Repository<MonthlyFoodSummary>,
    private readonly recommendationAiService: RecommendationAiService,
    private readonly recommendationRuleEngine: RecommendationRuleEngine,
  ) {}

  async generate(
    userId: number,
    query: GetRecommendationsQuery,
  ): Promise<RecommendationsResponse> {
    const { year, month, startDate, endDate } = validateMonthParam(query.month);
    const [monthlySummary, meals, notes] = await Promise.all([
      this.monthlyFoodSummaryRepository.findOne({
        where: {
          userId,
          year,
          month,
        },
      }),
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
      period: this.period,
      meals,
      notes,
      totalDays: countInclusiveDays(startDate, endDate),
      summary:
        monthlySummary?.summary ??
        `No existe resumen mensual guardado para ${query.month}; las recomendaciones se calcularon con comidas y notas diarias del mes.`,
    };
    const aiRecommendations = await this.recommendationAiService.buildFromText(
      input,
      this.buildMonthlyContext(query.month ?? '', monthlySummary, notes, meals),
    );

    return aiRecommendations ?? this.recommendationRuleEngine.build(input);
  }

  private buildMonthlyContext(
    month: string,
    monthlySummary: MonthlyFoodSummary | null,
    notes: DailyFoodNote[],
    meals: Meal[],
  ): string {
    if (monthlySummary?.summary?.trim()) {
      return [
        `Mes: ${month}`,
        'Resumen mensual guardado en monthly_food_summaries:',
        monthlySummary.summary,
      ].join('\n');
    }

    return [
      `Mes: ${month}`,
      notes.length ? 'Notas diarias del mes:' : '',
      ...notes.map((note) => `- ${note.date}: ${note.note}`),
      meals.length ? 'Comidas registradas del mes:' : '',
      ...meals.map(
        (meal) =>
          `- ${meal.date} ${meal.type}: ${meal.name}, ${meal.calories} kcal, proteinas ${meal.proteins ?? 0}g, carbohidratos ${meal.carbs ?? 0}g, grasas ${meal.fats ?? 0}g`,
      ),
    ]
      .filter(Boolean)
      .join('\n');
  }
}
