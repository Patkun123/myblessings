import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';

export default function BudgetsScreen() {
  return (
    <Screen>
      <ScreenHeader
        title="Budgets"
        subtitle="Set weekly or monthly limits per category or wallet."
      />
      <EmptyState
        icon="pie-chart-outline"
        title="Budgets arrive in the next phase"
        message="You will be able to set spending limits per category, per wallet, or across all books with alerts at 75%, 90%, and 100%."
      />
    </Screen>
  );
}
