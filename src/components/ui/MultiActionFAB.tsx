import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { useEffect, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';

import { useThemeColors } from '@/stores/themeStore';
import type { IconName } from '@/types/icons';

type MultiActionFABProps = {
  onAddExpense: () => void;
  onAddIncome: () => void;
  onAddWallet: () => void;
};

type MenuAction = {
  id: 'expense' | 'income' | 'wallet';
  label: string;
  icon: IconName;
  accentColor: string;
  onPress: () => void;
};

/**
 * Single floating `+` trigger that opens a Capiz-styled speed-dial pop-up menu:
 * `surface` label pills on the left paired with `pane` circular buttons tinted
 * with our semantic palette (`expense`, `income`, `brand`), centered above the
 * primary lamplight `+` / `×` FAB.
 */
export function MultiActionFAB({
  onAddExpense,
  onAddIncome,
  onAddWallet,
}: MultiActionFABProps) {
  const [open, setOpen] = useState(false);
  const themeColors = useThemeColors();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme !== 'light';
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(progress, {
      toValue: open ? 1 : 0,
      duration: 200,
      easing: Easing.out(Easing.exp),
      useNativeDriver: true,
    }).start();
  }, [open, progress]);

  const actions: MenuAction[] = [
    {
      id: 'wallet',
      label: 'Add Wallet',
      icon: 'wallet-outline',
      accentColor: themeColors.brand,
      onPress: () => {
        setOpen(false);
        onAddWallet();
      },
    },
    {
      id: 'income',
      label: 'Add Income',
      icon: 'arrow-down-outline',
      accentColor: themeColors.income,
      onPress: () => {
        setOpen(false);
        onAddIncome();
      },
    },
    {
      id: 'expense',
      label: 'Add Expense',
      icon: 'arrow-up-outline',
      accentColor: themeColors.expense,
      onPress: () => {
        setOpen(false);
        onAddExpense();
      },
    },
  ];

  const rotate = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  const menuTranslateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [12, 0],
  });

  // Warm hardwood scrim rather than cold black.
  const scrimColor = isDark ? 'rgba(17, 13, 11, 0.72)' : 'rgba(36, 28, 22, 0.42)';

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      {open ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close quick add menu"
          onPress={() => setOpen(false)}
          style={[StyleSheet.absoluteFill, { backgroundColor: scrimColor }]}
        />
      ) : null}

      {open ? (
        <Animated.View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            bottom: 88,
            right: 20,
            alignItems: 'flex-end',
            gap: 12,
            opacity: progress,
            transform: [{ translateY: menuTranslateY }],
          }}
        >
          {actions.map((action) => (
            <Pressable
              key={action.id}
              accessibilityRole="button"
              accessibilityLabel={action.label}
              onPress={action.onPress}
              className="min-h-[44px] flex-row items-center gap-3"
              style={({ pressed }) => ({
                opacity: pressed ? 0.86 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
              })}
            >
              <View
                className="rounded-pane border border-line bg-surface px-3.5 py-2"
                style={{
                  shadowColor: themeColors.canvas,
                  shadowOpacity: 0.28,
                  shadowRadius: 6,
                  shadowOffset: { width: 0, height: 3 },
                  elevation: 4,
                }}
              >
                <Text className="font-body-semibold text-xs text-ink">{action.label}</Text>
              </View>

              <View className="w-[52px] items-center">
                <View
                  className="h-11 w-11 items-center justify-center rounded-full border bg-pane"
                  style={{
                    borderColor: action.accentColor,
                    shadowColor: themeColors.canvas,
                    shadowOpacity: 0.28,
                    shadowRadius: 6,
                    shadowOffset: { width: 0, height: 3 },
                    elevation: 5,
                  }}
                >
                  <Ionicons name={action.icon} size={20} color={action.accentColor} />
                </View>
              </View>
            </Pressable>
          ))}
        </Animated.View>
      ) : null}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={open ? 'Close add menu' : 'Open add menu'}
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen((prev) => !prev)}
        className={`absolute bottom-6 right-5 h-[52px] w-[52px] items-center justify-center rounded-full border ${
          open ? 'border-line bg-surface' : 'border-brand-dark/25 bg-brand'
        }`}
        style={({ pressed }) => ({
          opacity: pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }],
          shadowColor: themeColors.canvas,
          shadowOpacity: 0.32,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 5 },
          elevation: 6,
        })}
      >
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Ionicons
            name="add"
            size={24}
            color={open ? themeColors.ink : themeColors.brandInk}
          />
        </Animated.View>
      </Pressable>
    </View>
  );
}
