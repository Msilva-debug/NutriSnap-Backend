import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NutritionPlan } from './entities/nutrition-plan.entity';
import { NutritionPlanController } from './nutrition-plan.controller';
import { NutritionPlanService } from './nutrition-plan.service';

@Module({
  imports: [TypeOrmModule.forFeature([NutritionPlan])],
  controllers: [NutritionPlanController],
  providers: [NutritionPlanService],
  exports: [NutritionPlanService],
})
export class NutritionPlanModule {}
