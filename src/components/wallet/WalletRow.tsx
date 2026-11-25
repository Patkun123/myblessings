import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import { AmountText } from '@/components/ui/AmountText';
import type { WalletBalanceRow } from '@/db/queries/wallet';
import type { IconName } from '@/types/icons';

type WalletRowProps = {
  wallet: WalletBalanceRow;
};

export function WalletRow({ wallet }: WalletRowProps) {
  const negative = wallet.balanceCentavos < 0;

  return (
    <View className="flex-row items-center py-3">
      <View
        className="h-10 w-10 items-center justify-center rounded-full"
        style={{ backgroundColor: `${wallet.color}1A` }}
      >
        <Ionicons name={wallet.icon as IconName} size={20} color={wallet.color} />
      </View>
      <View className="ml-3 flex-1">
        <Text className="text-base font-medium text-ink" numberOfLines={1}>
          {wallet.name}
        </Text>
        <Text className="text-xs text-ink-muted">
          {wallet.transactionCount === 1 ? '1 entry' : `${wallet.transactionCount} entries`}
        </Text>
      </View>
      <AmountText centavos={wallet.balanceCentavos} tone={negative ? 'expense' : 'neutral'} />
    </View>
  );
}
