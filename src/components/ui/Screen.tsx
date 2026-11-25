import type { ReactNode } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ScreenProps = {
  children: ReactNode;
  /** Horizontal padding. Disable for full-bleed lists. */
  padded?: boolean;
  className?: string;
};

/** Standard page container: canvas background + top safe area. */
export function Screen({ children, padded = true, className }: ScreenProps) {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      <View className={`flex-1 ${padded ? 'px-5' : ''} ${className ?? ''}`}>{children}</View>
    </SafeAreaView>
  );
}
