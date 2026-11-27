import { Text, View } from 'react-native';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
};

export function ScreenHeader({ title, subtitle }: ScreenHeaderProps) {
  return (
    <View className="pb-4 pt-3">
      <Text className="font-body-bold text-2xl tracking-tight text-ink">{title}</Text>
      {subtitle ? <Text className="mt-1 font-body text-sm text-ink-muted">{subtitle}</Text> : null}
    </View>
  );
}
