import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { TransactionRow } from '@/components/transaction/TransactionRow';
import { TransactionSheet } from '@/components/transaction/TransactionSheet';
import { AmountText } from '@/components/ui/AmountText';
import { Button } from '@/components/ui/Button';
import { QuickAddHost } from '@/components/ui/QuickAddHost';
import { Screen } from '@/components/ui/Screen';
import { CapizWindow } from '@/components/wallet/CapizWindow';
import type { TransactionWithMeta } from '@/db/queries/transaction';
import { sumCentavos } from '@/domain/money';
import { useMonthTotals } from '@/hooks/useMonthTotals';
import { useRecentTransactions } from '@/hooks/useRecentTransactions';
import { useWalletBalances } from '@/hooks/useWalletBalances';

export default function DashboardScreen() {
  const { wallets } = useWalletBalances();
  const totalCentavos = sumCentavos(wallets.map((wallet) => wallet.balanceCentavos));
  const { incomeCentavos, expenseCentavos, netCentavos } = useMonthTotals();
  const recent = useRecentTransactions(3);
  const [editingTransaction, setEditingTransaction] = useState<TransactionWithMeta | null>(null);

  const hasWallets = wallets.length > 0;
  const flowTotal = incomeCentavos + expenseCentavos;
  const incomePercent = flowTotal > 0 ? Math.round((incomeCentavos / flowTotal) * 100) : 0;
  const expensePercent = flowTotal > 0 ? 100 - incomePercent : 0;

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 96 }}
      >
        <CapizWindow wallets={wallets} totalCentavos={totalCentavos} />

        {/* Month summary: IN / OUT / NET at 13px over a 3px proportional bar */}
        <View className="mt-4 px-1">
          <View className="flex-row items-center justify-between gap-2">
            <View className="flex-1">
              <Text className="font-body-semibold text-[10px] tracking-label text-ink-faint">
                IN
              </Text>
              <AmountText centavos={incomeCentavos} tone="income" size="xs" className="mt-0.5" />
            </View>

            <View className="flex-1 items-center">
              <Text className="font-body-semibold text-[10px] tracking-label text-ink-faint">
                OUT
              </Text>
              <AmountText centavos={expenseCentavos} tone="expense" size="xs" className="mt-0.5" />
            </View>

            <View className="flex-1 items-end">
              <Text className="font-body-semibold text-[10px] tracking-label text-ink-faint">
                NET
              </Text>
              <AmountText
                centavos={netCentavos}
                tone={netCentavos < 0 ? 'expense' : 'neutral'}
                size="xs"
                className="mt-0.5"
              />
            </View>
          </View>

          <View className="mt-2 h-[3px] flex-row overflow-hidden rounded-full bg-line">
            {flowTotal > 0 ? (
              <>
                {incomePercent > 0 ? (
                  <View className="h-full bg-income" style={{ width: `${incomePercent}%` }} />
                ) : null}
                {expensePercent > 0 ? (
                  <View className="h-full bg-expense" style={{ width: `${expensePercent}%` }} />
                ) : null}
              </>
            ) : null}
          </View>
        </View>

        {/* Latest ledger entries (max 3) */}
        <View className="mt-6">
          <View className="mb-2 flex-row items-center justify-between px-1">
            <Text className="font-body-semibold text-[11px] tracking-label text-ink-muted">
              LATEST
            </Text>
            {recent.length > 0 ? (
              <Pressable
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => router.push('/(tabs)/transactions')}
              >
                <Text className="font-body-semibold text-xs text-brand">View all</Text>
              </Pressable>
            ) : null}
          </View>

          <View className="rounded-pane border border-line bg-surface px-3.5">
            {recent.length === 0 ? (
              <View className="items-center px-3 py-6">
                <Text className="text-center font-body text-sm leading-5 text-ink-muted">
                  {hasWallets
                    ? 'Nothing recorded yet. Add your first income, expense, or giving entry.'
                    : 'Add your first wallet on the Wallets tab to begin recording entries.'}
                </Text>
                <View className="mt-4 w-full max-w-xs">
                  <Button
                    label={hasWallets ? 'Record entry' : 'Open Wallets'}
                    onPress={() =>
                      router.push(hasWallets ? '/transaction/new' : '/(tabs)/wallets')
                    }
                  />
                </View>
              </View>
            ) : (
              recent.map((transaction, index) => (
                <View
                  key={transaction.id}
                  className={index === recent.length - 1 ? undefined : 'border-b border-line'}
                >
                  <TransactionRow
                    transaction={transaction}
                    onPress={() => setEditingTransaction(transaction)}
                  />
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      <QuickAddHost hasWallets={hasWallets} />

      <TransactionSheet
        visible={editingTransaction !== null}
        onClose={() => setEditingTransaction(null)}
        transaction={editingTransaction}
      />
    </Screen>
  );
}
