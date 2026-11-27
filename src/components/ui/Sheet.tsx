import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import {
  Dimensions,
  KeyboardAvoidingView,
  Modal as RNModal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemeColors } from '@/stores/themeStore';

type SheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  headerRight?: ReactNode;
  showClose?: boolean;
  scrollable?: boolean;
  children: ReactNode;
  /** Content pinned below a divider, e.g. a Save button. */
  footer?: ReactNode;
};

/** Bottom sheet for pickers and add/edit forms. */
export function Sheet({
  visible,
  onClose,
  title,
  headerRight,
  showClose = false,
  scrollable = false,
  children,
  footer,
}: SheetProps) {
  const insets = useSafeAreaInsets();
  const themeColors = useThemeColors();
  const maxBodyHeight = Math.round(Dimensions.get('window').height * 0.72);

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        className="flex-1 justify-end bg-black/40 dark:bg-black/60"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable
          className="absolute inset-0"
          accessibilityRole="button"
          accessibilityLabel="Close sheet"
          onPress={onClose}
        />
        <View
          className="rounded-t-[20px] border-t border-line bg-surface px-5 pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 16), maxHeight: '90%' }}
        >
          <View className="mb-3 h-1 w-10 self-center rounded-full bg-line" />
          {title || showClose || headerRight ? (
            <View className="mb-3 flex-row items-center justify-between gap-2">
              {title ? (
                <Text className="flex-1 font-body-bold text-lg text-ink" numberOfLines={1}>
                  {title}
                </Text>
              ) : (
                <View className="flex-1" />
              )}
              {headerRight}
              {showClose ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                  hitSlop={8}
                  onPress={onClose}
                  className="h-9 w-9 items-center justify-center rounded-full"
                >
                  <Ionicons name="close" size={20} color={themeColors.inkMuted} />
                </Pressable>
              ) : null}
            </View>
          ) : null}

          {scrollable ? (
            <ScrollView
              style={{ maxHeight: maxBodyHeight }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {children}
              <View className="h-2" />
            </ScrollView>
          ) : (
            children
          )}

          {footer ? <View className="mt-4">{footer}</View> : null}
        </View>
      </KeyboardAvoidingView>
    </RNModal>
  );
}
