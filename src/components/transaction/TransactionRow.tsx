import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { AmountText } from '@/components/ui/AmountText';
import { colors } from '@/constants/theme';
import type { TransactionWithMeta } from '@/db/queries/transaction';
import { signedCentavos } from '@/domain/transaction';
import type { IconName } from '@/types/icons';
import { calendarDateLabel } from '@/utils/date';

type TransactionRowProps = {
  transaction: TransactionWithMeta;
};

/**
 * One ledger entry: category icon, what it was, where it moved, and a signed
 * amount. Tapping opens the detail screen.
 */
export function TransactionRow({ transaction }: TransactionRowProps) {
  const income = transaction.type === 'income';
  const color = transaction.categoryColor ?? colors.inkFaint;
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
      onPress={() =>
        router.push({ pathname: '/transaction/[id]', params: { id: transaction.id } })
      }
      className="flex-row items-center py-3"
    >
      <View
        className="h-10 w-10 items-center justify-center rounded-full"
        style={{ backgroundColor: `${color}1A` }}
      >
        <Ionicons name={icon} size={18} color={color} />
      </View>

      <View className="ml-3 flex-1">
        <Text className="text-base font-medium text-ink" numberOfLines={1}>
          {title}
        </Text>
        <Text className="mt-0.5 text-xs text-ink-muted" numberOfLines={1}>
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
