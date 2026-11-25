import { Ionicons } from '@expo/vector-icons';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';

import {
  TransactionForm,
  type TransactionFormInitial,
  type TransactionFormValues,
} from '@/components/transaction/TransactionForm';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import {
  restoreTransaction,
  softDeleteTransaction,
  updateTransaction,
} from '@/db/queries/transaction';
import { useTransaction } from '@/hooks/useTransaction';
import { useWalletBalances } from '@/hooks/useWalletBalances';
import { useSessionStore } from '@/stores/sessionStore';
import { snackbar } from '@/stores/snackbarStore';
import { useThemeColors } from '@/stores/themeStore';

/** Detail screen: edit an entry, or delete it with an undo window. */
export default function TransactionDetailScreen() {
  const activeUserId = useSessionStore((state) => state.activeUserId);
  const { wallets } = useWalletBalances();
  const { id } = useLocalSearchParams<{ id: string }>();
  const transaction = useTransaction(id);
  const themeColors = useThemeColors();

  if (!activeUserId) {
    return <Redirect href="/(auth)/welcome" />;
  }

  function close() {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/transactions');
  }

  if (!transaction) {
    return (
      <Screen appHeader={false}>
        <View className="flex-row items-center justify-between pb-4 pt-3">
          <Text className="text-2xl font-bold text-ink">Transaction</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            hitSlop={8}
            onPress={close}
            className="h-11 w-11 items-center justify-center rounded-full"
          >
            <Ionicons name="close" size={22} color={themeColors.inkMuted} />
          </Pressable>
        </View>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-base font-semibold text-ink">
            This transaction is not available
          </Text>
          <Text className="mt-1.5 text-center text-sm text-ink-muted">
            It may have been deleted.
          </Text>
          <View className="mt-6 w-full max-w-xs">
            <Button label="Back to transactions" onPress={close} />
          </View>
        </View>
      </Screen>
    );
  }

  const initial: TransactionFormInitial = {
    type: transaction.type === 'income' ? 'income' : 'expense',
    amountCentavos: transaction.amountCentavos,
    walletId: transaction.walletId,
    categoryId: transaction.categoryId,
    occurredOn: transaction.occurredOn,
    description: transaction.description,
    note: transaction.note,
  };

  // Captured after the guard so the handlers close over non-null values.
  const userId = activeUserId;
  const entry = transaction;

  async function handleSave(values: TransactionFormValues) {
    await updateTransaction(entry.id, { userId, ...values });
    snackbar.show('Transaction updated.');
    close();
  }

  function handleDelete() {
    void (async () => {
      await softDeleteTransaction(userId, entry.id);
      snackbar.show('Transaction deleted.', {
        action: {
          label: 'Undo',
          onPress: () => {
            void restoreTransaction(userId, entry.id);
          },
        },
      });
      close();
    })();
  }

  return (
    <Screen appHeader={false}>
      <View className="flex-row items-center justify-between pb-4 pt-3">
        <Text className="text-2xl font-bold text-ink">Transaction</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={8}
          onPress={close}
          className="h-11 w-11 items-center justify-center rounded-full"
        >
          <Ionicons name="close" size={22} color={themeColors.inkMuted} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <TransactionForm
            wallets={wallets}
            initial={initial}
            submitLabel="Save changes"
            onSubmit={handleSave}
            onDelete={handleDelete}
          />
          <View className="h-8" />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
