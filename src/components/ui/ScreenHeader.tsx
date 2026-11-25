import { Text, View } from 'react-native';

type ScreenHeaderProps = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
};

export function ScreenHeader({ title, subtitle, eyebrow }: ScreenHeaderProps) {
  return (
    <View className="pb-4 pt-2">
      {eyebrow ? (
        <Text className="mb-1 text-xs font-semibold uppercase tracking-wider text-brand">
          {eyebrow}
        </Text>
      ) : null}
      <Text className="text-2xl font-bold text-ink">{title}</Text>
      {subtitle ? <Text className="mt-1 text-sm text-ink-muted">{subtitle}</Text> : null}
    </View>
  );
}
