import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, Text, View } from 'react-native';

import { AmountText } from '@/components/ui/AmountText';
import type { WalletBalanceRow } from '@/db/queries/wallet';
import { formatPeso } from '@/domain/money';
import { useThemeColors } from '@/stores/themeStore';
import { calendarDateLabel } from '@/utils/date';

type CapizWindowProps = {
  wallets: WalletBalanceRow[];
  totalCentavos: number;
};

/**
 * Single animated lamplight ramp (exponential ease-out, ~320ms) rising from
 * the bottom edge of a pane in proportion to its share of total positive funds.
 * Displays the wallet's net balance alongside its `wallet + income - expenses`
 * breakdown.
 */
function WalletPane({
  wallet,
  share,
}: {
  wallet: WalletBalanceRow;
  share: number;
}) {
  const themeColors = useThemeColors();
  const negative = wallet.balanceCentavos < 0;
  const isZero = wallet.balanceCentavos === 0;
  const sharePercent = Math.round(share * 100);
  const targetHeightRatio = share > 0 ? Math.max(0.14, Math.min(1, share)) : 0;

  // Lazy state keeps one Animated.Value per pane without reading a ref during render.
  const [animatedHeight] = useState(() => new Animated.Value(targetHeightRatio));

  useEffect(() => {
    Animated.timing(animatedHeight, {
      toValue: targetHeightRatio,
      duration: 320,
      easing: Easing.out(Easing.exp),
      useNativeDriver: false,
    }).start();
  }, [animatedHeight, targetHeightRatio]);

  const entryLabel =
    wallet.transactionCount === 1 ? '1 entry' : `${wallet.transactionCount} entries`;
  const lastMoved = wallet.lastOccurredOn ? calendarDateLabel(wallet.lastOccurredOn) : 'Opening';
  const proofLine = `${entryLabel} · ${lastMoved}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${wallet.name}, ${sharePercent}% share`}
      onPress={() =>
        router.push({ pathname: '/(tabs)/transactions', params: { walletId: wallet.id } })
      }
      className={`relative min-h-[112px] flex-1 justify-between overflow-hidden rounded-pane border border-line bg-pane p-3 ${
        isZero ? 'opacity-75' : ''
      }`}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : isZero ? 0.75 : 1 })}
    >
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: animatedHeight.interpolate({
            inputRange: [0, 1],
            outputRange: ['0%', '100%'],
          }),
        }}
      >
        <LinearGradient
          colors={['transparent', `${themeColors.brand}16`, `${themeColors.brand}38`]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={{ flex: 1 }}
        />
      </Animated.View>

      <View className="flex-row items-center justify-between gap-2">
        <Text className="flex-1 font-body-semibold text-xs text-ink" numberOfLines={1}>
          {wallet.name}
        </Text>
        <Text
          style={{ fontVariant: ['tabular-nums'] }}
          className="font-body-semibold text-[10px] tabular-nums text-ink-muted"
        >
          {sharePercent}%
        </Text>
      </View>

      <View className="mt-1.5">
        <AmountText
          centavos={wallet.balanceCentavos}
          size="md"
          tone={negative ? 'expense' : 'neutral'}
        />

        {/* Wallet + Income - Expenses breakdown */}
        <View className="mt-2 gap-0.5 border-t border-line/70 pt-1.5">
          <View className="flex-row items-center justify-between gap-1">
            <Text className="font-body text-[10px] text-ink-faint">Wallet</Text>
            <Text
              numberOfLines={1}
              style={{ fontVariant: ['tabular-nums'] }}
              className="font-body-medium text-[10px] tabular-nums text-ink-muted"
            >
              {formatPeso(wallet.openingBalanceCentavos)}
            </Text>
          </View>
          <View className="flex-row items-center justify-between gap-1">
            <Text className="font-body text-[10px] text-ink-faint">+ Income</Text>
            <Text
              numberOfLines={1}
              style={{ fontVariant: ['tabular-nums'] }}
              className="font-body-semibold text-[10px] tabular-nums text-income"
            >
              {`+${formatPeso(wallet.incomeCentavos)}`}
            </Text>
          </View>
          <View className="flex-row items-center justify-between gap-1">
            <Text className="font-body text-[10px] text-ink-faint">- Expenses</Text>
            <Text
              numberOfLines={1}
              style={{ fontVariant: ['tabular-nums'] }}
              className="font-body-semibold text-[10px] tabular-nums text-expense"
            >
              {`-${formatPeso(wallet.expenseCentavos)}`}
            </Text>
          </View>
        </View>

        <Text
          style={{ fontVariant: ['tabular-nums'] }}
          className="mt-1.5 font-body text-[10px] tabular-nums text-ink-faint"
          numberOfLines={1}
        >
          {proofLine}
        </Text>
      </View>
    </Pressable>
  );
}

/**
 * The Capiz Window: one rounded hardwood frame holding the ivory/plate
 * Overall Total Wallet transom and a 2-column grid of wallet panes without an
 * inline Add Wallet slot (wallets are added on the Wallets tab).
 */
export function CapizWindow({ wallets, totalCentavos }: CapizWindowProps) {
  const totalEntries = wallets.reduce((sum, wallet) => sum + wallet.transactionCount, 0);
  const positiveTotal = wallets.reduce(
    (sum, wallet) => sum + (wallet.balanceCentavos > 0 ? wallet.balanceCentavos : 0),
    0
  );

  // Build 2-column grid rows for active wallets only (no Add Wallet pane on Home).
  const rows: WalletBalanceRow[][] = [];
  for (let i = 0; i < wallets.length; i += 2) {
    rows.push(wallets.slice(i, i + 2));
  }

  return (
    <View className="rounded-window border border-line bg-surface p-1">
      {/* Transom — the sole plate/ivory field on the screen */}
      <View className="min-h-[88px] justify-between rounded-pane bg-plate px-4 py-3.5">
        <View className="flex-row items-center justify-between">
          <Text
            style={{ fontVariant: ['tabular-nums'] }}
            className="font-body-semibold text-[10px] tracking-label text-plate-ink/70"
          >
            OVERALL TOTAL WALLET
          </Text>
          <View className="flex-row items-center gap-1.5">
            <View className="h-1.5 w-1.5 rounded-full bg-income" />
            <Text className="font-body-medium text-[10px] text-plate-ink/75">
              Saved on device
            </Text>
          </View>
        </View>

        <AmountText centavos={totalCentavos} tone="plate" size="xl" className="mt-1.5" />

        <Text
          style={{ fontVariant: ['tabular-nums'] }}
          className="mt-1 font-body-medium text-xs tabular-nums text-plate-ink/75"
        >
          {`${totalEntries} ${totalEntries === 1 ? 'entry' : 'entries'} · ${wallets.length} ${
            wallets.length === 1 ? 'wallet' : 'wallets'
          }`}
        </Text>
      </View>

      {/* Two-column wallet pane grid with 4px (gap-1) muntin spacing */}
      {rows.length > 0 ? (
        <View className="mt-1 gap-1">
          {rows.map((row, rowIndex) => (
            <View key={rowIndex} className="flex-row gap-1">
              {row.map((wallet) => (
                <WalletPane
                  key={wallet.id}
                  wallet={wallet}
                  share={
                    positiveTotal > 0 && wallet.balanceCentavos > 0
                      ? wallet.balanceCentavos / positiveTotal
                      : 0
                  }
                />
              ))}
              {row.length === 1 && wallets.length > 1 ? <View className="flex-1" /> : null}
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
