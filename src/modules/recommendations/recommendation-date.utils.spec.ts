import { BadRequestException } from '@nestjs/common';
import {
  buildTwoMonthComparisonWindow,
  countInclusiveDays,
  validateDateParam,
  validateDateRange,
} from './recommendation-date.utils';

describe('recommendation date utils', () => {
  describe('validateDateParam', () => {
    it('trims and returns a valid calendar date', () => {
      expect(validateDateParam(' 2026-09-11 ', 'date')).toBe('2026-09-11');
    });

    it.each([undefined, '', '   '])('rejects a missing value (%p)', (value) => {
      expect(() => validateDateParam(value, 'date')).toThrow(
        new BadRequestException('date es requerido'),
      );
    });

    it.each(['11-09-2026', '2026-9-11', '2026/09/11'])(
      'rejects an unsupported format (%s)',
      (value) => {
        expect(() => validateDateParam(value, 'date')).toThrow(
          'date debe tener formato YYYY-MM-DD',
        );
      },
    );

    it.each(['2026-02-29', '2026-13-01', '2026-04-31'])(
      'rejects a date that does not exist (%s)',
      (value) => {
        expect(() => validateDateParam(value, 'date')).toThrow(
          'date es invalido',
        );
      },
    );

    it('accepts February 29 in a leap year', () => {
      expect(validateDateParam('2024-02-29', 'date')).toBe('2024-02-29');
    });
  });

  describe('validateDateRange', () => {
    it('returns an inclusive ordered range', () => {
      expect(validateDateRange('2026-09-01', '2026-09-11')).toEqual({
        startDate: '2026-09-01',
        endDate: '2026-09-11',
      });
    });

    it('rejects a reversed range', () => {
      expect(() => validateDateRange('2026-09-12', '2026-09-11')).toThrow(
        'startDate no puede ser posterior a endDate',
      );
    });
  });

  describe('countInclusiveDays', () => {
    it.each([
      ['2026-09-11', '2026-09-11', 1],
      ['2026-09-01', '2026-09-11', 11],
      ['2024-02-28', '2024-03-01', 3],
    ])('counts %s through %s as %i day(s)', (startDate, endDate, expected) => {
      expect(countInclusiveDays(startDate, endDate)).toBe(expected);
    });
  });

  describe('buildTwoMonthComparisonWindow', () => {
    it('builds two consecutive historical month windows', () => {
      expect(buildTwoMonthComparisonWindow('2026-09-11')).toEqual({
        firstMonth: {
          startDate: '2026-07-11',
          endDate: '2026-08-10',
        },
        secondMonth: {
          startDate: '2026-08-11',
          endDate: '2026-09-10',
        },
      });
    });

    it('clamps month-end dates without skipping the leap day', () => {
      expect(buildTwoMonthComparisonWindow('2024-03-31')).toEqual({
        firstMonth: {
          startDate: '2024-01-31',
          endDate: '2024-02-28',
        },
        secondMonth: {
          startDate: '2024-02-29',
          endDate: '2024-03-30',
        },
      });
    });
  });
});
