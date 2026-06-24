import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { DailyFoodNote } from './entities/daily-food-note.entity';
import { Meal } from './entities/meal.entity';
import { MonthlyFoodSummary } from './entities/monthly-food-summary.entity';
import { MealGateway } from './meal.gateway';
import { MealService } from './meal.service';
import { MealController } from './meal.controller';
import { MealImageAnalysisService } from './meal-image-analysis.service';
import { MonthlyFoodSummaryCron } from './monthly-food-summary.cron';
import { MonthlyFoodSummaryService } from './monthly-food-summary.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Meal, DailyFoodNote, MonthlyFoodSummary]),
    AuthModule,
  ],
  controllers: [MealController],
  providers: [
    MealService,
    MealGateway,
    MealImageAnalysisService,
    MonthlyFoodSummaryService,
    MonthlyFoodSummaryCron,
  ],
})
export class MealModule {}
