import { ScrollView, Text, View } from 'react-native';

import { AmountText } from '@/components/ui/AmountText';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { WalletRow } from '@/components/wallet/WalletRow';
import { sumCentavos } from '@/domain/money';
import { useWalletBalances } from '@/hooks/useWalletBalances';

export default function DashboardScreen() {
  const { wallets } = useWalletBalances();
  const totalCentavos = sumCentavos(wallets.map((wallet) => wallet.balanceCentavos));

  return (
    <Screen>
      <ScreenHeader
        eyebrow="MyBlessings"
        title="Overview"
        subtitle="Everything, across all your wallets."
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="rounded-card bg-brand p-5">
          <Text className="text-sm font-medium text-white/80">Total balance</Text>
          <AmountText
            centavos={totalCentavos}
            tone="inverse"
            size="xl"
            className="mt-1"
          />
          <Text className="mt-2 text-xs text-white/70">
            {wallets.length === 1 ? '1 active wallet' : `${wallets.length} active wallets`}
          </Text>
        </View>

        <View className="mt-6">
          <Text className="mb-2 text-base font-semibold text-ink">Wallets</Text>
          <Card className="py-1">
            {wallets.length === 0 ? (
              <Text className="py-6 text-center text-sm text-ink-muted">
                No wallets yet. Your first wallet is created with your profile.
              </Text>
            ) : (
              wallets.map((wallet, index) => (
                <View
                  key={wallet.id}
                  className={index === wallets.length - 1 ? undefined : 'border-b border-line'}
                >
                  <WalletRow wallet={wallet} />
                </View>
              ))
            )}
          </Card>
        </View>

        <View className="mt-6">
          <Text className="mb-2 text-base font-semibold text-ink">Recent activity</Text>
          <Card>
            <Text className="py-6 text-center text-sm text-ink-muted">
              Nothing recorded yet. Income and expenses will show up here.
            </Text>
          </Card>
        </View>
      </ScrollView>
    </Screen>
  );
}
