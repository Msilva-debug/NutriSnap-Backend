import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import { DailyFoodNote } from '../meal/entities/daily-food-note.entity';
import { Meal } from '../meal/entities/meal.entity';
import {
  FoodTextEmbedding,
  FoodTextEmbeddingSourceType,
} from './entities/food-text-embedding.entity';

interface EmbedContentResponse {
  embedding?: {
    values?: number[];
  };
  embeddings?: Array<{
    values?: number[];
  }>;
}

interface GeminiErrorResponse {
  error?: {
    message?: string;
  };
}

interface UpsertEmbeddingParams {
  content: string;
  sourceId: number;
  sourceType: FoodTextEmbeddingSourceType;
  userId: number;
}

interface MacroTotals {
  calories: number;
  carbs: number;
  fats: number;
  proteins: number;
}

export interface SimilarEmbeddingResult {
  content: string;
  similarity: number;
  sourceId: number;
  sourceType: FoodTextEmbeddingSourceType;
}

interface FindSimilarContentOptions {
  dateRange?: {
    endDate: string;
    startDate: string;
  };
  excludeSources?: Array<{
    sourceId: number;
    sourceType: FoodTextEmbeddingSourceType;
  }>;
  limit?: number;
}

export interface BackfillEmbeddingsResult {
  dailyNotes: number;
}

export interface SyncDailyNoteEmbeddingsResult {
  created: number;
  date: string;
  failed: number;
  skipped: number;
}

@Injectable()
export class FoodTextEmbeddingService {
  private readonly logger = new Logger(FoodTextEmbeddingService.name);
  private readonly defaultModel = 'gemini-embedding-2';
  private readonly defaultTimeZone = 'America/Bogota';

  constructor(
    @InjectRepository(FoodTextEmbedding)
    private readonly foodTextEmbeddingRepository: Repository<FoodTextEmbedding>,
    @InjectRepository(DailyFoodNote)
    private readonly dailyFoodNoteRepository: Repository<DailyFoodNote>,
    @InjectRepository(Meal)
    private readonly mealRepository: Repository<Meal>,
  ) {}

  async upsertSourceEmbedding(
    params: UpsertEmbeddingParams,
  ): Promise<FoodTextEmbedding | null> {
    const content = params.content.trim();

    if (!content) {
      return null;
    }

    try {
      const embedding = await this.generateEmbedding(
        this.formatDocumentForEmbedding(content),
      );

      if (!embedding.length) {
        return null;
      }

      const existingEmbedding = await this.foodTextEmbeddingRepository.findOne({
        where: {
          userId: params.userId,
          sourceType: params.sourceType,
          sourceId: params.sourceId,
        },
      });

      const foodTextEmbedding = existingEmbedding
        ? this.foodTextEmbeddingRepository.merge(existingEmbedding, {
            content,
            embedding,
            model: this.getModel(),
            dimensions: embedding.length,
          })
        : this.foodTextEmbeddingRepository.create({
            userId: params.userId,
            sourceType: params.sourceType,
            sourceId: params.sourceId,
            content,
            embedding,
            model: this.getModel(),
            dimensions: embedding.length,
          });

      return this.foodTextEmbeddingRepository.save(foodTextEmbedding);
    } catch (error) {
      this.logger.warn(
        error instanceof Error
          ? error.message
          : 'No se pudo guardar el embedding de texto',
      );
      return null;
    }
  }

  async upsertDailyNoteEmbedding(
    dailyFoodNote: DailyFoodNote,
  ): Promise<FoodTextEmbedding | null> {
    const content = await this.buildDailyNoteContent(dailyFoodNote);

    return this.upsertSourceEmbedding({
      userId: dailyFoodNote.userId,
      sourceType: FoodTextEmbeddingSourceType.DAILY_NOTE,
      sourceId: dailyFoodNote.id,
      content,
    });
  }

  async findSimilarContent(
    userId: number,
    queryText: string,
    options: FindSimilarContentOptions = {},
  ): Promise<SimilarEmbeddingResult[]> {
    const content = queryText.trim();
    const limit = options.limit ?? 4;

    if (!content) {
      return [];
    }

    try {
      const queryEmbedding = await this.generateEmbedding(
        this.formatSearchQueryForEmbedding(content),
      );

      if (!queryEmbedding.length) {
        return [];
      }

      const storedEmbeddings = await this.findStoredEmbeddings(
        userId,
        options,
      );

      return storedEmbeddings
        .filter(
          (storedEmbedding) =>
            !this.shouldExcludeEmbedding(storedEmbedding, options),
        )
        .map((storedEmbedding) => ({
          content: storedEmbedding.content,
          sourceType: storedEmbedding.sourceType,
          sourceId: storedEmbedding.sourceId,
          similarity: this.cosineSimilarity(
            queryEmbedding,
            storedEmbedding.embedding,
          ),
        }))
        .filter((result) => Number.isFinite(result.similarity))
        .sort((left, right) => right.similarity - left.similarity)
        .slice(0, limit);
    } catch (error) {
      this.logger.warn(
        error instanceof Error
          ? error.message
          : 'No se pudo buscar contenido similar por embeddings',
      );
      return [];
    }
  }

  async backfillUserEmbeddings(
    userId: number,
  ): Promise<BackfillEmbeddingsResult> {
    const dailyNotes = await this.dailyFoodNoteRepository.find({
      where: { userId },
      order: { date: 'ASC' },
    });

    let dailyNotesCount = 0;

    for (const dailyNote of dailyNotes) {
      const savedEmbedding = await this.upsertDailyNoteEmbedding(dailyNote);

      if (savedEmbedding) {
        dailyNotesCount += 1;
      }
    }

    return {
      dailyNotes: dailyNotesCount,
    };
  }

  private async findStoredEmbeddings(
    userId: number,
    options: FindSimilarContentOptions,
  ): Promise<FoodTextEmbedding[]> {
    if (!options.dateRange) {
      return this.foodTextEmbeddingRepository.find({
        where: { userId },
      });
    }

    const dailyNotes = await this.dailyFoodNoteRepository.find({
      where: {
        userId,
        date: Between(options.dateRange.startDate, options.dateRange.endDate),
      },
    });
    const sourceIds = dailyNotes.map((dailyNote) => dailyNote.id);

    if (!sourceIds.length) {
      return [];
    }

    return this.foodTextEmbeddingRepository.find({
      where: {
        userId,
        sourceType: FoodTextEmbeddingSourceType.DAILY_NOTE,
        sourceId: In(sourceIds),
      },
    });
  }

  async syncCurrentDateDailyNoteEmbeddings(
    date = this.formatDateInTimeZone(new Date()),
  ): Promise<SyncDailyNoteEmbeddingsResult> {
    const dailyNotes = await this.dailyFoodNoteRepository.find({
      where: { date },
      order: {
        userId: 'ASC',
        id: 'ASC',
      },
    });
    const result: SyncDailyNoteEmbeddingsResult = {
      date,
      created: 0,
      skipped: 0,
      failed: 0,
    };

    for (const dailyNote of dailyNotes) {
      const existingEmbedding = await this.foodTextEmbeddingRepository.findOne({
        where: {
          userId: dailyNote.userId,
          sourceType: FoodTextEmbeddingSourceType.DAILY_NOTE,
          sourceId: dailyNote.id,
        },
      });

      if (existingEmbedding) {
        result.skipped += 1;
        continue;
      }

      const savedEmbedding = await this.upsertDailyNoteEmbedding(dailyNote);

      if (savedEmbedding) {
        result.created += 1;
      } else {
        result.failed += 1;
      }
    }

    return result;
  }

  private async generateEmbedding(content: string): Promise<number[]> {
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
      this.logger.warn(
        'GEMINI_API_KEY no esta configurada; no se generaran embeddings',
      );
      return [];
    }

    const model = this.getModel();
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:embedContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          model: `models/${model}`,
          content: {
            parts: [{ text: content }],
          },
        }),
      },
    );

    if (!response.ok) {
      throw new Error(await this.getGeminiErrorMessage(response));
    }

    const data = (await response.json()) as EmbedContentResponse;
    const values = data.embedding?.values ?? data.embeddings?.[0]?.values ?? [];

    return values.map(Number).filter(Number.isFinite);
  }

  private async getGeminiErrorMessage(response: Response): Promise<string> {
    try {
      const error = (await response.json()) as GeminiErrorResponse;

      return error.error?.message ?? 'Gemini no pudo generar embeddings';
    } catch {
      return 'Gemini no pudo generar embeddings';
    }
  }

  private formatDocumentForEmbedding(content: string): string {
    return `title: NutriSnap food memory | text: ${content}`;
  }

  private formatSearchQueryForEmbedding(content: string): string {
    return `task: search result | query: ${content}`;
  }

  private getModel(): string {
    return process.env.GEMINI_EMBEDDING_MODEL?.trim() ?? this.defaultModel;
  }

  private async buildDailyNoteContent(
    dailyFoodNote: DailyFoodNote,
  ): Promise<string> {
    const meals = await this.mealRepository.find({
      where: {
        userId: dailyFoodNote.userId,
        date: dailyFoodNote.date,
      },
      order: {
        time: 'ASC',
      },
    });
    const totals = this.calculateTotals(meals);

    return [
      `Fecha: ${dailyFoodNote.date}`,
      'Tipo: memoria diaria de alimentacion',
      `Nota del usuario: ${dailyFoodNote.note}`,
      '',
      'Comidas registradas:',
      this.buildMealsContent(meals),
      '',
      'Totales del dia:',
      `Calorias: ${totals.calories}`,
      `Proteinas: ${totals.proteins}g`,
      `Carbohidratos: ${totals.carbs}g`,
      `Grasas: ${totals.fats}g`,
      '',
      'Resumen automatico del patron:',
      this.buildDailyPatternSummary(meals, totals),
    ].join('\n');
  }

  private buildMealsContent(meals: Meal[]): string {
    if (!meals.length) {
      return 'No hay comidas registradas para este dia.';
    }

    return meals
      .map(
        (meal) =>
          `- ${meal.time} - ${meal.type}: ${meal.name} (${meal.calories} kcal, proteina ${meal.proteins ?? 0}g, carbohidratos ${meal.carbs ?? 0}g, grasas ${meal.fats ?? 0}g)`,
      )
      .join('\n');
  }

  private buildDailyPatternSummary(
    meals: Meal[],
    totals: MacroTotals,
  ): string {
    if (!meals.length) {
      return 'Solo hay nota del usuario, sin comidas registradas para contrastar.';
    }

    const mealTypes = new Set(meals.map((meal) => meal.type));
    const mealNames = meals.map((meal) => meal.name.toLowerCase()).join(' ');
    const macroCalories =
      totals.proteins * 4 + totals.carbs * 4 + totals.fats * 9;
    const notes: string[] = [
      `${meals.length} comidas registradas en ${mealTypes.size} tipos de comida.`,
    ];

    if (macroCalories > 0) {
      const proteinShare = (totals.proteins * 4) / macroCalories;
      const carbsShare = (totals.carbs * 4) / macroCalories;
      const fatsShare = (totals.fats * 9) / macroCalories;

      if (proteinShare < 0.2) {
        notes.push('Proteina baja frente al resto de macronutrientes.');
      } else if (proteinShare >= 0.25) {
        notes.push('Buena presencia relativa de proteina.');
      }

      if (carbsShare > 0.55) {
        notes.push('Carbohidratos altos frente al resto del dia.');
      }

      if (fatsShare > 0.35) {
        notes.push('Grasas altas frente al resto del dia.');
      }
    }

    if (/(arroz|pasta|pan|arepa|harina)/i.test(mealNames)) {
      notes.push('Hay presencia de arroz, harinas o carbohidratos base.');
    }

    if (!/(ensalada|verdura|verduras|zanahoria|pepino|brocoli|legumbre|lenteja|frijol|garbanzo|fruta)/i.test(mealNames)) {
      notes.push('No se observan muchas verduras, frutas o fuentes claras de fibra en los nombres de comidas.');
    }

    if (mealTypes.size <= 1 && meals.length > 1) {
      notes.push('La energia parece concentrarse en pocos momentos del dia.');
    }

    return notes.join(' ');
  }

  private calculateTotals(meals: Meal[]): MacroTotals {
    return meals.reduce(
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

  private formatDateInTimeZone(date: Date): string {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: this.defaultTimeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);
    const year = parts.find((part) => part.type === 'year')?.value;
    const month = parts.find((part) => part.type === 'month')?.value;
    const day = parts.find((part) => part.type === 'day')?.value;

    return `${year}-${month}-${day}`;
  }

  private shouldExcludeEmbedding(
    foodTextEmbedding: FoodTextEmbedding,
    options: FindSimilarContentOptions,
  ): boolean {
    return (
      options.excludeSources?.some(
        (source) =>
          source.sourceType === foodTextEmbedding.sourceType &&
          source.sourceId === foodTextEmbedding.sourceId,
      ) ?? false
    );
  }

  private cosineSimilarity(left: number[], right: number[]): number {
    const length = Math.min(left.length, right.length);

    if (!length) {
      return 0;
    }

    let dotProduct = 0;
    let leftMagnitude = 0;
    let rightMagnitude = 0;

    for (let index = 0; index < length; index += 1) {
      dotProduct += left[index] * right[index];
      leftMagnitude += left[index] ** 2;
      rightMagnitude += right[index] ** 2;
    }

    if (!leftMagnitude || !rightMagnitude) {
      return 0;
    }

    return dotProduct / (Math.sqrt(leftMagnitude) * Math.sqrt(rightMagnitude));
  }
}
