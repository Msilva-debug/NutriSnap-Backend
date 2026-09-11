import { Logger } from '@nestjs/common';
import { FoodTextEmbeddingCron } from './food-text-embedding.cron';
import { FoodTextEmbeddingService } from './food-text-embedding.service';

describe('FoodTextEmbeddingCron', () => {
  const foodTextEmbeddingService = {
    syncCurrentDateDailyNoteEmbeddings: jest.fn(),
  };
  const cron = new FoodTextEmbeddingCron(
    foodTextEmbeddingService as unknown as FoodTextEmbeddingService,
  );
  let logSpy: jest.SpiedFunction<Logger['log']>;
  let errorSpy: jest.SpiedFunction<Logger['error']>;

  beforeEach(() => {
    jest.clearAllMocks();
    logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    errorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('runs the daily synchronization and logs its counters', async () => {
    foodTextEmbeddingService.syncCurrentDateDailyNoteEmbeddings.mockResolvedValue(
      { date: '2026-09-11', created: 2, skipped: 3, failed: 1 },
    );

    await cron.syncDailyNoteEmbeddings();

    expect(
      foodTextEmbeddingService.syncCurrentDateDailyNoteEmbeddings,
    ).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringContaining('created=2, skipped=3, failed=1'),
    );
  });

  it('logs synchronization errors without rejecting the cron job', async () => {
    foodTextEmbeddingService.syncCurrentDateDailyNoteEmbeddings.mockRejectedValue(
      new Error('database unavailable'),
    );

    await expect(cron.syncDailyNoteEmbeddings()).resolves.toBeUndefined();
    expect(errorSpy).toHaveBeenCalledWith(
      'Failed to run one-time daily food note embedding sync',
      expect.stringContaining('database unavailable'),
    );
  });
});
