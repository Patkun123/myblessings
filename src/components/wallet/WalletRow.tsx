import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { AmountText } from '@/components/ui/AmountText';
import type { WalletBalanceRow } from '@/db/queries/wallet';
import type { IconName } from '@/types/icons';
import { calendarDateLabel } from '@/utils/date';

type WalletRowProps = {
  wallet: WalletBalanceRow;
  sharePercent?: number;
  onPress?: () => void;
};

export function WalletRow({ wallet, sharePercent, onPress }: WalletRowProps) {
  const negative = wallet.balanceCentavos < 0;
  const entryLabel =
    wallet.transactionCount === 1 ? '1 entry' : `${wallet.transactionCount} entries`;
  const lastMoved = wallet.lastOccurredOn ? calendarDateLabel(wallet.lastOccurredOn) : 'Opening';
  const subtitle =
    sharePercent !== undefined
      ? `${entryLabel} · ${lastMoved} · ${sharePercent}%`
      : `${entryLabel} · ${lastMoved}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={wallet.name}
      onPress={() => {
        if (onPress) onPress();
        else router.push({ pathname: '/(tabs)/transactions', params: { walletId: wallet.id } });
      }}
      className="flex-row items-center py-3"
      style={({ pressed }) => ({ opacity: pressed ? 0.78 : 1 })}
    >
      <View
        className="h-10 w-10 items-center justify-center rounded-pane border border-line bg-pane"
        style={{ borderColor: `${wallet.color}55` }}
      >
        <Ionicons name={wallet.icon as IconName} size={19} color={wallet.color} />
      </View>
      <View className="ml-3 flex-1">
        <Text className="font-body-semibold text-base text-ink" numberOfLines={1}>
          {wallet.name}
        </Text>
        <Text
          style={{ fontVariant: ['tabular-nums'] }}
          className="font-body text-xs tabular-nums text-ink-muted"
          numberOfLines={1}
        >
          {subtitle}
        </Text>
      </View>
      <AmountText centavos={wallet.balanceCentavos} tone={negative ? 'expense' : 'neutral'} />
    </Pressable>
  );
}
