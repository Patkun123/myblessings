import { Ionicons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';

import { Screen } from '@/components/ui/Screen';
import { WalletForm, type WalletFormValues } from '@/components/wallet/WalletForm';
import { createWallet } from '@/db/queries/wallet';
import { useSessionStore } from '@/stores/sessionStore';
import { useThemeColors } from '@/stores/themeStore';

/** Adds another wallet after onboarding. Pushed over the tabs. */
export default function NewWalletScreen() {
  const activeUserId = useSessionStore((state) => state.activeUserId);
  const themeColors = useThemeColors();

  if (!activeUserId) {
    return <Redirect href="/(auth)/welcome" />;
  }

  async function handleCreate(values: WalletFormValues) {
    if (!activeUserId) return;
    await createWallet({ userId: activeUserId, ...values });
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/wallets');
  }

  return (
    <Screen appHeader={false}>
      <View className="flex-row items-center justify-between pb-4 pt-3">
        <Text className="font-body-bold text-2xl text-ink">New wallet</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={8}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/wallets'))}
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
          <WalletForm submitLabel="Add wallet" onSubmit={handleCreate} />
          <View className="h-8" />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
