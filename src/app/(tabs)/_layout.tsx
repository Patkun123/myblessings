import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';

import { useSessionStore } from '@/stores/sessionStore';
import { useThemeColors } from '@/stores/themeStore';

/** Tab tint arrives as ColorValue; our tokens are always strings. */
function resolveColor(color: ColorValue, fallback: string): string {
  return typeof color === 'string' ? color : fallback;
}

export default function TabsLayout() {
  const activeUserId = useSessionStore((state) => state.activeUserId);
  const themeColors = useThemeColors();

  if (!activeUserId) {
    return <Redirect href="/(auth)/welcome" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: themeColors.brand,
        tabBarInactiveTintColor: themeColors.inkFaint,
        tabBarStyle: {
          backgroundColor: themeColors.surface,
          borderTopColor: themeColors.line,
        },
        tabBarLabelStyle: {
          fontFamily: 'Archivo_600SemiBold',
          fontSize: 11,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="home-outline"
              size={size}
              color={resolveColor(color, themeColors.inkFaint)}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="swap-vertical-outline"
              size={size}
              color={resolveColor(color, themeColors.inkFaint)}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="wallets"
        options={{
          title: 'Wallets',
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="wallet-outline"
              size={size}
              color={resolveColor(color, themeColors.inkFaint)}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="budgets"
        options={{
          title: 'Budgets',
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="pie-chart-outline"
              size={size}
              color={resolveColor(color, themeColors.inkFaint)}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="document-text-outline"
              size={size}
              color={resolveColor(color, themeColors.inkFaint)}
            />
          ),
        }}
      />
    </Tabs>
  );
}
