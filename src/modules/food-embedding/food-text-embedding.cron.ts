import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { FoodTextEmbeddingService } from './food-text-embedding.service';

@Injectable()
export class FoodTextEmbeddingCron {
  private readonly logger = new Logger(FoodTextEmbeddingCron.name);

  constructor(
    private readonly foodTextEmbeddingService: FoodTextEmbeddingService,
  ) {}

  // Cron diario oficial:
  // @Cron('0 58 23 * * *', {
  //   timeZone: 'America/Bogota',
  // })
  @Cron(new Date(Date.now() + 10 * 1000))
  async syncDailyNoteEmbeddings(): Promise<void> {
    this.logger.log('Starting one-time daily food note embedding sync');

    try {
      const result =
        await this.foodTextEmbeddingService.syncCurrentDateDailyNoteEmbeddings();

      this.logger.log(
        `One-time daily food note embedding sync finished for ${result.date}: created=${result.created}, skipped=${result.skipped}, failed=${result.failed}`,
      );
    } catch (error) {
      this.logger.error(
        'Failed to run one-time daily food note embedding sync',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
