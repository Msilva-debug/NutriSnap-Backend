import { Logger } from '@nestjs/common';
import { Between, In } from 'typeorm';
import { DailyFoodNote } from '../meal/entities/daily-food-note.entity';
import { Meal, MealType } from '../meal/entities/meal.entity';
import {
  FoodTextEmbedding,
  FoodTextEmbeddingSourceType,
} from './entities/food-text-embedding.entity';
import { FoodTextEmbeddingService } from './food-text-embedding.service';

describe('FoodTextEmbeddingService', () => {
  const foodTextEmbeddingRepository = {
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    merge: jest.fn(),
    save: jest.fn(),
  };
  const dailyFoodNoteRepository = { find: jest.fn() };
  const mealRepository = { find: jest.fn() };
  const originalApiKey = process.env.GEMINI_API_KEY;
  const originalModel = process.env.GEMINI_EMBEDDING_MODEL;
  let service: FoodTextEmbeddingService;

  const sourceParams = {
    userId: 2,
    sourceType: FoodTextEmbeddingSourceType.DAILY_NOTE,
    sourceId: 8,
    content: ' Buena alimentacion ',
  };
  const storedEmbedding = (
    overrides: Partial<FoodTextEmbedding> = {},
  ): FoodTextEmbedding =>
    ({
      id: 1,
      userId: 2,
      sourceType: FoodTextEmbeddingSourceType.DAILY_NOTE,
      sourceId: 8,
      content: 'Contenido similar',
      embedding: [1, 0],
      model: 'gemini-embedding-2',
      dimensions: 2,
      ...overrides,
    }) as FoodTextEmbedding;
  const dailyNote = (overrides: Partial<DailyFoodNote> = {}): DailyFoodNote =>
    ({
      id: 8,
      userId: 2,
      date: '2026-09-11',
      note: 'Me senti con energia',
      ...overrides,
    }) as DailyFoodNote;
  const meal = (overrides: Partial<Meal> = {}): Meal =>
    ({
      id: 1,
      userId: 2,
      date: '2026-09-11',
      time: '12:00:00',
      type: MealType.LUNCH,
      name: 'Pollo con arroz',
      calories: 600,
      proteins: 40,
      carbs: 70,
      fats: 18,
      ...overrides,
    }) as Meal;

  const mockEmbeddingResponse = (values: unknown[]) =>
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ embedding: { values } }),
    } as unknown as Response);

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.clearAllMocks();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    process.env.GEMINI_API_KEY = 'embedding-key';
    delete process.env.GEMINI_EMBEDDING_MODEL;
    foodTextEmbeddingRepository.create.mockImplementation(
      (value: FoodTextEmbedding) => value,
    );
    foodTextEmbeddingRepository.merge.mockImplementation(
      (
        entity: FoodTextEmbedding,
        value: Partial<FoodTextEmbedding>,
      ): FoodTextEmbedding => ({
        ...entity,
        ...value,
      }),
    );
    foodTextEmbeddingRepository.save.mockImplementation(
      (value: FoodTextEmbedding) => Promise.resolve(value),
    );
    service = new FoodTextEmbeddingService(
      foodTextEmbeddingRepository as never,
      dailyFoodNoteRepository as never,
      mealRepository as never,
    );
  });

  afterAll(() => {
    if (originalApiKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalApiKey;

    if (originalModel === undefined) delete process.env.GEMINI_EMBEDDING_MODEL;
    else process.env.GEMINI_EMBEDDING_MODEL = originalModel;
  });

  it('ignores empty content without calling Gemini', async () => {
    const fetchMock = jest.spyOn(global, 'fetch');

    await expect(
      service.upsertSourceEmbedding({ ...sourceParams, content: '   ' }),
    ).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('creates a normalized embedding using the default model', async () => {
    const fetchMock = mockEmbeddingResponse([1, '2', 'invalid', 3]);
    foodTextEmbeddingRepository.findOne.mockResolvedValue(null);

    await expect(service.upsertSourceEmbedding(sourceParams)).resolves.toEqual(
      expect.objectContaining({
        userId: 2,
        sourceId: 8,
        content: 'Buena alimentacion',
        embedding: [1, 2, 3],
        model: 'gemini-embedding-2',
        dimensions: 3,
      }),
    );
    expect(foodTextEmbeddingRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ embedding: [1, 2, 3] }),
    );
    const [, fetchOptions] = fetchMock.mock.calls[0];
    const rawBody = fetchOptions?.body;

    expect(typeof rawBody).toBe('string');
    if (typeof rawBody !== 'string') {
      throw new Error('Expected a JSON request body');
    }

    expect(JSON.parse(rawBody)).toEqual({
      model: 'models/gemini-embedding-2',
      content: {
        parts: [
          { text: 'title: NutriSnap food memory | text: Buena alimentacion' },
        ],
      },
    });
  });

  it('merges an existing embedding and honors a custom model', async () => {
    process.env.GEMINI_EMBEDDING_MODEL = 'custom-embedding';
    mockEmbeddingResponse([0.5, 0.25]);
    const existing = storedEmbedding();
    foodTextEmbeddingRepository.findOne.mockResolvedValue(existing);

    await service.upsertSourceEmbedding(sourceParams);

    expect(foodTextEmbeddingRepository.merge).toHaveBeenCalledWith(existing, {
      content: 'Buena alimentacion',
      embedding: [0.5, 0.25],
      model: 'custom-embedding',
      dimensions: 2,
    });
    expect(foodTextEmbeddingRepository.create).not.toHaveBeenCalled();
  });

  it('returns null when Gemini is unavailable or rejects the request', async () => {
    delete process.env.GEMINI_API_KEY;
    await expect(
      service.upsertSourceEmbedding(sourceParams),
    ).resolves.toBeNull();

    process.env.GEMINI_API_KEY = 'embedding-key';
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      json: jest.fn().mockResolvedValue({ error: { message: 'Sin cuota' } }),
    } as unknown as Response);
    await expect(
      service.upsertSourceEmbedding(sourceParams),
    ).resolves.toBeNull();
    expect(foodTextEmbeddingRepository.save).not.toHaveBeenCalled();
  });

  it('sorts similar content, excludes current sources and applies the limit', async () => {
    mockEmbeddingResponse([1, 0]);
    foodTextEmbeddingRepository.find.mockResolvedValue([
      storedEmbedding({ sourceId: 1, embedding: [0.5, 0.5], content: 'medio' }),
      storedEmbedding({ sourceId: 2, embedding: [1, 0], content: 'exacto' }),
      storedEmbedding({ sourceId: 3, embedding: [0, 1], content: 'distante' }),
    ]);

    const results = await service.findSimilarContent(2, ' patron actual ', {
      limit: 2,
      excludeSources: [
        {
          sourceType: FoodTextEmbeddingSourceType.DAILY_NOTE,
          sourceId: 2,
        },
      ],
    });

    expect(results.map(({ sourceId }) => sourceId)).toEqual([1, 3]);
    expect(results[0].similarity).toBeCloseTo(Math.SQRT1_2);
    expect(results[1].similarity).toBe(0);
    expect(foodTextEmbeddingRepository.find).toHaveBeenCalledWith({
      where: { userId: 2 },
    });
  });

  it('returns no similarities for blank queries or empty date ranges', async () => {
    await expect(service.findSimilarContent(2, ' ')).resolves.toEqual([]);

    mockEmbeddingResponse([1, 0]);
    dailyFoodNoteRepository.find.mockResolvedValue([]);
    await expect(
      service.findSimilarContent(2, 'consulta', {
        dateRange: { startDate: '2026-08-01', endDate: '2026-08-31' },
      }),
    ).resolves.toEqual([]);
    expect(dailyFoodNoteRepository.find).toHaveBeenCalledWith({
      where: {
        userId: 2,
        date: Between('2026-08-01', '2026-08-31'),
      },
    });
  });

  it('limits stored embeddings to notes inside a requested date range', async () => {
    mockEmbeddingResponse([1, 0]);
    dailyFoodNoteRepository.find.mockResolvedValue([
      dailyNote({ id: 4 }),
      dailyNote({ id: 5 }),
    ]);
    foodTextEmbeddingRepository.find.mockResolvedValue([]);

    await service.findSimilarContent(2, 'consulta', {
      dateRange: { startDate: '2026-08-01', endDate: '2026-08-31' },
    });

    expect(foodTextEmbeddingRepository.find).toHaveBeenCalledWith({
      where: {
        userId: 2,
        sourceType: FoodTextEmbeddingSourceType.DAILY_NOTE,
        sourceId: In([4, 5]),
      },
    });
  });

  it('builds daily note content with meals, totals and pattern summary', async () => {
    const fetchMock = mockEmbeddingResponse([1, 2]);
    mealRepository.find.mockResolvedValue([
      meal(),
      meal({
        id: 2,
        type: MealType.DINNER,
        name: 'Pasta con queso',
        calories: 500,
        proteins: 10,
        carbs: 80,
        fats: 15,
      }),
    ]);
    foodTextEmbeddingRepository.findOne.mockResolvedValue(null);

    await service.upsertDailyNoteEmbedding(dailyNote());

    expect(mealRepository.find).toHaveBeenCalledWith({
      where: { userId: 2, date: '2026-09-11' },
      order: { time: 'ASC' },
    });
    const [, fetchOptions] = fetchMock.mock.calls[0];
    const rawBody = fetchOptions?.body;

    expect(typeof rawBody).toBe('string');
    if (typeof rawBody !== 'string') {
      throw new Error('Expected a JSON request body');
    }

    const body = JSON.parse(rawBody) as {
      content: { parts: Array<{ text: string }> };
    };
    expect(body.content.parts[0].text).toContain('Calorias: 1100');
    expect(body.content.parts[0].text).toContain('Proteinas: 50g');
    expect(body.content.parts[0].text).toContain(
      'Hay presencia de arroz, harinas o carbohidratos base.',
    );
  });

  it('backfills all notes and counts only saved embeddings', async () => {
    const notes = [dailyNote({ id: 1 }), dailyNote({ id: 2 })];
    dailyFoodNoteRepository.find.mockResolvedValue(notes);
    jest
      .spyOn(service, 'upsertDailyNoteEmbedding')
      .mockResolvedValueOnce(storedEmbedding())
      .mockResolvedValueOnce(null);

    await expect(service.backfillUserEmbeddings(2)).resolves.toEqual({
      dailyNotes: 1,
    });
    expect(dailyFoodNoteRepository.find).toHaveBeenCalledWith({
      where: { userId: 2 },
      order: { date: 'ASC' },
    });
  });

  it('tracks skipped, created and failed notes during daily sync', async () => {
    const notes = [
      dailyNote({ id: 1 }),
      dailyNote({ id: 2 }),
      dailyNote({ id: 3 }),
    ];
    dailyFoodNoteRepository.find.mockResolvedValue(notes);
    foodTextEmbeddingRepository.findOne
      .mockResolvedValueOnce(storedEmbedding())
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null);
    jest
      .spyOn(service, 'upsertDailyNoteEmbedding')
      .mockResolvedValueOnce(storedEmbedding())
      .mockResolvedValueOnce(null);

    await expect(
      service.syncCurrentDateDailyNoteEmbeddings('2026-09-11'),
    ).resolves.toEqual({
      date: '2026-09-11',
      skipped: 1,
      created: 1,
      failed: 1,
    });
  });
});
