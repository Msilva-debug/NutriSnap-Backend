import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DailyFoodNote } from './entities/daily-food-note.entity';
import { Meal } from './entities/meal.entity';
import { MonthlyFoodSummary } from './entities/monthly-food-summary.entity';

const summaryModel = 'local-monthly-food-summary';
const promptVersion = 'monthly-food-summary-v1';

interface MonthPeriod {
  endDate: string;
  month: number;
  startDate: string;
  year: number;
}

@Injectable()
export class MonthlyFoodSummaryService {
  private readonly logger = new Logger(MonthlyFoodSummaryService.name);

  constructor(
    @InjectRepository(DailyFoodNote)
    private readonly dailyFoodNoteRepository: Repository<DailyFoodNote>,
    @InjectRepository(Meal)
    private readonly mealRepository: Repository<Meal>,
    @InjectRepository(MonthlyFoodSummary)
    private readonly monthlyFoodSummaryRepository: Repository<MonthlyFoodSummary>,
  ) {}

  async generatePreviousMonthSummaries(
    referenceDate = new Date(),
  ): Promise<MonthlyFoodSummary[]> {
    const { year, month } = this.getPreviousMonthPeriod(referenceDate);

    this.logger.log(
      `Looking for users with meal activity in ${this.formatMonth(year, month)}`,
    );

    const userIds = await this.findUserIdsWithMonthlyActivity(year, month);

    this.logger.log(
      `Found ${userIds.length} users with activity in ${this.formatMonth(
        year,
        month,
      )}`,
    );

    const summaries: MonthlyFoodSummary[] = [];

    for (const userId of userIds) {
      this.logger.log(
        `Generating monthly food summary for user ${userId} in ${this.formatMonth(
          year,
          month,
        )}`,
      );

      summaries.push(
        await this.generateMonthlySummaryForUser(userId, year, month),
      );
    }

    this.logger.log(
      `Finished monthly food summary generation for ${this.formatMonth(
        year,
        month,
      )}`,
    );

    return summaries;
  }

  async generatePreviousMonthSummaryForUser(
    userId: number,
    referenceDate = new Date(),
  ): Promise<MonthlyFoodSummary> {
    const { year, month } = this.getPreviousMonthPeriod(referenceDate);

    this.logger.log(
      `Manually generating monthly food summary for user ${userId} in ${this.formatMonth(
        year,
        month,
      )}`,
    );

    return this.generateMonthlySummaryForUser(userId, year, month);
  }

  async generateMonthlySummaryForUser(
    userId: number,
    year: number,
    month: number,
  ): Promise<MonthlyFoodSummary> {
    const period = this.getMonthPeriod(year, month);
    const [notes, meals] = await Promise.all([
      this.findNotesInPeriod(userId, period),
      this.findMealsInPeriod(userId, period),
    ]);
    const summary = this.generateSummaryText(year, month, notes, meals);
    const existingSummary = await this.monthlyFoodSummaryRepository.findOne({
      where: {
        userId,
        year,
        month,
      },
    });

    this.logger.log(
      existingSummary
        ? `Updating existing summary for user ${userId} in ${this.formatMonth(
            year,
            month,
          )}`
        : `Creating new summary for user ${userId} in ${this.formatMonth(
            year,
            month,
          )}`,
    );

    const monthlySummary = existingSummary
      ? this.monthlyFoodSummaryRepository.merge(existingSummary, {
          summary,
          status: 'completed',
          model: summaryModel,
          promptVersion,
          generatedAt: new Date(),
        })
      : this.monthlyFoodSummaryRepository.create({
          userId,
          year,
          month,
          summary,
          status: 'completed',
          model: summaryModel,
          promptVersion,
          generatedAt: new Date(),
        });

    const savedSummary =
      await this.monthlyFoodSummaryRepository.save(monthlySummary);

    this.logger.log(
      `Saved monthly food summary ${savedSummary.id} for user ${userId} in ${this.formatMonth(
        year,
        month,
      )}`,
    );

    return savedSummary;
  }

  private async findUserIdsWithMonthlyActivity(
    year: number,
    month: number,
  ): Promise<number[]> {
    const period = this.getMonthPeriod(year, month);
    const [noteUsers, mealUsers] = await Promise.all([
      this.dailyFoodNoteRepository
        .createQueryBuilder('note')
        .select('DISTINCT note.userId', 'userId')
        .where('note.date >= :startDate', { startDate: period.startDate })
        .andWhere('note.date <= :endDate', { endDate: period.endDate })
        .getRawMany<{ userId: number | string }>(),
      this.mealRepository
        .createQueryBuilder('meal')
        .select('DISTINCT meal.userId', 'userId')
        .where('meal.date >= :startDate', { startDate: period.startDate })
        .andWhere('meal.date <= :endDate', { endDate: period.endDate })
        .getRawMany<{ userId: number | string }>(),
    ]);

    return Array.from(
      new Set(
        [...noteUsers, ...mealUsers]
          .map(({ userId }) => Number(userId))
          .filter((userId) => Number.isInteger(userId)),
      ),
    );
  }

  private findNotesInPeriod(
    userId: number,
    period: MonthPeriod,
  ): Promise<DailyFoodNote[]> {
    return this.dailyFoodNoteRepository
      .createQueryBuilder('note')
      .where('note.userId = :userId', { userId })
      .andWhere('note.date >= :startDate', { startDate: period.startDate })
      .andWhere('note.date <= :endDate', { endDate: period.endDate })
      .orderBy('note.date', 'ASC')
      .getMany();
  }

  private findMealsInPeriod(
    userId: number,
    period: MonthPeriod,
  ): Promise<Meal[]> {
    return this.mealRepository
      .createQueryBuilder('meal')
      .where('meal.userId = :userId', { userId })
      .andWhere('meal.date >= :startDate', { startDate: period.startDate })
      .andWhere('meal.date <= :endDate', { endDate: period.endDate })
      .orderBy('meal.date', 'ASC')
      .addOrderBy('meal.time', 'ASC')
      .getMany();
  }

  private generateSummaryText(
    year: number,
    month: number,
    notes: DailyFoodNote[],
    meals: Meal[],
  ): string {
    const monthLabel = `${year}-${String(month).padStart(2, '0')}`;
    const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);
    const averageCalories = meals.length
      ? Math.round(totalCalories / meals.length)
      : 0;
    const noteSection = notes.length
      ? notes.map((note) => `- ${note.date}: ${note.note}`).join('\n')
      : '- No hubo notas diarias registradas.';
    const mealSection = meals.length
      ? [
          `- Comidas registradas: ${meals.length}`,
          `- Calorias totales registradas: ${totalCalories}`,
          `- Promedio por comida: ${averageCalories} kcal`,
        ].join('\n')
      : '- No hubo comidas registradas.';

    return [
      `Resumen mensual de alimentacion (${monthLabel})`,
      '',
      'Notas del usuario:',
      noteSection,
      '',
      'Actividad de comidas:',
      mealSection,
    ].join('\n');
  }

  private getPreviousMonthPeriod(referenceDate: Date): {
    month: number;
    year: number;
  } {
    const previousMonth = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth() - 1,
      1,
    );

    return {
      year: previousMonth.getFullYear(),
      month: previousMonth.getMonth() + 1,
    };
  }

  private getMonthPeriod(year: number, month: number): MonthPeriod {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    return {
      year,
      month,
      startDate: this.formatDate(startDate),
      endDate: this.formatDate(endDate),
    };
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private formatMonth(year: number, month: number): string {
    return `${year}-${String(month).padStart(2, '0')}`;
  }
}
