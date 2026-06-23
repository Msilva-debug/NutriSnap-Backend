import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MonthlyFoodSummaryService } from './monthly-food-summary.service';

@Injectable()
export class MonthlyFoodSummaryCron {
  private readonly logger = new Logger(MonthlyFoodSummaryCron.name);

  constructor(
    private readonly monthlyFoodSummaryService: MonthlyFoodSummaryService,
  ) {}

  @Cron('0 0 0 1 * *', {
    timeZone: 'America/Bogota',
  })
  async generatePreviousMonthSummaries(): Promise<void> {
    this.logger.log('Starting previous month monthly food summary generation');

    try {
      const summaries =
        await this.monthlyFoodSummaryService.generatePreviousMonthSummaries();

      this.logger.log(
        `Generated ${summaries.length} monthly food summaries for previous month`,
      );
    } catch (error) {
      this.logger.error(
        'Failed to generate previous month monthly food summaries',
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
