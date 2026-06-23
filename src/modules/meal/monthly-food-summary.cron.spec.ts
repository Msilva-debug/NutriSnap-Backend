import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { MonthlyFoodSummaryCron } from './monthly-food-summary.cron';
import { MonthlyFoodSummaryService } from './monthly-food-summary.service';

describe('MonthlyFoodSummaryCron', () => {
  let cron: MonthlyFoodSummaryCron;

  const monthlyFoodSummaryService = {
    generatePreviousMonthSummaries: jest.fn(),
  };
  const specLog = (message: string) => {
    console.log(`[MonthlyFoodSummaryCron spec] ${message}`);
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    jest.spyOn(Logger.prototype, 'log').mockImplementation((message) => {
      if (String(message).includes('dependencies initialized')) {
        return;
      }

      specLog(`Nest log: ${String(message)}`);
    });
    jest.spyOn(Logger.prototype, 'error').mockImplementation((message) => {
      specLog(`Nest error: ${String(message)}`);
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MonthlyFoodSummaryCron,
        {
          provide: MonthlyFoodSummaryService,
          useValue: monthlyFoodSummaryService,
        },
      ],
    }).compile();

    cron = module.get<MonthlyFoodSummaryCron>(MonthlyFoodSummaryCron);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('generates previous month summaries when the cron runs', async () => {
    specLog('Preparing successful cron execution with 2 summaries');

    monthlyFoodSummaryService.generatePreviousMonthSummaries.mockResolvedValue([
      { id: 1 },
      { id: 2 },
    ]);

    await cron.generatePreviousMonthSummaries();

    specLog('Cron execution finished successfully');

    expect(
      monthlyFoodSummaryService.generatePreviousMonthSummaries,
    ).toHaveBeenCalledTimes(1);

    specLog('Service was called exactly once');
  });

  it('throws the service error when summary generation fails', async () => {
    specLog('Preparing failure scenario');

    const error = new Error('summary generation failed');

    monthlyFoodSummaryService.generatePreviousMonthSummaries.mockRejectedValue(
      error,
    );

    await expect(cron.generatePreviousMonthSummaries()).rejects.toThrow(error);

    specLog('Service error was re-thrown as expected');
  });
});
