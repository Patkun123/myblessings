import { format } from 'date-fns';

import { CURRENCY } from '@/constants/currency';
import type { Centavos } from '@/domain/money';
import {
  currentMonthRange,
  parseCalendarDate,
  shiftCalendarDate,
  toCalendarDate,
} from '@/utils/date';

export type TrendRange = '7D' | '30D' | 'MONTH';

export type DailyLedgerRow = {
  occurredOn: string;
  incomeCentavos: Centavos;
  expenseCentavos: Centavos;
  netLedgerCentavos: Centavos;
};

export type TrendPoint = {
  date: string;
  label: string;
  incomeCentavos: Centavos;
  expenseCentavos: Centavos;
  balanceCentavos: Centavos;
};

/** Inclusive local calendar-date bounds for each Home chart range toggle. */
export function getTrendDateWindow(
  range: TrendRange,
  reference = new Date()
): { start: string; end: string } {
  const today = toCalendarDate(reference);

  if (range === '7D') {
    return { start: shiftCalendarDate(today, -6), end: today };
  }
  if (range === '30D') {
    return { start: shiftCalendarDate(today, -29), end: today };
  }
  return { start: currentMonthRange(reference).start, end: today };
}

/**
 * Fills every calendar day in `[start, end]` without gaps and computes the
 * three aligned series for the Home multi-line chart:
 * - `balanceCentavos`: cumulative Total Cash on Hand across active wallets
 * - `incomeCentavos`: daily inflow
 * - `expenseCentavos`: daily outflow
 */
export function buildTrendSeries(params: {
  start: string;
  end: string;
  startingBalanceCentavos: Centavos;
  dailyRows: readonly DailyLedgerRow[];
}): TrendPoint[] {
  const { start, end, startingBalanceCentavos, dailyRows } = params;
  if (start > end) return [];

  const byDate = new Map<string, DailyLedgerRow>();
  for (const row of dailyRows) {
    byDate.set(row.occurredOn, row);
  }

  const points: TrendPoint[] = [];
  let runningBalance = startingBalanceCentavos;
  let cursor = start;

  // Guard against accidental infinite loops on malformed dates.
  for (let guard = 0; guard < 366 && cursor <= end; guard += 1) {
    const row = byDate.get(cursor);
    const incomeCentavos = row?.incomeCentavos ?? 0;
    const expenseCentavos = row?.expenseCentavos ?? 0;
    runningBalance += row?.netLedgerCentavos ?? 0;

    points.push({
      date: cursor,
      label: format(parseCalendarDate(cursor), 'd MMM'),
      incomeCentavos,
      expenseCentavos,
      balanceCentavos: runningBalance,
    });

    cursor = shiftCalendarDate(cursor, 1);
  }

  return points;
}

export type ChartBounds = {
  minCentavos: Centavos;
  maxCentavos: Centavos;
};

/** Computes inclusive Y-axis bounds across all three lines, always including 0. */
export function computeTrendBounds(points: readonly TrendPoint[]): ChartBounds {
  if (points.length === 0) {
    return { minCentavos: 0, maxCentavos: 100_00 };
  }

  let minVal = 0;
  let maxVal = 0;

  for (const point of points) {
    minVal = Math.min(minVal, point.incomeCentavos, point.expenseCentavos, point.balanceCentavos);
    maxVal = Math.max(maxVal, point.incomeCentavos, point.expenseCentavos, point.balanceCentavos);
  }

  if (minVal === maxVal) {
    return { minCentavos: Math.min(0, minVal), maxCentavos: Math.max(100_00, maxVal + 100_00) };
  }

  const span = maxVal - minVal;
  const padding = Math.round(span * 0.08);
  return {
    minCentavos: minVal < 0 ? minVal - padding : 0,
    maxCentavos: maxVal + padding,
  };
}

/** Compact peso label for chart Y-axis ticks (e.g. ₱0, ₱1.5k, ₱120k). */
export function formatCompactPesoAxis(centavos: Centavos): string {
  const pesos = Math.round(centavos / 100);
  const abs = Math.abs(pesos);
  const sign = pesos < 0 ? '-' : '';

  if (abs >= 1_000_000) {
    const m = (abs / 1_000_000).toFixed(1).replace(/\.0$/, '');
    return `${sign}${CURRENCY.symbol}${m}M`;
  }
  if (abs >= 1_000) {
    const k = (abs / 1_000).toFixed(abs >= 10_000 ? 0 : 1).replace(/\.0$/, '');
    return `${sign}${CURRENCY.symbol}${k}k`;
  }
  return `${sign}${CURRENCY.symbol}${abs}`;
}
