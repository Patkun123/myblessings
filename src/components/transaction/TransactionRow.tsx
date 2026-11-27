import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { AmountText } from '@/components/ui/AmountText';
import type { TransactionWithMeta } from '@/db/queries/transaction';
import { signedCentavos } from '@/domain/transaction';
import { useThemeColors } from '@/stores/themeStore';
import type { IconName } from '@/types/icons';
import { calendarDateLabel } from '@/utils/date';

type TransactionRowProps = {
  transaction: TransactionWithMeta;
  onPress?: () => void;
};

/**
 * One ledger entry: category icon, what it was, where it moved, and a signed
 * amount. Tapping opens the edit sheet when `onPress` is passed, or the detail screen.
 */
export function TransactionRow({ transaction, onPress }: TransactionRowProps) {
  const themeColors = useThemeColors();
  const income = transaction.type === 'income';
  const color = transaction.categoryColor ?? themeColors.inkFaint;
  const icon = (transaction.categoryIcon ?? 'pricetag') as IconName;
  const title =
    transaction.description ?? transaction.categoryName ?? (income ? 'Income' : 'Expense');

  // Only repeat the category when the description is already the title.
  const subtitle = [
    transaction.description ? transaction.categoryName : null,
    transaction.walletName,
    calendarDateLabel(transaction.occurredOn),
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      onPress={() => {
        if (onPress) onPress();
        else router.push({ pathname: '/transaction/[id]', params: { id: transaction.id } });
      }}
      className="flex-row items-center py-3"
      style={({ pressed }) => ({ opacity: pressed ? 0.78 : 1 })}
    >
      <View
        className="h-10 w-10 items-center justify-center rounded-pane border border-line bg-pane"
        style={{ borderColor: `${color}55` }}
      >
        <Ionicons name={icon} size={18} color={color} />
      </View>

      <View className="ml-3 flex-1">
        <Text className="font-body-medium text-[15px] text-ink" numberOfLines={1}>
          {title}
        </Text>
        <Text className="mt-0.5 font-body text-xs text-ink-muted" numberOfLines={1}>
          {subtitle}
        </Text>
      </View>

      <AmountText
        centavos={signedCentavos(income ? 'income' : 'expense', transaction.amountCentavos)}
        tone={income ? 'income' : 'expense'}
      />
    </Pressable>
  );
}
