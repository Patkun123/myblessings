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
      <View className="mb-4 h-14 w-14 items-center justify-center rounded-pane border border-line bg-pane">
        <Ionicons name={icon} size={26} color={themeColors.brand} />
      </View>
      <Text className="text-center font-body-bold text-lg text-ink">{title}</Text>
      <Text className="mt-1.5 max-w-xs text-center font-body text-sm leading-5 text-ink-muted">
        {message}
      </Text>
      {action ? <View className="mt-6 w-full max-w-xs">{action}</View> : null}
    </View>
  );
}
