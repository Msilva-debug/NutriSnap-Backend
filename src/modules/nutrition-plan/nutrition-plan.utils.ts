import { BadRequestException } from '@nestjs/common';
import { ActivityLevelValue } from '../activity-level/entities/activity-level.entity';
import { UserGoal } from './entities/nutrition-plan.entity';

type FormulaSex = 'male' | 'female';

export interface NutritionPlanInput {
  age: number;
  weight: number;
  height: number;
  sex: string;
  activityLevel: ActivityLevelValue;
  goal: UserGoal;
}

export interface NutritionPlanTargets {
  basalMetabolicRate: number;
  maintenanceCalories: number;
  dailyCalorieGoal: number;
  proteinGoal: number;
  carbsGoal: number;
  fatsGoal: number;
}

const activityFactors: Record<ActivityLevelValue, number> = {
  [ActivityLevelValue.SEDENTARY]: 1.2,
  [ActivityLevelValue.LIGHT]: 1.375,
  [ActivityLevelValue.MODERATE]: 1.55,
  [ActivityLevelValue.ACTIVE]: 1.725,
  [ActivityLevelValue.VERY_ACTIVE]: 1.9,
};

const calorieGoalFactors: Record<UserGoal, number> = {
  [UserGoal.LOSE_FAT]: 0.85,
  [UserGoal.GAIN_MUSCLE]: 1.1,
  [UserGoal.BODY_RECOMPOSITION]: 0.95,
  [UserGoal.MAINTAIN_WEIGHT]: 1,
  [UserGoal.IMPROVE_HABITS]: 1,
};

const proteinPerKgByGoal: Record<UserGoal, number> = {
  [UserGoal.LOSE_FAT]: 2,
  [UserGoal.GAIN_MUSCLE]: 2,
  [UserGoal.BODY_RECOMPOSITION]: 1.8,
  [UserGoal.MAINTAIN_WEIGHT]: 1.6,
  [UserGoal.IMPROVE_HABITS]: 1.6,
};

export function calculateNutritionPlan(
  input: NutritionPlanInput,
): NutritionPlanTargets {
  const age = toPositiveNumber(input.age, 'Edad');
  const weight = toPositiveNumber(input.weight, 'Peso');
  const height = toPositiveNumber(input.height, 'Altura');
  const sex = normalizeSex(input.sex);
  const goal = normalizeGoal(input.goal);
  const activityFactor = activityFactors[input.activityLevel];

  if (!activityFactor) {
    throw new BadRequestException('Nivel de actividad invalido');
  }

  const sexModifier = sex === 'male' ? 5 : -161;
  const basalMetabolicRate = Math.round(
    9.99 * weight + 6.25 * height - 4.92 * age + sexModifier,
  );
  const maintenanceCalories = Math.round(basalMetabolicRate * activityFactor);
  const dailyCalorieGoal = Math.round(
    maintenanceCalories * calorieGoalFactors[goal],
  );
  const proteinGoal = Math.round(weight * proteinPerKgByGoal[goal]);
  const fatsGoal = Math.round((dailyCalorieGoal * 0.25) / 9);
  const caloriesAfterProteinAndFats =
    dailyCalorieGoal - proteinGoal * 4 - fatsGoal * 9;
  const carbsGoal = Math.max(0, Math.round(caloriesAfterProteinAndFats / 4));

  return {
    basalMetabolicRate,
    maintenanceCalories,
    dailyCalorieGoal,
    proteinGoal,
    carbsGoal,
    fatsGoal,
  };
}

export function normalizeGoal(goal: UserGoal): UserGoal {
  if (!Object.values(UserGoal).includes(goal)) {
    throw new BadRequestException('Meta nutricional invalida');
  }

  return goal;
}

function normalizeSex(sex: string): FormulaSex {
  const normalizedSex = sex.trim().toLowerCase();

  if (['masculino', 'male', 'hombre', 'm'].includes(normalizedSex)) {
    return 'male';
  }

  if (['femenino', 'female', 'mujer', 'f'].includes(normalizedSex)) {
    return 'female';
  }

  throw new BadRequestException(
    'Sexo invalido para calcular el plan nutricional',
  );
}

function toPositiveNumber(value: number, fieldName: string): number {
  const numberValue = Number(value);

  if (!Number.isFinite(numberValue) || numberValue <= 0) {
    throw new BadRequestException(`${fieldName} debe ser mayor que cero`);
  }

  return numberValue;
}
