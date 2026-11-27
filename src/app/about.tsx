import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Screen } from '@/components/ui/Screen';
import { useThemeColors } from '@/stores/themeStore';

const DEVELOPER_NAME = 'Patrick G. Fabular';

/** Application identity, version, and developer information. */
export default function AboutScreen() {
  const themeColors = useThemeColors();

  const appName = Constants.expoConfig?.name ?? 'MyBlessings';
  const rawVersion = Constants.expoConfig?.version ?? '1.0.1';
  const appVersion = `${rawVersion} (Beta)`;

  function close() {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  }

  return (
    <Screen appHeader={false}>
      <View className="flex-row items-center justify-between pb-4 pt-3">
        <Text className="font-body-bold text-2xl text-ink">About</Text>
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Identity banner */}
        <Card className="items-center py-6">
          <View className="h-14 w-14 items-center justify-center rounded-pane bg-brand">
            <Ionicons name="heart" size={28} color={themeColors.brandInk} />
          </View>
          <Text className="mt-3 font-body-bold text-xl text-ink">{appName}</Text>
          <Text className="mt-1 text-center font-body text-xs text-ink-muted">
            Offline-first Philippine Peso ledger
          </Text>
        </Card>

        {/* Application metadata */}
        <Text className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wider text-ink-faint">
          Application Details
        </Text>
        <Card>
          <View className="flex-row items-center pb-3">
            <View className="h-9 w-9 items-center justify-center rounded-full bg-canvas">
              <Ionicons name="apps-outline" size={18} color={themeColors.inkMuted} />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-xs font-medium text-ink-muted">Application Name</Text>
              <Text className="mt-0.5 text-base font-semibold text-ink">{appName}</Text>
            </View>
          </View>

          <View className="flex-row items-center border-t border-line py-3">
            <View className="h-9 w-9 items-center justify-center rounded-full bg-canvas">
              <Ionicons name="pricetag-outline" size={18} color={themeColors.inkMuted} />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-xs font-medium text-ink-muted">Application Version</Text>
              <Text
                style={{ fontVariant: ['tabular-nums'] }}
                className="mt-0.5 text-base font-semibold tabular-nums text-ink"
              >
                {appVersion}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center border-t border-line pt-3">
            <View className="h-9 w-9 items-center justify-center rounded-full bg-canvas">
              <Ionicons name="person-outline" size={18} color={themeColors.inkMuted} />
            </View>
            <View className="ml-3 flex-1">
              <Text className="text-xs font-medium text-ink-muted">Developer</Text>
              <Text className="mt-0.5 text-base font-semibold text-ink">{DEVELOPER_NAME}</Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </Screen>
  );
}
