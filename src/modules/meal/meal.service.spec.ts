import { FoodTextEmbeddingService } from '../food-embedding/food-text-embedding.service';
import { MealGateway } from './meal.gateway';
import { MealService } from './meal.service';
import { DailyFoodNote } from './entities/daily-food-note.entity';
import { Meal, MealType } from './entities/meal.entity';

describe('MealService', () => {
  const mealRepository = {
    create: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    merge: jest.fn(),
    remove: jest.fn(),
    save: jest.fn(),
  };
  const dailyFoodNoteRepository = {
    create: jest.fn(),
    findOne: jest.fn(),
    merge: jest.fn(),
    save: jest.fn(),
  };
  const mealGateway = { emitMealCreated: jest.fn() };
  const foodTextEmbeddingService = { upsertDailyNoteEmbedding: jest.fn() };
  const service = new MealService(
    mealRepository as never,
    dailyFoodNoteRepository as never,
    mealGateway as unknown as MealGateway,
    foodTextEmbeddingService as unknown as FoodTextEmbeddingService,
  );
  const savedMeal = {
    id: 1,
    userId: 7,
    name: 'Avena',
    calories: 350,
    proteins: 20,
    carbs: 45,
    fats: 8,
    type: MealType.BREAKFAST,
    date: '2026-09-11',
    time: '14:05:06',
  } as Meal;

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2026, 8, 11, 14, 5, 6));
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mealRepository.create.mockImplementation((value: Meal) => value);
    mealRepository.merge.mockImplementation(
      (meal: Meal, value: Partial<Meal>) => ({
        ...meal,
        ...value,
      }),
    );
    mealRepository.save.mockImplementation((value: Meal) =>
      Promise.resolve(value),
    );
    mealRepository.remove.mockImplementation((value: Meal) =>
      Promise.resolve(value),
    );
    dailyFoodNoteRepository.create.mockImplementation(
      (value: DailyFoodNote) => value,
    );
    dailyFoodNoteRepository.merge.mockImplementation(
      (note: DailyFoodNote, value: Partial<DailyFoodNote>) => ({
        ...note,
        ...value,
      }),
    );
    dailyFoodNoteRepository.save.mockImplementation((value: DailyFoodNote) =>
      Promise.resolve({ ...value, id: 10 }),
    );
    foodTextEmbeddingService.upsertDailyNoteEmbedding.mockResolvedValue(null);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('creates a meal with server time, numeric macros and emits its event', async () => {
    mealRepository.save.mockResolvedValue(savedMeal);

    await expect(
      service.create(
        {
          name: 'Avena',
          calories: '350' as unknown as number,
          proteins: '20' as unknown as number,
          carbs: '45' as unknown as number,
          fats: '8' as unknown as number,
          type: MealType.BREAKFAST,
        },
        7,
        22,
      ),
    ).resolves.toBe(savedMeal);

    expect(mealRepository.create).toHaveBeenCalledWith({
      name: 'Avena',
      calories: 350,
      proteins: 20,
      carbs: 45,
      fats: 8,
      type: MealType.BREAKFAST,
      userId: 7,
      foodPreparationId: 22,
      date: '2026-09-11',
      time: '14:05:06',
    });
    expect(mealGateway.emitMealCreated).toHaveBeenCalledWith(7, savedMeal);
  });

  it('keeps omitted optional macros undefined', async () => {
    await service.create(
      { name: 'Cafe', calories: 5, type: MealType.BREAKFAST },
      7,
    );

    expect(mealRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        proteins: undefined,
        carbs: undefined,
        fats: undefined,
      }),
    );
  });

  it('rejects an unsupported meal type before persistence', async () => {
    await expect(
      service.create(
        { name: 'Comida', calories: 100, type: 'other' as MealType },
        7,
      ),
    ).rejects.toThrow('El tipo de comida es invalido');
    expect(mealRepository.create).not.toHaveBeenCalled();
  });

  it('finds all meals for one user and today meals', async () => {
    mealRepository.find.mockResolvedValue([savedMeal]);

    await expect(service.findAll(7)).resolves.toEqual([savedMeal]);
    expect(mealRepository.find).toHaveBeenNthCalledWith(1, {
      where: { userId: 7 },
    });

    await expect(service.findToday(7)).resolves.toEqual([savedMeal]);
    expect(mealRepository.find).toHaveBeenNthCalledWith(2, {
      where: { userId: 7, date: '2026-09-11' },
    });
  });

  it('returns ordered meal history with its daily note', async () => {
    mealRepository.find.mockResolvedValue([savedMeal]);
    dailyFoodNoteRepository.findOne.mockResolvedValue({
      id: 10,
      note: 'Buen dia',
    });

    await expect(service.findByDate(7, ' 2026-09-11 ')).resolves.toEqual({
      date: '2026-09-11',
      meals: [savedMeal],
      note: 'Buen dia',
      noteId: 10,
    });
    expect(mealRepository.find).toHaveBeenCalledWith({
      where: { userId: 7, date: '2026-09-11' },
      order: { time: 'ASC' },
    });
  });

  it('returns empty note values when a day has no note', async () => {
    mealRepository.find.mockResolvedValue([]);
    dailyFoodNoteRepository.findOne.mockResolvedValue(null);

    await expect(service.findByDate(7, '2026-09-11')).resolves.toEqual({
      date: '2026-09-11',
      meals: [],
      note: '',
      noteId: null,
    });
  });

  it.each([
    ['', 'La fecha es requerida'],
    ['11-09-2026', 'La fecha debe tener formato YYYY-MM-DD'],
    ['2026-02-30', 'La fecha es invalida'],
  ])('rejects invalid history date %p', async (date, message) => {
    await expect(service.findByDate(7, date)).rejects.toThrow(message);
  });

  it('finds, updates and removes only a meal owned by the user', async () => {
    mealRepository.findOne.mockResolvedValue(savedMeal);

    await expect(service.findOne(1, 7)).resolves.toBe(savedMeal);
    await expect(
      service.update(
        1,
        {
          name: 'Avena grande',
          calories: '500' as unknown as number,
          type: MealType.SNACK,
        },
        7,
      ),
    ).resolves.toEqual(expect.objectContaining({ name: 'Avena grande' }));
    expect(mealRepository.merge).toHaveBeenCalledWith(
      savedMeal,
      expect.objectContaining({
        name: 'Avena grande',
        calories: 500,
        type: MealType.SNACK,
        proteins: savedMeal.proteins,
      }),
    );

    await expect(service.remove(1, 7)).resolves.toBe(savedMeal);
    expect(mealRepository.remove).toHaveBeenCalledWith(savedMeal);
  });

  it('throws when a meal does not belong to the user', async () => {
    mealRepository.findOne.mockResolvedValue(null);

    await expect(service.findOne(404, 7)).rejects.toThrow(
      'Comida #404 no encontrada',
    );
  });

  it('creates a trimmed daily note and updates its embedding', async () => {
    dailyFoodNoteRepository.findOne.mockResolvedValue(null);

    const savedNote = await service.saveHistoryNote(7, {
      date: '2026-09-11',
      note: '  Buena saciedad  ',
    });

    expect(dailyFoodNoteRepository.create).toHaveBeenCalledWith({
      userId: 7,
      date: '2026-09-11',
      note: 'Buena saciedad',
    });
    expect(
      foodTextEmbeddingService.upsertDailyNoteEmbedding,
    ).toHaveBeenCalledWith(savedNote);
  });

  it('updates an existing daily note', async () => {
    const existingNote = {
      id: 10,
      userId: 7,
      date: '2026-09-11',
      note: 'Anterior',
    } as DailyFoodNote;
    dailyFoodNoteRepository.findOne.mockResolvedValue(existingNote);

    await service.saveHistoryNote(7, {
      date: '2026-09-11',
      note: 'Nueva',
    });

    expect(dailyFoodNoteRepository.merge).toHaveBeenCalledWith(existingNote, {
      note: 'Nueva',
    });
    expect(dailyFoodNoteRepository.create).not.toHaveBeenCalled();
  });

  it.each([
    [123 as unknown as string, 'La nota debe ser texto'],
    ['x'.repeat(5001), 'La nota no puede superar 5000 caracteres'],
  ])('rejects an invalid daily note', async (note, message) => {
    await expect(
      service.saveHistoryNote(7, { date: '2026-09-11', note }),
    ).rejects.toThrow(message);
    expect(dailyFoodNoteRepository.save).not.toHaveBeenCalled();
  });
});
