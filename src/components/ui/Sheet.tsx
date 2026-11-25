import type { ReactNode } from 'react';
import { Modal as RNModal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type SheetProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  /** Content pinned below a divider, e.g. a Save button. */
  footer?: ReactNode;
};

/** Bottom sheet for pickers and longer forms. */
export function Sheet({ visible, onClose, title, children, footer }: SheetProps) {
  const insets = useSafeAreaInsets();

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/40">
        <Pressable
          className="absolute inset-0"
          accessibilityRole="button"
          accessibilityLabel="Close sheet"
          onPress={onClose}
        />
        <View
          className="rounded-t-3xl bg-surface px-5 pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          <View className="mb-3 h-1 w-10 self-center rounded-full bg-line" />
          {title ? <Text className="mb-3 text-lg font-semibold text-ink">{title}</Text> : null}
          {children}
          {footer ? <View className="mt-4">{footer}</View> : null}
        </View>
      </View>
    </RNModal>
  );
}
