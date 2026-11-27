import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useMemo } from 'react';

import {
  dailyTrendTotalsQuery,
  walletBalancesBeforeDateQuery,
} from '@/db/queries/transaction';
import { sumCentavos } from '@/domain/money';
import {
  buildTrendSeries,
  getTrendDateWindow,
  type TrendPoint,
  type TrendRange,
} from '@/domain/trend';
import { useSessionStore } from '@/stores/sessionStore';

export type UseTrendSeriesResult = {
  points: TrendPoint[];
  start: string;
  end: string;
  periodIncomeCentavos: number;
  periodExpenseCentavos: number;
  hasActivity: boolean;
};

/**
 * Live multi-line trend data for the Home chart:
 * cumulative Total Cash on Hand alongside daily Income and Expenses.
 */
export function useTrendSeries(range: TrendRange): UseTrendSeriesResult {
  const activeUserId = useSessionStore((state) => state.activeUserId);
  const { start, end } = getTrendDateWindow(range);

  const { data: preRangeRows } = useLiveQuery(
    walletBalancesBeforeDateQuery(activeUserId ?? '', start),
    [activeUserId, start]
  );

  const { data: dailyRows } = useLiveQuery(
    dailyTrendTotalsQuery(activeUserId ?? '', start, end),
    [activeUserId, start, end]
  );

  return useMemo(() => {
    const startingBalanceCentavos = sumCentavos(
      (preRangeRows ?? []).map((row) => row.balanceCentavos)
    );
    const points = buildTrendSeries({
      start,
      end,
      startingBalanceCentavos,
      dailyRows: dailyRows ?? [],
    });

    let periodIncomeCentavos = 0;
    let periodExpenseCentavos = 0;
    let hasActivity = false;

    for (const point of points) {
      periodIncomeCentavos += point.incomeCentavos;
      periodExpenseCentavos += point.expenseCentavos;
      if (point.incomeCentavos > 0 || point.expenseCentavos > 0) {
        hasActivity = true;
      }
    }

    return {
      points,
      start,
      end,
      periodIncomeCentavos,
      periodExpenseCentavos,
      hasActivity,
    };
  }, [dailyRows, end, preRangeRows, start]);
}
