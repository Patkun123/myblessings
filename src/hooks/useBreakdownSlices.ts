import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useMemo } from 'react';

import { categoryTotalsQuery } from '@/db/queries/transaction';
import {
  buildCategorySlices,
  buildWalletSlices,
  type PieBreakdownMode,
  type PieSlice,
} from '@/domain/breakdown';
import { sumCentavos } from '@/domain/money';
import { getTrendDateWindow, type TrendRange } from '@/domain/trend';
import { useWalletBalances } from '@/hooks/useWalletBalances';
import { useSessionStore } from '@/stores/sessionStore';

export type UseBreakdownSlicesResult = {
  slices: PieSlice[];
  totalCentavos: number;
  start: string;
  end: string;
};

/**
 * Live pie-chart slices for Reports: switches between Expenses by Category,
 * Income by Category (both scoped to `[start, end]`), and active Wallet shares.
 */
export function useBreakdownSlices(
  range: TrendRange,
  mode: PieBreakdownMode
): UseBreakdownSlicesResult {
  const activeUserId = useSessionStore((state) => state.activeUserId);
  const { start, end } = getTrendDateWindow(range);
  const categoryType = mode === 'income' ? 'income' : 'expense';

  const { data: categoryRows } = useLiveQuery(
    categoryTotalsQuery(activeUserId ?? '', start, end, categoryType),
    [activeUserId, start, end, categoryType]
  );

  const { wallets } = useWalletBalances();

  return useMemo(() => {
    const slices =
      mode === 'wallets'
        ? buildWalletSlices(wallets)
        : buildCategorySlices(categoryRows ?? []);

    const totalCentavos = sumCentavos(slices.map((slice) => slice.centavos));

    return {
      slices,
      totalCentavos,
      start,
      end,
    };
  }, [categoryRows, end, mode, start, wallets]);
}
