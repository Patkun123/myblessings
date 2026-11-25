import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { TransactionRow } from '@/components/transaction/TransactionRow';
import { AmountText } from '@/components/ui/AmountText';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FAB } from '@/components/ui/FAB';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { WalletRow } from '@/components/wallet/WalletRow';
import { sumCentavos } from '@/domain/money';
import { useMonthTotals } from '@/hooks/useMonthTotals';
import { useRecentTransactions } from '@/hooks/useRecentTransactions';
import { useWalletBalances } from '@/hooks/useWalletBalances';

export default function DashboardScreen() {
  const { wallets } = useWalletBalances();
  const totalCentavos = sumCentavos(wallets.map((wallet) => wallet.balanceCentavos));
  const { incomeCentavos, expenseCentavos } = useMonthTotals();
  const recent = useRecentTransactions(5);

  const hasWallets = wallets.length > 0;

  return (
    <Screen>
      <ScreenHeader title="Overview" subtitle="Everything, across all your wallets." />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 96 }}>
        <View className="rounded-card bg-brand p-5">
          <Text className="text-sm font-medium text-white/80">Total balance</Text>
          <AmountText centavos={totalCentavos} tone="inverse" size="xl" className="mt-1" />
          <Text className="mt-2 text-xs text-white/70">
            {wallets.length === 1 ? '1 active wallet' : `${wallets.length} active wallets`}
          </Text>
        </View>

        <View className="mt-4 flex-row gap-3">
          <Card className="flex-1">
            <Text className="text-xs font-medium text-ink-muted">Income this month</Text>
            <AmountText centavos={incomeCentavos} tone="income" size="lg" className="mt-1" />
          </Card>
          <Card className="flex-1">
            <Text className="text-xs font-medium text-ink-muted">Expenses this month</Text>
            <AmountText centavos={expenseCentavos} tone="expense" size="lg" className="mt-1" />
          </Card>
        </View>

        <View className="mt-6">
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-base font-semibold text-ink">Wallets</Text>
            {hasWallets ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/(tabs)/wallets')}
              >
                <Text className="text-sm font-medium text-brand">View all</Text>
              </Pressable>
            ) : null}
          </View>

          <Card className="py-1">
            {hasWallets ? (
              wallets.slice(0, 3).map((wallet, index) => (
                <View
                  key={wallet.id}
                  className={
                    index === Math.min(wallets.length, 3) - 1 ? undefined : 'border-b border-line'
                  }
                >
                  <WalletRow wallet={wallet} />
                </View>
              ))
            ) : (
              <View className="items-center px-4 py-6">
                <Text className="text-center text-sm text-ink-muted">
                  No wallets yet. Create one to start tracking your money.
                </Text>
                <View className="mt-4 w-full max-w-xs">
                  <Button label="Create wallet" onPress={() => router.push('/wallet/new')} />
                </View>
              </View>
            )}
          </Card>
        </View>

        <View className="mt-6">
          <View className="mb-2 flex-row items-center justify-between">
            <Text className="text-base font-semibold text-ink">Recent activity</Text>
            {recent.length > 0 ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/(tabs)/transactions')}
              >
                <Text className="text-sm font-medium text-brand">See all</Text>
              </Pressable>
            ) : null}
          </View>

          <Card className="py-1">
            {recent.length === 0 ? (
              <View className="items-center px-4 py-6">
                <Text className="text-center text-sm text-ink-muted">
                  Nothing recorded yet. Add your first income or expense and it will show up
                  here.
                </Text>
                {hasWallets ? (
                  <View className="mt-4 w-full max-w-xs">
                    <Button
                      label="Add transaction"
                      onPress={() => router.push('/transaction/new')}
                    />
                  </View>
                ) : null}
              </View>
            ) : (
              recent.map((transaction, index) => (
                <View
                  key={transaction.id}
                  className={index === recent.length - 1 ? undefined : 'border-b border-line'}
                >
                  <TransactionRow transaction={transaction} />
                </View>
              ))
            )}
          </Card>
        </View>
      </ScrollView>

      {hasWallets ? (
        <FAB
          icon="add"
          label="Add transaction"
          onPress={() => router.push('/transaction/new')}
        />
      ) : null}
    </Screen>
  );
}
