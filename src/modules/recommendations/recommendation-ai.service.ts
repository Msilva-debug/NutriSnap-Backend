import { Injectable, Logger } from '@nestjs/common';
import {
  Recommendation,
  RecommendationAnalysisInput,
  RecommendationsResponse,
} from './recommendation.types';

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

interface GeminiErrorResponse {
  error?: {
    message?: string;
  };
}

interface AiRecommendationsResponse {
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
  private readonly geminiApiUrl =
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

  async buildFromText(
    input: RecommendationAnalysisInput,
    sourceText: string,
  ): Promise<RecommendationsResponse | null> {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    const context = sourceText.trim();

    if (!context) {
      return null;
    }

    if (!apiKey) {
      this.logger.warn(
        'GEMINI_API_KEY no esta configurada; usando recomendaciones por reglas',
      );
      return null;
    }

    try {
      const response = await fetch(`${this.geminiApiUrl}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.buildGeminiRequest(input, context)),
      });

      if (!response.ok) {
        this.logger.warn(await this.getGeminiErrorMessage(response));
        return null;
      }

      const data = (await response.json()) as GeminiResponse;
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        this.logger.warn('Gemini no devolvio texto para recomendaciones');
        return null;
      }

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

  private buildGeminiRequest(
    input: RecommendationAnalysisInput,
    sourceText: string,
  ): Record<string, unknown> {
    const totals = this.calculateTotals(input);
    const userNotesContext = this.buildUserNotesContext(input);
    const userMealsContext = this.buildUserMealsContext(input);

    return {
      contents: [
        {
          parts: [
            {
              text: `
              Actua como un asistente nutricional para NutriSnap.

              Genera recomendaciones utiles, claras y accionables sobre la vida alimenticia de una persona a partir de sus registros de alimentacion.
              No des diagnosticos medicos. No inventes datos que no esten en el contexto.
              El campo "summary" debe ser un resumen cualitativo nuevo del periodo, no copies literalmente las notas ni el resumen base.

              Devuelve un JSON valido con este formato exacto:
              {
                "summary": "Resumen cualitativo corto del periodo analizado",
                "recommendations": [
                  {
                    "category": "Categoria corta",
                    "title": "Titulo corto",
                    "description": "Recomendacion clara y concreta"
                  }
                ]
              }

              Reglas:
              - Genera entre 3 y 5 recomendaciones.
              - Usa lenguaje simple, cercano y motivador.
              - Usa las "Notas del usuario" como contexto prioritario para entender habitos, sensaciones, dificultades, repeticion de comidas y posibles mejoras.
              - Usa las "Comidas del usuario por dia" para detectar platos repetidos, horarios, concentracion de calorias, falta de proteina, exceso de carbohidratos o poca variedad.
              - No recomiendes "registrar mas comidas", "usar la app" ni acciones administrativas. Recomienda cambios alimenticios reales.
              - Prioriza calidad de alimentos, balance de plato, saciedad, proteinas, fibra, hidratacion, snacks, variedad, porciones y distribucion de comidas.
              - Si detectas un problema, explica que cambiar y por que, con una alternativa concreta.
              - Da sugerencias realistas para una persona comun: opciones faciles de comprar, cocinar o preparar.
              - Recomienda snacks cuando ayuden al patron observado, por ejemplo yogur griego con fruta, huevos cocidos, queso campesino, frutos secos medidos, fruta con mantequilla de mani, hummus con verduras, atun con galletas integrales o batido con proteina.
              - Si hay exceso de arroz, harinas o carbohidratos y poca proteina, sugiere reducir una parte del carbohidrato y agregar proteina como pollo, huevos, atun, carne magra, yogur griego, lentejas, frijoles, garbanzos o tofu.
              - Si la dieta se ve repetitiva, sugiere variantes concretas del mismo plato: cambiar arroz blanco por papa, yuca moderada, quinoa, arroz integral o mas verduras; alternar sancocho con ensalada con proteina, bowl balanceado o sopa con legumbres.
              - Si faltan verduras o fibra, recomienda agregar ensalada, verduras salteadas, aguacate medido, frutas enteras, legumbres o semillas.
              - Si las grasas son altas, sugiere ajustes concretos como moderar aceites, fritos, salsas o porciones de aguacate, sin eliminar alimentos completos.
              - Si las calorias se concentran en una comida, sugiere repartir la energia con desayuno, cena ligera o snacks proteicos.
              - Cada description debe ser corta, util, accionable y mencionar una comida, snack o cambio especifico cuando aplique.
              - Responde solo JSON, sin markdown.

              Periodo: ${input.period}
              Dias analizados: ${input.totalDays}
              Comidas registradas: ${input.meals.length}
              Notas disponibles: ${input.notes.length}
              Calorias totales: ${totals.calories}
              Proteinas totales: ${totals.proteins}g
              Carbohidratos totales: ${totals.carbs}g
              Grasas totales: ${totals.fats}g

              Notas del usuario:
              ${userNotesContext}

              Comidas del usuario por dia:
              ${userMealsContext}

              Contexto base:
              ${sourceText}
            `,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    };
  }

  private async getGeminiErrorMessage(response: Response): Promise<string> {
    try {
      const error = (await response.json()) as GeminiErrorResponse;

      return (
        error.error?.message ??
        'Gemini no pudo generar recomendaciones nutricionales'
      );
    } catch {
      return 'Gemini no pudo generar recomendaciones nutricionales';
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

    if (!recommendations.length) {
      return null;
    }

    return {
      period: input.period,
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
