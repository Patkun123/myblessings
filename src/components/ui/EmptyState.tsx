import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { useThemeColors } from '@/stores/themeStore';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

type EmptyStateProps = {
  icon: IconName;
  title: string;
  message: string;
  action?: ReactNode;
};

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  const themeColors = useThemeColors();

  return (
    <View className="flex-1 items-center justify-center px-6 py-12">
      <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-brand-light">
        <Ionicons name={icon} size={28} color={themeColors.brand} />
      </View>
      <Text className="text-center text-lg font-semibold text-ink">{title}</Text>
      <Text className="mt-1.5 text-center text-sm leading-5 text-ink-muted">{message}</Text>
      {action ? <View className="mt-6 w-full max-w-xs">{action}</View> : null}
    </View>
  );
}
