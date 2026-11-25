import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { FAB } from '@/components/ui/FAB';
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
          message="Add cash on hand, a bank account, or an e-wallet to start recording."
          action={<Button label="Create wallet" onPress={() => router.push('/wallet/new')} />}
        />
      ) : (
        <>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 96 }}
          >
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

          <FAB icon="add" label="Add wallet" onPress={() => router.push('/wallet/new')} />
        </>
      )}
    </Screen>
  );
}
