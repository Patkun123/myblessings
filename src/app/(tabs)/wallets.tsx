import { ScrollView, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { WalletRow } from '@/components/wallet/WalletRow';
import { useWalletBalances } from '@/hooks/useWalletBalances';

export default function WalletsScreen() {
  const { wallets } = useWalletBalances();

  return (
    <Screen>
      <ScreenHeader
        title="Wallets"
        subtitle="Each wallet keeps its own balance and history."
      />

      {wallets.length === 0 ? (
        <EmptyState
          icon="wallet-outline"
          title="No wallets yet"
          message="Create a wallet for cash, savings, a church fund, or a business account."
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
          <Card className="py-1">
            {wallets.map((wallet, index) => (
              <View
                key={wallet.id}
                className={index === wallets.length - 1 ? undefined : 'border-b border-line'}
              >
                <WalletRow wallet={wallet} />
              </View>
            ))}
          </Card>
        </ScrollView>
      )}
    </Screen>
  );
}
