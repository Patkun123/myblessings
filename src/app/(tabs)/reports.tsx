import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { CashFlowChart } from '@/components/dashboard/CashFlowChart';
import { BreakdownPieChart } from '@/components/reports/BreakdownPieChart';
import { CameMark } from '@/components/ui/CameMark';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { sumCentavos } from '@/domain/money';
import type { TrendRange } from '@/domain/trend';
import { useWalletBalances } from '@/hooks/useWalletBalances';

const RANGE_OPTIONS: readonly { value: TrendRange; label: string; hint: string }[] = [
  { value: '7D', label: '7D', hint: 'Last 7 days' },
  { value: '30D', label: '30D', hint: 'Last 30 days' },
  { value: 'MONTH', label: 'Month', hint: 'This month' },
];

export default function ReportsScreen() {
  const [range, setRange] = useState<TrendRange>('7D');
  const { wallets } = useWalletBalances();

  const hasWallets = wallets.length > 0;
  const totalCentavos = sumCentavos(wallets.map((wallet) => wallet.balanceCentavos));
  const activeHint = RANGE_OPTIONS.find((item) => item.value === range)?.hint ?? '';

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <ScreenHeader
          title="Reports"
          subtitle="Cash flow trends and category breakdown."
        />

        {/* Shared period selector for both trend and pie charts */}
        <View className="flex-row items-center justify-between gap-2 pb-1">
          <Text className="font-body-semibold text-[10px] tracking-label text-ink-faint">
            {`PERIOD · ${activeHint.toUpperCase()}`}
          </Text>

          <View className="flex-row gap-1.5">
            {RANGE_OPTIONS.map((option) => {
              const selected = range === option.value;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  accessibilityLabel={`Filter reports to ${option.hint}`}
                  accessibilityState={{ selected }}
                  hitSlop={4}
                  onPress={() => setRange(option.value)}
                  className={`relative min-h-[36px] min-w-[52px] items-center justify-center overflow-hidden rounded-pane border px-3 ${
                    selected ? 'border-brand bg-brand-light' : 'border-line bg-surface'
                  }`}
                >
                  <CameMark active={selected} />
                  <Text
                    style={{ fontVariant: ['tabular-nums'] }}
                    className={`text-xs tabular-nums ${
                      selected ? 'font-body-semibold text-brand' : 'font-body-medium text-ink-muted'
                    }`}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <CashFlowChart
          hasWallets={hasWallets}
          currentBalanceCentavos={totalCentavos}
          range={range}
          showRangeToggle={false}
          className="mt-3"
        />

        <BreakdownPieChart range={range} className="mt-4" />
      </ScrollView>
    </Screen>
  );
}
