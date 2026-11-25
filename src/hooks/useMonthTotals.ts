import { useLiveQuery } from 'drizzle-orm/expo-sqlite';

import { rangeTotalsQuery } from '@/db/queries/transaction';
import { useSessionStore } from '@/stores/sessionStore';
import { currentMonthRange } from '@/utils/date';

/** Income / expense / net for the current calendar month. */
export function useMonthTotals() {
  const activeUserId = useSessionStore((state) => state.activeUserId);
  const { start, end } = currentMonthRange();
  const { data } = useLiveQuery(rangeTotalsQuery(activeUserId ?? '', start, end), [
    activeUserId,
    start,
    end,
  ]);

  const row = data?.[0];
  const incomeCentavos = row?.incomeCentavos ?? 0;
  const expenseCentavos = row?.expenseCentavos ?? 0;

  return {
    incomeCentavos,
    expenseCentavos,
    netCentavos: incomeCentavos - expenseCentavos,
  };
}
