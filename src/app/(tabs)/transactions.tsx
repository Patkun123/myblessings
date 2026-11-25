import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';

export default function TransactionsScreen() {
  return (
    <Screen>
      <ScreenHeader title="Transactions" subtitle="Search, filter, and review every entry." />
      <EmptyState
        icon="swap-vertical-outline"
        title="No transactions yet"
        message="Income and expenses you record will be listed here, newest first."
      />
    </Screen>
  );
}
