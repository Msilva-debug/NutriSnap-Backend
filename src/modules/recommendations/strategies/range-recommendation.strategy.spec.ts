import { DailyFoodNote } from '../../meal/entities/daily-food-note.entity';
import { Meal, MealType } from '../../meal/entities/meal.entity';
import { Between } from 'typeorm';
import { RecommendationAiService } from '../recommendation-ai.service';
import { RecommendationRuleEngine } from '../recommendation-rule-engine.service';
import { RecommendationsResponse } from '../recommendation.types';
import { RangeRecommendationStrategy } from './range-recommendation.strategy';

describe('RangeRecommendationStrategy', () => {
  const mealRepository = { find: jest.fn() };
  const dailyFoodNoteRepository = { find: jest.fn() };
  const recommendationAiService = { buildFromText: jest.fn() };
  const recommendationRuleEngine = { build: jest.fn() };
  const strategy = new RangeRecommendationStrategy(
    mealRepository as never,
    dailyFoodNoteRepository as never,
    recommendationAiService as unknown as RecommendationAiService,
    recommendationRuleEngine as unknown as RecommendationRuleEngine,
  );
  const meals = [
    {
      id: 1,
      userId: 8,
      date: '2026-09-10',
      time: '13:00:00',
      type: MealType.LUNCH,
      name: 'Pollo con arroz',
      calories: 650,
      proteins: 40,
      carbs: 70,
      fats: 18,
    } as Meal,
  ];
  const notes = [
    {
      id: 31,
      userId: 8,
      date: '2026-09-10',
      note: 'Tuve hambre en la tarde',
    } as DailyFoodNote,
  ];
  const aiResponse = {
    period: 'range',
    summary: 'Respuesta IA',
    comparison: {
      available: true,
      summary: 'Comparación lista',
      improvements: [],
      needsAttention: [],
      stablePatterns: [],
    },
    recommendations: [{ title: 'Snack', description: 'Agrega fruta.' }],
  } as RecommendationsResponse;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads an inclusive range and passes its context to AI', async () => {
    mealRepository.find.mockResolvedValue(meals);
    dailyFoodNoteRepository.find.mockResolvedValue(notes);
    recommendationAiService.buildFromText.mockResolvedValue(aiResponse);

    await expect(
      strategy.generate(8, {
        period: 'range',
        startDate: '2026-09-09',
        endDate: '2026-09-11',
      }),
    ).resolves.toBe(aiResponse);

    expect(mealRepository.find).toHaveBeenCalledWith({
      where: { userId: 8, date: Between('2026-09-09', '2026-09-11') },
      order: { date: 'ASC', time: 'ASC' },
    });
    expect(dailyFoodNoteRepository.find).toHaveBeenCalledWith({
      where: { userId: 8, date: Between('2026-09-09', '2026-09-11') },
      order: { date: 'ASC' },
    });
    expect(recommendationAiService.buildFromText).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 8,
        period: 'range',
        meals,
        notes,
        totalDays: 3,
        embeddingExclusions: [expect.objectContaining({ sourceId: 31 })],
      }),
      expect.stringContaining('Rango: 2026-09-09 a 2026-09-11'),
    );
    expect(recommendationAiService.buildFromText).toHaveBeenCalledWith(
      expect.any(Object),
      expect.stringContaining('- 2026-09-10: Tuve hambre en la tarde'),
    );
    expect(recommendationRuleEngine.build).not.toHaveBeenCalled();
  });

  it('falls back to rules when AI returns no recommendation', async () => {
    const fallbackResponse = { ...aiResponse, summary: 'Respuesta por reglas' };
    mealRepository.find.mockResolvedValue([]);
    dailyFoodNoteRepository.find.mockResolvedValue([]);
    recommendationAiService.buildFromText.mockResolvedValue(null);
    recommendationRuleEngine.build.mockReturnValue(fallbackResponse);

    await expect(
      strategy.generate(8, {
        period: 'range',
        startDate: '2026-09-09',
        endDate: '2026-09-11',
      }),
    ).resolves.toBe(fallbackResponse);

    expect(recommendationRuleEngine.build).toHaveBeenCalledWith(
      expect.objectContaining({ meals: [], notes: [], totalDays: 3 }),
    );
  });

  it('rejects a reversed range before querying repositories', async () => {
    await expect(
      strategy.generate(8, {
        period: 'range',
        startDate: '2026-09-12',
        endDate: '2026-09-11',
      }),
    ).rejects.toThrow('startDate no puede ser posterior a endDate');

    expect(mealRepository.find).not.toHaveBeenCalled();
    expect(dailyFoodNoteRepository.find).not.toHaveBeenCalled();
  });
});
