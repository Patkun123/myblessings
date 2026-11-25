import { Ionicons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';

import { TransactionForm, type TransactionFormValues } from '@/components/transaction/TransactionForm';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { colors } from '@/constants/theme';
import { createTransaction } from '@/db/queries/transaction';
import { useWalletBalances } from '@/hooks/useWalletBalances';
import { useSessionStore } from '@/stores/sessionStore';
import { snackbar } from '@/stores/snackbarStore';

/** Records one income or expense. Pushed over the tabs. */
export default function NewTransactionScreen() {
  const activeUserId = useSessionStore((state) => state.activeUserId);
  const { wallets } = useWalletBalances();

  if (!activeUserId) {
    return <Redirect href="/(auth)/welcome" />;
  }

  // Narrowed once so the handlers below can close over plain strings.
  const userId = activeUserId;

  function close() {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/transactions');
  }

  async function handleCreate(values: TransactionFormValues) {
    await createTransaction({ userId, ...values });
    snackbar.show(values.type === 'income' ? 'Income recorded.' : 'Expense recorded.');
    close();
  }

  return (
    <Screen appHeader={false}>
      <View className="flex-row items-center justify-between pb-4 pt-3">
        <Text className="text-2xl font-bold text-ink">New transaction</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={8}
          onPress={close}
          className="h-11 w-11 items-center justify-center rounded-full"
        >
          <Ionicons name="close" size={22} color={colors.inkMuted} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {wallets.length === 0 ? (
            <Card>
              <Text className="text-center text-sm leading-5 text-ink-muted">
                You need a wallet before recording money. Create one — cash on hand, a bank
                account, or an e-wallet.
              </Text>
              <View className="mt-4">
                <Button label="Create wallet" onPress={() => router.replace('/wallet/new')} />
              </View>
            </Card>
          ) : (
            <TransactionForm wallets={wallets} submitLabel="Save transaction" onSubmit={handleCreate} />
          )}

          <View className="h-8" />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
