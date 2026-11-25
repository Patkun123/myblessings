import { format, isValid, parse } from 'date-fns';

/**
 * Calendar dates are stored as local 'YYYY-MM-DD', never as UTC timestamps.
 * A transaction logged at 11pm on 30 November must stay in November.
 */
export const CALENDAR_DATE_FORMAT = 'yyyy-MM-dd';

export function toCalendarDate(date: Date): string {
  return format(date, CALENDAR_DATE_FORMAT);
}

export function todayCalendarDate(): string {
  return toCalendarDate(new Date());
}

export function isCalendarDate(value: unknown): value is string {
  if (typeof value !== 'string' || value.length !== 10) return false;
  return isValid(parse(value, CALENDAR_DATE_FORMAT, new Date()));
}

export function parseCalendarDate(value: string): Date {
  return parse(value, CALENDAR_DATE_FORMAT, new Date());
}

/** Inclusive [start, end] range helpers used by list filters and reports. */
export function currentMonthRange(reference = new Date()): { start: string; end: string } {
  const start = new Date(reference.getFullYear(), reference.getMonth(), 1);
  const end = new Date(reference.getFullYear(), reference.getMonth() + 1, 0);
  return { start: toCalendarDate(start), end: toCalendarDate(end) };
}

export function utcTimestamp(): string {
  return new Date().toISOString();
}
