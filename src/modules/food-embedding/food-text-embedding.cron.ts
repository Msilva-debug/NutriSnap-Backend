import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { FoodTextEmbeddingService } from './food-text-embedding.service';

@Injectable()
export class FoodTextEmbeddingCron {
  private readonly logger = new Logger(FoodTextEmbeddingCron.name);

  constructor(
    private readonly foodTextEmbeddingService: FoodTextEmbeddingService,
  ) {}

  @Cron('0 58 23 * * *', {
    timeZone: 'America/Bogota',
  })
  async syncDailyNoteEmbeddings(): Promise<void> {
    this.logger.log('Starting daily food note embedding sync');

    try {
      const result =
        await this.foodTextEmbeddingService.syncCurrentDateDailyNoteEmbeddings();

      this.logger.log(
        `Daily food note embedding sync finished for ${result.date}: created=${result.created}, skipped=${result.skipped}, failed=${result.failed}`,
      );
    } catch (error) {
      this.logger.error(
        'Failed to sync daily food note embeddings',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
