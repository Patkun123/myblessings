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

/** Moves a calendar date by whole days without touching time zones. */
export function shiftCalendarDate(value: string, days: number): string {
  const date = parseCalendarDate(value);
  date.setDate(date.getDate() + days);
  return toCalendarDate(date);
}

export function yesterdayCalendarDate(): string {
  return shiftCalendarDate(todayCalendarDate(), -1);
}

/** `YYYY-MM-DD` strings compare correctly with `>` because of the layout. */
export function isFutureCalendarDate(value: string): boolean {
  return value > todayCalendarDate();
}

/** Compact label for a row: "Today", "Yesterday", or "20 Nov 2026". */
export function calendarDateLabel(value: string): string {
  if (value === todayCalendarDate()) return 'Today';
  if (value === yesterdayCalendarDate()) return 'Yesterday';
  return format(parseCalendarDate(value), 'd MMM yyyy');
}

/** Group heading for a list: weekday for older days, plain words for recent ones. */
export function dayHeading(value: string): string {
  if (value === todayCalendarDate()) return 'Today';
  if (value === yesterdayCalendarDate()) return 'Yesterday';

  const date = parseCalendarDate(value);
  return date.getFullYear() === new Date().getFullYear()
    ? format(date, 'EEEE, d MMM')
    : format(date, 'EEEE, d MMM yyyy');
}
