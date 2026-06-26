import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  FoodTextEmbeddingService,
  SimilarEmbeddingResult,
} from '../../food-embedding/food-text-embedding.service';
import {
  NutritionPlan,
  UserGoal,
} from '../../nutrition-plan/entities/nutrition-plan.entity';
import { RecommendationAnalysisInput } from '../recommendation.types';
import { NUTRITION_RECOMMENDATION_SYSTEM_PROMPT } from './nutrition-recommendation.prompt';

interface MacroTotals {
  calories: number;
  carbs: number;
  fats: number;
  proteins: number;
}

@Injectable()
export class NutritionRecommendationAgent {
  constructor(
    private readonly foodTextEmbeddingService: FoodTextEmbeddingService,
    @InjectRepository(NutritionPlan)
    private readonly nutritionPlanRepository: Repository<NutritionPlan>,
  ) {}

  async buildGeminiRequest(
    input: RecommendationAnalysisInput,
    sourceText: string,
  ): Promise<Record<string, unknown>> {
    const prompt = await this.buildPrompt(input, sourceText);

    return {
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    };
  }

  private async buildPrompt(
    input: RecommendationAnalysisInput,
    sourceText: string,
  ): Promise<string> {
    const totals = this.calculateTotals(input);
    const userNotesContext = this.buildUserNotesContext(input);
    const userMealsContext = this.buildUserMealsContext(input);
    const nutritionGoalContext = await this.buildNutritionGoalContext(input);
    const semanticMemory = await this.buildSemanticMemory(input, sourceText);

    return `
    ${NUTRITION_RECOMMENDATION_SYSTEM_PROMPT}

    Datos del periodo actual:
    Periodo: ${input.period}
    Dias analizados: ${input.totalDays}
    Comidas registradas: ${input.meals.length}
    Notas disponibles: ${input.notes.length}
    Calorias totales: ${totals.calories}
    Proteinas totales: ${totals.proteins}g
    Carbohidratos totales: ${totals.carbs}g
    Grasas totales: ${totals.fats}g

    Objetivo y metas del usuario:
    ${nutritionGoalContext}

    Notas del usuario:
    ${userNotesContext}

    Comidas del usuario por dia:
    ${userMealsContext}

    Primer mes historico:
    ${semanticMemory.firstMonth.window}
    ${semanticMemory.firstMonth.context}

    Segundo mes historico:
    ${semanticMemory.secondMonth.window}
    ${semanticMemory.secondMonth.context}

    Contexto base:
    ${sourceText}
    `;
  }

  private async buildSemanticMemory(
    input: RecommendationAnalysisInput,
    sourceText: string,
  ): Promise<{
    firstMonth: {
      context: string;
      window: string;
    };
    secondMonth: {
      context: string;
      window: string;
    };
  }> {
    const searchText = this.buildEmbeddingSearchText(input, sourceText);
    const firstMonthRange = input.semanticMemoryComparisonWindow?.firstMonth;
    const secondMonthRange = input.semanticMemoryComparisonWindow?.secondMonth;
    const [firstMonthContent, secondMonthContent] = await Promise.all([
      firstMonthRange
        ? this.foodTextEmbeddingService.findSimilarContent(
            input.userId,
            searchText,
            {
              limit: 4,
              dateRange: firstMonthRange,
              excludeSources: input.embeddingExclusions,
            },
          )
        : Promise.resolve([]),
      secondMonthRange
        ? this.foodTextEmbeddingService.findSimilarContent(
            input.userId,
            searchText,
            {
              limit: 4,
              dateRange: secondMonthRange,
              excludeSources: input.embeddingExclusions,
            },
          )
        : Promise.resolve([]),
    ]);

    return {
      firstMonth: {
        window: firstMonthRange
          ? `${firstMonthRange.startDate} a ${firstMonthRange.endDate}`
          : 'Sin ventana temporal especifica.',
        context: this.buildSemanticMemoryContext(
          firstMonthContent,
          'No hay recuerdos alimenticios similares guardados para el primer mes historico.',
        ),
      },
      secondMonth: {
        window: secondMonthRange
          ? `${secondMonthRange.startDate} a ${secondMonthRange.endDate}`
          : 'Sin ventana temporal especifica.',
        context: this.buildSemanticMemoryContext(
          secondMonthContent,
          'No hay recuerdos alimenticios similares guardados para el segundo mes historico.',
        ),
      },
    };
  }

  private async buildNutritionGoalContext(
    input: RecommendationAnalysisInput,
  ): Promise<string> {
    const nutritionPlan = await this.nutritionPlanRepository.findOne({
      where: { userId: input.userId },
    });

    if (!nutritionPlan) {
      return 'No hay plan nutricional registrado. Orienta las recomendaciones a mejorar habitos, balance, saciedad y variedad sin asumir un objetivo especifico.';
    }

    return [
      `Objetivo principal: ${this.translateGoal(nutritionPlan.goal)}`,
      `Calorias diarias objetivo: ${nutritionPlan.dailyCalorieGoal}`,
      `Calorias de mantenimiento estimadas: ${nutritionPlan.maintenanceCalories}`,
      `Proteina objetivo: ${nutritionPlan.proteinGoal}g`,
      `Carbohidratos objetivo: ${nutritionPlan.carbsGoal}g`,
      `Grasas objetivo: ${nutritionPlan.fatsGoal}g`,
      this.buildGoalGuidance(nutritionPlan.goal),
    ].join('\n');
  }

  private translateGoal(goal: UserGoal): string {
    const goalLabels: Record<UserGoal, string> = {
      [UserGoal.LOSE_FAT]: 'perdida de grasa',
      [UserGoal.GAIN_MUSCLE]: 'ganancia muscular',
      [UserGoal.BODY_RECOMPOSITION]: 'recomposicion corporal',
      [UserGoal.MAINTAIN_WEIGHT]: 'mantenimiento de peso',
      [UserGoal.IMPROVE_HABITS]: 'mejorar habitos alimenticios',
    };

    return goalLabels[goal] ?? goal;
  }

  private buildGoalGuidance(goal: UserGoal): string {
    const guidanceByGoal: Record<UserGoal, string> = {
      [UserGoal.LOSE_FAT]:
        'Enfoca las recomendaciones en saciedad, deficit sostenible, proteina suficiente, fibra, verduras, control de porciones y menor densidad calorica sin prohibiciones extremas.',
      [UserGoal.GAIN_MUSCLE]:
        'Enfoca las recomendaciones en suficiente energia, proteina distribuida durante el dia, carbohidratos utiles alrededor de comidas principales y snacks proteicos.',
      [UserGoal.BODY_RECOMPOSITION]:
        'Enfoca las recomendaciones en proteina alta, fuerza de habitos, porciones moderadas, carbohidratos de calidad y consistencia sin bajar demasiado la energia.',
      [UserGoal.MAINTAIN_WEIGHT]:
        'Enfoca las recomendaciones en estabilidad, variedad, balance de plato, horarios sostenibles y evitar excesos repetidos.',
      [UserGoal.IMPROVE_HABITS]:
        'Enfoca las recomendaciones en cambios pequenos y sostenibles: mas variedad, fibra, hidratacion, snacks utiles y mejor distribucion de comidas.',
    };

    return `Guia para recomendar segun objetivo: ${guidanceByGoal[goal]}`;
  }

  private buildUserNotesContext(input: RecommendationAnalysisInput): string {
    if (!input.notes.length) {
      return 'No hay notas del usuario para este periodo.';
    }

    return input.notes.map((note) => `- ${note.date}: ${note.note}`).join('\n');
  }

  private buildUserMealsContext(input: RecommendationAnalysisInput): string {
    if (!input.meals.length) {
      return 'No hay comidas registradas para este periodo.';
    }

    const mealsByDate = input.meals.reduce<Map<string, string[]>>(
      (groupedMeals, meal) => {
        const dateMeals = groupedMeals.get(meal.date) ?? [];

        dateMeals.push(
          `${meal.time} - ${meal.type}: ${meal.name} (${meal.calories} kcal, proteina ${meal.proteins ?? 0}g, carbohidratos ${meal.carbs ?? 0}g, grasas ${meal.fats ?? 0}g)`,
        );
        groupedMeals.set(meal.date, dateMeals);

        return groupedMeals;
      },
      new Map<string, string[]>(),
    );

    return Array.from(mealsByDate.entries())
      .map(([date, meals]) =>
        [`- ${date}:`, ...meals.map((meal) => `  * ${meal}`)].join('\n'),
      )
      .join('\n');
  }

  private buildSemanticMemoryContext(
    similarContent: SimilarEmbeddingResult[],
    emptyMessage: string,
  ): string {
    if (!similarContent.length) {
      return emptyMessage;
    }

    return similarContent
      .map(
        (item) =>
          `- ${item.sourceType} #${item.sourceId} (similitud ${item.similarity.toFixed(
            3,
          )}): ${this.truncateText(item.content, 1200)}`,
      )
      .join('\n');
  }

  private buildEmbeddingSearchText(
    input: RecommendationAnalysisInput,
    sourceText: string,
  ): string {
    return [
      `Periodo: ${input.period}`,
      `Notas: ${this.buildUserNotesContext(input)}`,
      `Comidas: ${this.buildUserMealsContext(input)}`,
      `Contexto: ${sourceText}`,
    ].join('\n');
  }

  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }

    return `${text.slice(0, maxLength).trim()}...`;
  }

  private calculateTotals(input: RecommendationAnalysisInput): MacroTotals {
    return input.meals.reduce(
      (totals, meal) => ({
        calories: totals.calories + Number(meal.calories ?? 0),
        proteins: totals.proteins + Number(meal.proteins ?? 0),
        carbs: totals.carbs + Number(meal.carbs ?? 0),
        fats: totals.fats + Number(meal.fats ?? 0),
      }),
      {
        calories: 0,
        proteins: 0,
        carbs: 0,
        fats: 0,
      },
    );
  }
}
