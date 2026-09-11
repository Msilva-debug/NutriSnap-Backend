import { DailyRecommendationStrategy } from './strategies/daily-recommendation.strategy';
import { RangeRecommendationStrategy } from './strategies/range-recommendation.strategy';
import { RecommendationStrategyFactory } from './recommendation-strategy.factory';

describe('RecommendationStrategyFactory', () => {
  const dailyStrategy = { period: 'daily', generate: jest.fn() };
  const rangeStrategy = { period: 'range', generate: jest.fn() };
  const factory = new RecommendationStrategyFactory(
    dailyStrategy as unknown as DailyRecommendationStrategy,
    rangeStrategy as unknown as RangeRecommendationStrategy,
  );

  it.each([
    ['daily', dailyStrategy],
    [' daily ', dailyStrategy],
    ['range', rangeStrategy],
  ])('returns the expected strategy for %p', (period, expected) => {
    expect(factory.getStrategy(period)).toBe(expected);
  });

  it.each([undefined, '', '   '])('rejects a missing period (%p)', (period) => {
    expect(() => factory.getStrategy(period)).toThrow('period es requerido');
  });

  it('rejects unsupported periods', () => {
    expect(() => factory.getStrategy('monthly')).toThrow(
      'period solo puede ser: daily, range',
    );
  });
});
