import { Injectable, Logger } from '@nestjs/common';
import { GeminiService } from '../gemini/gemini.service';
import { NutritionRecommendationAgent } from './agents/nutrition-recommendation.agent';
import {
  Recommendation,
  RecommendationAnalysisInput,
  RecommendationComparison,
  RecommendationComparisonItem,
  RecommendationsResponse,
} from './recommendation.types';

interface AiRecommendationsResponse {
  comparison?: RecommendationComparison;
  recommendations?: Recommendation[];
  summary?: string;
}

interface MacroTotals {
  calories: number;
  carbs: number;
  fats: number;
  proteins: number;
}

@Injectable()
export class RecommendationAiService {
  private readonly logger = new Logger(RecommendationAiService.name);

  constructor(
    private readonly nutritionRecommendationAgent: NutritionRecommendationAgent,
    private readonly geminiService: GeminiService,
  ) {}

  async buildFromText(
    input: RecommendationAnalysisInput,
    sourceText: string,
  ): Promise<RecommendationsResponse | null> {
    const context = sourceText.trim();

    if (!context) {
      return null;
    }

    if (!this.geminiService.hasApiKey()) {
      this.logger.warn(
        'GEMINI_API_KEY no esta configurada; usando recomendaciones por reglas',
      );
      return null;
    }

    try {
      const geminiRequest =
        await this.nutritionRecommendationAgent.buildGeminiRequest(
          input,
          context,
        );
      const text = await this.geminiService.generateContent(geminiRequest, {
        errorMessage: 'Gemini no pudo generar recomendaciones nutricionales',
        unexpectedTextMessage:
          'Gemini no devolvio texto para recomendaciones',
      });

      return this.parseRecommendations(input, text);
    } catch (error) {
      this.logger.warn(
        error instanceof Error
          ? error.message
          : 'No se pudieron generar recomendaciones con IA',
      );
      return null;
    }
  }

  private parseRecommendations(
    input: RecommendationAnalysisInput,
    text: string,
  ): RecommendationsResponse | null {
    const parsed = JSON.parse(
      this.cleanJsonText(text),
    ) as AiRecommendationsResponse;
    const recommendations = this.normalizeRecommendations(
      parsed.recommendations,
    );
    const comparison = this.normalizeComparison(parsed.comparison, input);

    if (!recommendations.length) {
      return null;
    }

    return {
      period: input.period,
      comparison,
      summary:
        this.normalizeSummary(parsed.summary) ??
        this.buildQualitativeFallbackSummary(input),
      recommendations,
    };
  }

  private normalizeRecommendations(
    recommendations: Recommendation[] | undefined,
  ): Recommendation[] {
    if (!Array.isArray(recommendations)) {
      return [];
    }

    return recommendations
      .map((recommendation) => ({
        category:
          typeof recommendation.category === 'string'
            ? recommendation.category.trim()
            : undefined,
        title:
          typeof recommendation.title === 'string'
            ? recommendation.title.trim()
            : '',
        description:
          typeof recommendation.description === 'string'
            ? recommendation.description.trim()
            : '',
      }))
      .filter(
        (recommendation) =>
          recommendation.title.length > 0 &&
          recommendation.description.length > 0,
      )
      .slice(0, 5);
  }

  private normalizeSummary(summary: unknown): string | undefined {
    return typeof summary === 'string' && summary.trim()
      ? summary.trim()
      : undefined;
  }

  private normalizeComparison(
    comparison: RecommendationComparison | undefined,
    input: RecommendationAnalysisInput,
  ): RecommendationComparison {
    if (!comparison || typeof comparison !== 'object') {
      return this.buildUnavailableComparison(input);
    }

    return {
      available: comparison.available === true,
      summary:
        this.normalizeSummary(comparison.summary) ??
        this.buildUnavailableComparison(input).summary,
      improvements: this.normalizeComparisonItems(comparison.improvements, 3),
      needsAttention: this.normalizeComparisonItems(
        comparison.needsAttention,
        3,
      ),
      stablePatterns: this.normalizeComparisonItems(
        comparison.stablePatterns,
        2,
      ),
    };
  }

  private normalizeComparisonItems(
    items: RecommendationComparisonItem[] | undefined,
    limit: number,
  ): RecommendationComparisonItem[] {
    if (!Array.isArray(items)) {
      return [];
    }

    return items
      .map((item) => ({
        category:
          typeof item.category === 'string' ? item.category.trim() : undefined,
        description:
          typeof item.description === 'string' ? item.description.trim() : '',
      }))
      .filter((item) => item.description.length > 0)
      .slice(0, limit);
  }

  private buildUnavailableComparison(
    input: RecommendationAnalysisInput,
  ): RecommendationComparison {
    return {
      available: false,
      summary: `No hay informacion suficiente en los dos meses historicos (${this.buildComparisonWindowContext(
        input,
      )}) para una comparacion confiable.`,
      improvements: [],
      needsAttention: [],
      stablePatterns: [],
    };
  }

  private cleanJsonText(text: string): string {
    return text
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
  }

  private buildQualitativeFallbackSummary(
    input: RecommendationAnalysisInput,
  ): string {
    const totals = this.calculateTotals(input);
    const notesText = input.notes.length
      ? `Tambien hay ${input.notes.length} notas que ayudan a entender el contexto del periodo.`
      : 'No hay notas suficientes para complementar el analisis cualitativo.';

    if (!input.meals.length) {
      return `No encontramos comidas registradas en este periodo. ${notesText}`;
    }

    return `El periodo muestra ${input.meals.length} comidas registradas, con una carga aproximada de ${totals.calories} calorias y un balance de ${totals.proteins}g de proteina, ${totals.carbs}g de carbohidratos y ${totals.fats}g de grasas. ${notesText}`;
  }

  private buildComparisonWindowContext(
    input: RecommendationAnalysisInput,
  ): string {
    const comparisonWindow = input.semanticMemoryComparisonWindow;

    if (!comparisonWindow) {
      return 'sin ventanas temporales especificas';
    }

    return `primer mes ${comparisonWindow.firstMonth.startDate} a ${comparisonWindow.firstMonth.endDate}; segundo mes ${comparisonWindow.secondMonth.startDate} a ${comparisonWindow.secondMonth.endDate}`;
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
