import { View } from 'react-native';

import { useThemeColors } from '@/stores/themeStore';

type CameMarkProps = {
  active?: boolean;
  color?: string;
  position?: 'top-right' | 'bottom';
};

/**
 * Structural selection/focus mark from the Capiz Window world: a drawn rule
 * and notch so active state never relies on colour alone.
 */
export function CameMark({ active = true, color, position = 'top-right' }: CameMarkProps) {
  const themeColors = useThemeColors();
  if (!active) return null;

  const markColor = color ?? themeColors.brand;

  if (position === 'bottom') {
    return (
      <View pointerEvents="none" className="items-center pt-1">
        <View className="h-[2px] w-5 rounded-full" style={{ backgroundColor: markColor }} />
      </View>
    );
  }

  return (
    <View
      pointerEvents="none"
      className="absolute right-1.5 top-1.5 h-2.5 w-2.5 items-end justify-start"
    >
      <View className="h-[2px] w-2.5 rounded-full" style={{ backgroundColor: markColor }} />
      <View
        className="-mt-[2px] h-2.5 w-[2px] rounded-full"
        style={{ backgroundColor: markColor }}
      />
    </View>
  );
}
