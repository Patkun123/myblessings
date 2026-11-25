import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';

export default function ReportsScreen() {
  return (
    <Screen>
      <ScreenHeader title="Reports" subtitle="Export a period as PDF or CSV." />
      <EmptyState
        icon="document-text-outline"
        title="Nothing to report yet"
        message="Once you record transactions you can export by date range, wallet, category, or type."
      />
    </Screen>
  );
}
