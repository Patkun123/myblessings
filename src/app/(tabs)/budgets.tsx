import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';

export default function BudgetsScreen() {
  return (
    <Screen>
      <ScreenHeader title="Budgets" subtitle="Set limits and watch them as the month runs." />
      <EmptyState
        icon="pie-chart-outline"
        title="No budgets yet"
        message="Monthly limits per category or wallet will appear here with progress at 75%, 90%, and 100%."
      />
    </Screen>
  );
}
