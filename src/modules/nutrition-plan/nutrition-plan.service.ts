import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLevelValue } from '../activity-level/entities/activity-level.entity';
import { User } from '../user/entities/user.entity';
import { NutritionPlan, UserGoal } from './entities/nutrition-plan.entity';
import { calculateNutritionPlan, normalizeGoal } from './nutrition-plan.utils';

@Injectable()
export class NutritionPlanService {
  constructor(
    @InjectRepository(NutritionPlan)
    private readonly nutritionPlanRepository: Repository<NutritionPlan>,
  ) {}

  async findByUserId(userId: number): Promise<NutritionPlan> {
    const nutritionPlan = await this.nutritionPlanRepository.findOne({
      where: { userId },
    });

    if (!nutritionPlan) {
      throw new NotFoundException('Plan nutricional no encontrado');
    }

    return nutritionPlan;
  }

  async createOrUpdateForUser(
    user: User,
    activityLevel: ActivityLevelValue,
    goal?: UserGoal,
  ): Promise<NutritionPlan> {
    const existingPlan = await this.nutritionPlanRepository.findOne({
      where: { userId: user.id },
    });
    const selectedGoal = normalizeGoal(
      goal ?? existingPlan?.goal ?? UserGoal.MAINTAIN_WEIGHT,
    );
    const targets = calculateNutritionPlan({
      age: user.age,
      weight: user.weight,
      height: user.height,
      sex: user.sex,
      activityLevel,
      goal: selectedGoal,
    });

    const nutritionPlan = existingPlan
      ? this.nutritionPlanRepository.merge(existingPlan, {
          goal: selectedGoal,
          ...targets,
        })
      : this.nutritionPlanRepository.create({
          userId: user.id,
          goal: selectedGoal,
          ...targets,
        });

    return this.nutritionPlanRepository.save(nutritionPlan);
  }
}
