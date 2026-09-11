import { DailyFoodNote } from '../../meal/entities/daily-food-note.entity';
import { Meal, MealType } from '../../meal/entities/meal.entity';
import { RecommendationAiService } from '../recommendation-ai.service';
import { RecommendationRuleEngine } from '../recommendation-rule-engine.service';
import { RecommendationsResponse } from '../recommendation.types';
import { DailyRecommendationStrategy } from './daily-recommendation.strategy';

describe('DailyRecommendationStrategy', () => {
  const mealRepository = { find: jest.fn() };
  const dailyFoodNoteRepository = { findOne: jest.fn() };
  const recommendationAiService = { buildFromText: jest.fn() };
  const recommendationRuleEngine = { build: jest.fn() };
  const strategy = new DailyRecommendationStrategy(
    mealRepository as never,
    dailyFoodNoteRepository as never,
    recommendationAiService as unknown as RecommendationAiService,
    recommendationRuleEngine as unknown as RecommendationRuleEngine,
  );
  const meal = {
    id: 10,
    userId: 5,
    date: '2026-09-11',
    time: '08:00:00',
    type: MealType.BREAKFAST,
    name: 'Huevos con arepa',
    calories: 420,
    proteins: 24,
    carbs: 40,
    fats: 18,
  } as Meal;
  const note = {
    id: 20,
    userId: 5,
    date: '2026-09-11',
    note: 'Buena saciedad durante la manana',
  } as DailyFoodNote;
  const aiResponse = {
    period: 'daily',
    summary: 'Respuesta IA',
    comparison: {
      available: false,
      summary: 'Sin comparación',
      improvements: [],
      needsAttention: [],
      stablePatterns: [],
    },
    recommendations: [
      { title: 'Mantén el desayuno', description: 'Es una buena base.' },
    ],
  } as RecommendationsResponse;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads the day, builds AI context and returns the AI result', async () => {
    mealRepository.find.mockResolvedValue([meal]);
    dailyFoodNoteRepository.findOne.mockResolvedValue(note);
    recommendationAiService.buildFromText.mockResolvedValue(aiResponse);

    await expect(
      strategy.generate(5, { period: 'daily', date: ' 2026-09-11 ' }),
    ).resolves.toBe(aiResponse);

    expect(mealRepository.find).toHaveBeenCalledWith({
      where: { userId: 5, date: '2026-09-11' },
      order: { time: 'ASC' },
    });
    expect(dailyFoodNoteRepository.findOne).toHaveBeenCalledWith({
      where: { userId: 5, date: '2026-09-11' },
    });
    expect(recommendationAiService.buildFromText).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 5,
        period: 'daily',
        meals: [meal],
        notes: [note],
        totalDays: 1,
        summary: note.note,
        embeddingExclusions: [expect.objectContaining({ sourceId: note.id })],
      }),
      expect.stringContaining('Nota diaria: Buena saciedad'),
    );
    expect(recommendationAiService.buildFromText).toHaveBeenCalledWith(
      expect.any(Object),
      expect.stringContaining(
        '- breakfast: Huevos con arepa, 420 kcal, proteinas 24g',
      ),
    );
    expect(recommendationRuleEngine.build).not.toHaveBeenCalled();
  });

  it('falls back to the rule engine when AI is unavailable', async () => {
    const fallbackResponse = { ...aiResponse, summary: 'Respuesta por reglas' };
    mealRepository.find.mockResolvedValue([]);
    dailyFoodNoteRepository.findOne.mockResolvedValue(null);
    recommendationAiService.buildFromText.mockResolvedValue(null);
    recommendationRuleEngine.build.mockReturnValue(fallbackResponse);

    await expect(
      strategy.generate(5, { period: 'daily', date: '2026-09-11' }),
    ).resolves.toBe(fallbackResponse);

    expect(recommendationRuleEngine.build).toHaveBeenCalledWith(
      expect.objectContaining({
        meals: [],
        notes: [],
        embeddingExclusions: [],
      }),
    );
  });

  it('rejects an invalid date before querying repositories', async () => {
    await expect(
      strategy.generate(5, { period: 'daily', date: '2026-02-30' }),
    ).rejects.toThrow('date es invalido');

    expect(mealRepository.find).not.toHaveBeenCalled();
    expect(dailyFoodNoteRepository.findOne).not.toHaveBeenCalled();
  });
});
