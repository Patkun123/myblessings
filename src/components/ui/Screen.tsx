import type { ReactNode } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/components/ui/AppHeader';

type ScreenProps = {
  children: ReactNode;
  /** Horizontal padding. Disable for full-bleed lists. */
  padded?: boolean;
  /** Show the app bar with the product name. Off for sub-screens with their own. */
  appHeader?: boolean;
  className?: string;
};

/**
 * Standard page container: canvas background, top safe area, and the persistent
 * app bar. The header lives inside the safe area but outside `children`, so
 * screens can scroll without losing it.
 */
export function Screen({ children, padded = true, appHeader = true, className }: ScreenProps) {
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-canvas">
      {appHeader ? <AppHeader /> : null}
      <View className={`flex-1 ${padded ? 'px-5' : ''} ${className ?? ''}`}>{children}</View>
    </SafeAreaView>
  );
}
