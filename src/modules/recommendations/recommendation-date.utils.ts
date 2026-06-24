import { BadRequestException } from '@nestjs/common';

export interface MonthPeriod {
  endDate: string;
  month: number;
  startDate: string;
  year: number;
}

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

export function validateMonthParam(value: string | undefined): MonthPeriod {
  if (!value?.trim()) {
    throw new BadRequestException('month es requerido');
  }

  const formattedMonth = value.trim();
  const match = /^(\d{4})-(\d{2})$/.exec(formattedMonth);

  if (!match) {
    throw new BadRequestException('month debe tener formato YYYY-MM');
  }

  const [, yearValue, monthValue] = match;
  const year = Number(yearValue);
  const month = Number(monthValue);

  if (month < 1 || month > 12) {
    throw new BadRequestException('month es invalido');
  }

  const endDate = new Date(Date.UTC(year, month, 0));

  return {
    year,
    month,
    startDate: `${yearValue}-${monthValue}-01`,
    endDate: formatUtcDate(endDate),
  };
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

function getUtcDateTime(date: string): number {
  const [year, month, day] = date.split('-').map(Number);

  return Date.UTC(year, month - 1, day);
}

function formatUtcDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
