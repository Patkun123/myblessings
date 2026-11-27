import { useColorScheme } from 'nativewind';
import { useCallback, useEffect, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { darkColors, lightColors } from '@/constants/theme';
import { useSnackbarStore } from '@/stores/snackbarStore';
import { useThemeColors } from '@/stores/themeStore';

/**
 * Renders the current snackbar above the tab bar. Mounted once in the root
 * layout; every screen talks to it through `useSnackbarStore`.
 */
export function SnackbarHost() {
  const current = useSnackbarStore((state) => state.current);
  const dismiss = useSnackbarStore((state) => state.dismiss);
  const insets = useSafeAreaInsets();
  const themeColors = useThemeColors();
  const { colorScheme } = useColorScheme();
  const actionColor = colorScheme === 'light' ? darkColors.brand : lightColors.brand;

  // Lazy state keeps one Animated.Value per component without reading a ref
  // during render (react-hooks/refs).
  const [opacity] = useState(() => new Animated.Value(0));
  const [translateY] = useState(() => new Animated.Value(16));

  const hide = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 16, duration: 150, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) dismiss();
    });
  }, [dismiss, opacity, translateY]);

  useEffect(() => {
    if (!current) return;

    opacity.setValue(0);
    translateY.setValue(16);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start();

    const timer = setTimeout(hide, current.durationMs);
    return () => clearTimeout(timer);
  }, [current, hide, opacity, translateY]);

  if (!current) return null;

  return (
    <View
      pointerEvents="box-none"
      className="absolute inset-x-0"
      style={{ bottom: insets.bottom + 72 }}
    >
      <Animated.View style={{ opacity, transform: [{ translateY }] }}>
        <View
          style={{ backgroundColor: themeColors.plate, borderColor: themeColors.line }}
          className="mx-5 flex-row items-center gap-3 rounded-pane border px-4 py-3"
        >
          <Text className="flex-1 font-body text-sm text-plate-ink" numberOfLines={2}>
            {current.message}
          </Text>
          {current.action ? (
            <Pressable
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => {
                current.action?.onPress();
                hide();
              }}
            >
              <Text style={{ color: actionColor }} className="font-body-semibold text-sm">
                {current.action.label}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </Animated.View>
    </View>
  );
}
