import { ActivityLevelValue } from '../activity-level/entities/activity-level.entity';
import { UserGoal } from './entities/nutrition-plan.entity';
import { calculateNutritionPlan, normalizeGoal } from './nutrition-plan.utils';

describe('nutrition plan utils', () => {
  const baseInput = {
    age: 26,
    weight: 70,
    height: 175,
    sex: 'masculino',
    activityLevel: ActivityLevelValue.MODERATE,
    goal: UserGoal.MAINTAIN_WEIGHT,
  };

  it('calculates targets from the user measurements and goal', () => {
    expect(calculateNutritionPlan(baseInput)).toEqual({
      basalMetabolicRate: 1670,
      maintenanceCalories: 2589,
      dailyCalorieGoal: 2589,
      proteinGoal: 112,
      carbsGoal: 373,
      fatsGoal: 72,
    });
  });

  it('applies the female formula and accepts a localized alias', () => {
    expect(
      calculateNutritionPlan({
        ...baseInput,
        sex: ' Mujer ',
        activityLevel: ActivityLevelValue.SEDENTARY,
      }),
    ).toEqual({
      basalMetabolicRate: 1504,
      maintenanceCalories: 1805,
      dailyCalorieGoal: 1805,
      proteinGoal: 112,
      carbsGoal: 227,
      fatsGoal: 50,
    });
  });

  it.each([
    ['age', { age: 0 }, 'Edad debe ser mayor que cero'],
    ['weight', { weight: Number.NaN }, 'Peso debe ser mayor que cero'],
    ['height', { height: -1 }, 'Altura debe ser mayor que cero'],
  ])('rejects an invalid %s', (_field, override, message) => {
    expect(() => calculateNutritionPlan({ ...baseInput, ...override })).toThrow(
      message,
    );
  });

  it('rejects an unsupported sex', () => {
    expect(() =>
      calculateNutritionPlan({ ...baseInput, sex: 'sin especificar' }),
    ).toThrow('Sexo invalido para calcular el plan nutricional');
  });

  it('rejects an unsupported activity level', () => {
    expect(() =>
      calculateNutritionPlan({
        ...baseInput,
        activityLevel: 'unknown' as ActivityLevelValue,
      }),
    ).toThrow('Nivel de actividad invalido');
  });

  it('accepts every supported nutrition goal', () => {
    for (const goal of Object.values(UserGoal)) {
      expect(normalizeGoal(goal)).toBe(goal);
    }
  });

  it('rejects an unsupported nutrition goal', () => {
    expect(() => normalizeGoal('unknown' as UserGoal)).toThrow(
      'Meta nutricional invalida',
    );
  });
});
