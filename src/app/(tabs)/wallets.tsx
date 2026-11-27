import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { AmountText } from '@/components/ui/AmountText';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { QuickAddHost } from '@/components/ui/QuickAddHost';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { WalletRow } from '@/components/wallet/WalletRow';
import { WalletSheet } from '@/components/wallet/WalletSheet';
import type { WalletBalanceRow } from '@/db/queries/wallet';
import { sumCentavos } from '@/domain/money';
import { useWalletBalances } from '@/hooks/useWalletBalances';

export default function WalletsScreen() {
  const { wallets } = useWalletBalances();
  const [editingWallet, setEditingWallet] = useState<WalletBalanceRow | null>(null);
  const [addWalletOpen, setAddWalletOpen] = useState(false);

  const totalCentavos = sumCentavos(wallets.map((wallet) => wallet.balanceCentavos));
  const positiveTotal = wallets.reduce(
    (sum, wallet) => sum + (wallet.balanceCentavos > 0 ? wallet.balanceCentavos : 0),
    0
  );

  return (
    <Screen>
      <ScreenHeader
        title="Wallets"
        subtitle="Tap a wallet to edit, view its ledger, or remove it."
      />

      {wallets.length === 0 ? (
        <EmptyState
          icon="wallet-outline"
          title="No wallets yet"
          message="Add cash on hand, a bank account, an e-wallet, or a church fund to start recording."
          action={<Button label="Create wallet" onPress={() => setAddWalletOpen(true)} />}
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 96 }}
        >
          <View className="rounded-window border border-line bg-surface p-1">
            <View className="rounded-pane bg-plate px-4 py-3">
              <Text className="font-body-semibold text-[10px] tracking-label text-plate-ink/70">
                {`TOTAL ACROSS ${wallets.length} ${wallets.length === 1 ? 'WALLET' : 'WALLETS'}`}
              </Text>
              <AmountText centavos={totalCentavos} tone="plate" size="lg" className="mt-1" />
            </View>

            <View className="mt-1 rounded-pane bg-pane px-3.5">
              {wallets.map((wallet, index) => {
                const share =
                  positiveTotal > 0 && wallet.balanceCentavos > 0
                    ? Math.round((wallet.balanceCentavos / positiveTotal) * 100)
                    : 0;
                return (
                  <View
                    key={wallet.id}
                    className={index === wallets.length - 1 ? undefined : 'border-b border-line'}
                  >
                    <WalletRow
                      wallet={wallet}
                      sharePercent={share}
                      onPress={() => setEditingWallet(wallet)}
                    />
                  </View>
                );
              })}
            </View>
          </View>
        </ScrollView>
      )}

      <QuickAddHost hasWallets={wallets.length > 0} />

      <WalletSheet
        visible={editingWallet !== null}
        onClose={() => setEditingWallet(null)}
        wallet={editingWallet}
        canDelete={wallets.length > 1}
      />

      <WalletSheet visible={addWalletOpen} onClose={() => setAddWalletOpen(false)} />
    </Screen>
  );
}
