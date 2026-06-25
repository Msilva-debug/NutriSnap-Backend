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

function getUtcDateTime(date: string): number {
  const [year, month, day] = date.split('-').map(Number);

  return Date.UTC(year, month - 1, day);
}
