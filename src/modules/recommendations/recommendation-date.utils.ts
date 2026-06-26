import { BadRequestException } from '@nestjs/common';

export function validateDateParam(
  value: string | undefined,
  field: string,
): string {
  if (!value?.trim()) {
    throw new BadRequestException(`${field} es requerido`);
  }

  const formattedDate = value.trim();
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(formattedDate);

  if (!match) {
    throw new BadRequestException(`${field} debe tener formato YYYY-MM-DD`);
  }

  const [, yearValue, monthValue, dayValue] = match;
  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);
  const parsedDate = new Date(Date.UTC(year, month - 1, day));

  if (
    parsedDate.getUTCFullYear() !== year ||
    parsedDate.getUTCMonth() !== month - 1 ||
    parsedDate.getUTCDate() !== day
  ) {
    throw new BadRequestException(`${field} es invalido`);
  }

  return formattedDate;
}

export function validateDateRange(
  startDateValue: string | undefined,
  endDateValue: string | undefined,
): { endDate: string; startDate: string } {
  const startDate = validateDateParam(startDateValue, 'startDate');
  const endDate = validateDateParam(endDateValue, 'endDate');

  if (startDate > endDate) {
    throw new BadRequestException('startDate no puede ser posterior a endDate');
  }

  return { startDate, endDate };
}

export function countInclusiveDays(startDate: string, endDate: string): number {
  const startTime = getUtcDateTime(startDate);
  const endTime = getUtcDateTime(endDate);
  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  return Math.round((endTime - startTime) / millisecondsPerDay) + 1;
}

export function buildTwoMonthComparisonWindow(referenceDate: string): {
  firstMonth: {
    endDate: string;
    startDate: string;
  };
  secondMonth: {
    endDate: string;
    startDate: string;
  };
} {
  const secondMonthStartDate = subtractMonths(referenceDate, 1);

  return {
    firstMonth: {
      startDate: subtractMonths(referenceDate, 2),
      endDate: subtractOneDay(secondMonthStartDate),
    },
    secondMonth: {
      startDate: secondMonthStartDate,
      endDate: subtractOneDay(referenceDate),
    },
  };
}

function getUtcDateTime(date: string): number {
  const [year, month, day] = date.split('-').map(Number);

  return Date.UTC(year, month - 1, day);
}

function subtractMonths(date: string, monthsToSubtract: number): string {
  const [year, month, day] = date.split('-').map(Number);
  const targetMonthDate = new Date(
    Date.UTC(year, month - 1 - monthsToSubtract, 1),
  );
  const targetYear = targetMonthDate.getUTCFullYear();
  const targetMonth = targetMonthDate.getUTCMonth() + 1;
  const targetDay = Math.min(day, getDaysInMonth(targetYear, targetMonth));

  return formatUtcDate(targetYear, targetMonth, targetDay);
}

function subtractOneDay(date: string): string {
  const [year, month, day] = date.split('-').map(Number);
  const previousDate = new Date(Date.UTC(year, month - 1, day));

  previousDate.setUTCDate(previousDate.getUTCDate() - 1);

  return formatUtcDate(
    previousDate.getUTCFullYear(),
    previousDate.getUTCMonth() + 1,
    previousDate.getUTCDate(),
  );
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function formatUtcDate(year: number, month: number, day: number): string {
  return [
    String(year).padStart(4, '0'),
    String(month).padStart(2, '0'),
    String(day).padStart(2, '0'),
  ].join('-');
}
