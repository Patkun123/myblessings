import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Image, Text, View } from 'react-native';

import { useThemeColors } from '@/stores/themeStore';

type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

const SIZE_CLASSES: Record<AvatarSize, { box: string; text: string; icon: number }> = {
  sm: { box: 'h-9 w-9', text: 'text-sm', icon: 16 },
  md: { box: 'h-11 w-11', text: 'text-base', icon: 20 },
  lg: { box: 'h-14 w-14', text: 'text-xl', icon: 24 },
  xl: { box: 'h-20 w-20', text: 'text-2xl', icon: 32 },
};

type AvatarProps = {
  uri?: string | null;
  name?: string | null;
  size?: AvatarSize;
};

/** Circular profile avatar with image support and initials/icon fallback. */
export function Avatar({ uri, name, size = 'md' }: AvatarProps) {
  const themeColors = useThemeColors();
  const [failedUri, setFailedUri] = useState<string | null>(null);

  const dims = SIZE_CLASSES[size];
  const initial = name?.trim().charAt(0).toUpperCase();
  const failed = Boolean(uri && failedUri === uri);

  if (uri && !failed) {
    return (
      <View className={`${dims.box} overflow-hidden rounded-full border border-line bg-brand-light`}>
        <Image
          source={{ uri }}
          className="h-full w-full"
          resizeMode="cover"
          onError={() => setFailedUri(uri)}
          accessibilityLabel={name ? `${name} profile photo` : 'Profile photo'}
        />
      </View>
    );
  }

  return (
    <View
      className={`${dims.box} items-center justify-center rounded-full border border-line bg-brand-light`}
    >
      {initial ? (
        <Text className={`${dims.text} font-bold text-brand`}>{initial}</Text>
      ) : (
        <Ionicons name="person" size={dims.icon} color={themeColors.brand} />
      )}
    </View>
  );
}
