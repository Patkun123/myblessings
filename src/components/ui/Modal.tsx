import type { ReactNode } from 'react';
import { Modal as RNModal, Pressable, Text, View } from 'react-native';

type ModalProps = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  children?: ReactNode;
  footer?: ReactNode;
  /** Set false for flows that must not be dismissed by tapping outside. */
  dismissable?: boolean;
};

/** Centered dialog for confirmations and short forms. */
export function Modal({
  visible,
  onClose,
  title,
  message,
  children,
  footer,
  dismissable = true,
}: ModalProps) {
  return (
    <RNModal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1 items-center justify-center bg-black/40 px-6 dark:bg-black/60">
        <Pressable
          className="absolute inset-0"
          accessibilityRole="button"
          accessibilityLabel="Close dialog"
          onPress={dismissable ? onClose : undefined}
          disabled={!dismissable}
        />
        <View className="w-full max-w-sm rounded-window border border-line bg-surface p-5">
          {title ? <Text className="font-body-bold text-lg text-ink">{title}</Text> : null}
          {message ? (
            <Text className="mt-1.5 font-body text-sm leading-5 text-ink-muted">{message}</Text>
          ) : null}
          {children ? <View className="mt-4">{children}</View> : null}
          {footer ? <View className="mt-5 gap-2">{footer}</View> : null}
        </View>
      </View>
    </RNModal>
  );
}
