import { Ionicons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { WalletForm, type WalletFormValues } from '@/components/wallet/WalletForm';
import { createWallet } from '@/db/queries/wallet';
import { useSessionStore } from '@/stores/sessionStore';
import { useThemeColors } from '@/stores/themeStore';

/**
 * Third onboarding step: the first wallet.
 *
 * Wallets are never seeded, so this step is required — the ledger has nothing
 * to record against until one exists. Every value here is typed by the user.
 */
export default function WalletSetupScreen() {
  const activeUserId = useSessionStore((state) => state.activeUserId);
  const themeColors = useThemeColors();

  if (!activeUserId) {
    return <Redirect href="/(auth)/welcome" />;
  }

  const userId = activeUserId;

  async function handleCreate(values: WalletFormValues) {
    await createWallet({ userId, ...values });
    router.replace('/(tabs)');
  }

  return (
    <SafeAreaView className="flex-1 bg-canvas">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 48, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="h-12 w-12 items-center justify-center rounded-pane border border-line bg-pane">
            <Ionicons name="wallet" size={24} color={themeColors.brand} />
          </View>

          <Text className="mt-5 font-body-bold text-3xl text-ink">Create your first wallet</Text>
          <Text className="mt-2 font-body text-base leading-6 text-ink-muted">
            A wallet is where money lives — cash on hand, a bank account, an e-wallet, or a church
            fund. You can add more later.
          </Text>

          <View className="mt-8">
            <WalletForm submitLabel="Create wallet" onSubmit={handleCreate} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
