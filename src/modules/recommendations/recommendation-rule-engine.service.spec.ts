import { DailyFoodNote } from '../meal/entities/daily-food-note.entity';
import { Meal, MealType } from '../meal/entities/meal.entity';
import { FoodTextEmbeddingSourceType } from '../food-embedding/entities/food-text-embedding.entity';
import { RecommendationRuleEngine } from './recommendation-rule-engine.service';
import { RecommendationAnalysisInput } from './recommendation.types';

describe('RecommendationRuleEngine', () => {
  const engine = new RecommendationRuleEngine();

  const buildInput = (
    overrides: Partial<RecommendationAnalysisInput> = {},
  ): RecommendationAnalysisInput => ({
    userId: 1,
    period: 'daily',
    meals: [],
    notes: [],
    totalDays: 1,
    ...overrides,
  });

  const meal = (overrides: Partial<Meal> = {}): Meal =>
    ({
      id: 1,
      userId: 1,
      date: '2026-09-11',
      time: '12:00:00',
      type: MealType.LUNCH,
      name: 'Almuerzo',
      calories: 500,
      proteins: 30,
      carbs: 50,
      fats: 15,
      ...overrides,
    }) as Meal;

  it('returns a useful base recommendation when there are no meals', () => {
    const response = engine.build(buildInput());

    expect(response.period).toBe('daily');
    expect(response.summary).toContain(
      'No encontramos comidas registradas en el periodo seleccionado.',
    );
    expect(response.recommendations).toEqual([
      expect.objectContaining({
        category: 'Base alimenticia',
        title: 'Construye una comida simple y completa',
      }),
    ]);
    expect(response.comparison).toEqual(
      expect.objectContaining({
        available: false,
        improvements: [],
        needsAttention: [],
        stablePatterns: [],
      }),
    );
  });

  it('uses the comparison window and note context in the summary', () => {
    const response = engine.build(
      buildInput({
        notes: [{ note: 'Me senti bien' } as DailyFoodNote],
        semanticMemoryComparisonWindow: {
          firstMonth: { startDate: '2026-07-11', endDate: '2026-08-10' },
          secondMonth: { startDate: '2026-08-11', endDate: '2026-09-10' },
        },
        embeddingExclusions: [
          {
            sourceType: FoodTextEmbeddingSourceType.DAILY_NOTE,
            sourceId: 9,
          },
        ],
      }),
    );

    expect(response.summary).toContain(
      'Las notas registradas aportan contexto',
    );
    expect(response.comparison.summary).toContain(
      'primer mes 2026-07-11 a 2026-08-10; segundo mes 2026-08-11 a 2026-09-10',
    );
  });

  it('flags missing days, low protein, high carbs and concentrated meals', () => {
    const response = engine.build(
      buildInput({
        period: 'range',
        totalDays: 3,
        meals: [
          meal({
            calories: 600,
            proteins: 10,
            carbs: 120,
            fats: 5,
          }),
          meal({
            id: 2,
            calories: 600,
            proteins: 10,
            carbs: 120,
            fats: 5,
          }),
        ],
      }),
    );

    expect(response.period).toBe('range');
    expect(response.recommendations.map(({ category }) => category)).toEqual([
      'Consistencia alimentaria',
      'Proteinas',
      'Carbohidratos',
      'Energia',
    ]);
    expect(response.summary).toContain('2 comidas registradas');
    expect(response.summary).toContain('1200 calorias');
  });

  it('flags high fat, large meals and high daily calories', () => {
    const response = engine.build(
      buildInput({
        meals: [
          meal({
            calories: 1500,
            proteins: 100,
            carbs: 80,
            fats: 100,
          }),
          meal({
            id: 2,
            type: MealType.DINNER,
            calories: 1500,
            proteins: 100,
            carbs: 80,
            fats: 100,
          }),
        ],
      }),
    );

    expect(response.recommendations.map(({ category }) => category)).toEqual([
      'Variedad',
      'Grasas',
      'Energia',
      'Calorias',
    ]);
  });

  it('keeps a balanced complete period to the general variety advice', () => {
    const response = engine.build(
      buildInput({
        totalDays: 2,
        meals: [
          meal({ date: '2026-09-10', type: MealType.BREAKFAST }),
          meal({ id: 2, date: '2026-09-11', type: MealType.LUNCH }),
        ],
      }),
    );

    expect(response.recommendations).toEqual([
      expect.objectContaining({ category: 'Variedad' }),
    ]);
  });
});
