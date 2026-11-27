import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { PickerField } from '@/components/transaction/PickerField';
import { AmountText } from '@/components/ui/AmountText';
import { CameMark } from '@/components/ui/CameMark';
import { Sheet } from '@/components/ui/Sheet';
import type { CategoryOption } from '@/db/queries/category';
import type { WalletBalanceRow } from '@/db/queries/wallet';
import { useThemeColors } from '@/stores/themeStore';
import type { IconName } from '@/types/icons';

export function WalletPickerList({
  wallets,
  value,
  onSelect,
}: {
  wallets: WalletBalanceRow[];
  value: string | null;
  onSelect: (walletId: string) => void;
}) {
  const themeColors = useThemeColors();

  return (
    <View>
      {wallets.map((wallet) => {
        const isSelected = wallet.id === value;

        return (
          <Pressable
            key={wallet.id}
            accessibilityRole="button"
            accessibilityLabel={wallet.name}
            accessibilityState={{ selected: isSelected }}
            onPress={() => onSelect(wallet.id)}
            className="flex-row items-center border-b border-line py-3"
          >
            <View
              className="h-10 w-10 items-center justify-center rounded-full"
              style={{ backgroundColor: `${wallet.color}1A` }}
            >
              <Ionicons name={wallet.icon as IconName} size={20} color={wallet.color} />
            </View>
            <Text className="ml-3 flex-1 text-base text-ink" numberOfLines={1}>
              {wallet.name}
            </Text>
            <AmountText centavos={wallet.balanceCentavos} tone="muted" />
            {isSelected ? (
              <View className="ml-2">
                <Ionicons name="checkmark-circle" size={20} color={themeColors.brand} />
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export function CategoryPickerGrid({
  categories,
  value,
  onSelect,
}: {
  categories: CategoryOption[];
  value: string | null;
  onSelect: (categoryId: string) => void;
}) {
  if (categories.length === 0) {
    return <Text className="py-6 text-center text-sm text-ink-muted">No categories yet.</Text>;
  }

  return (
    <View className="flex-row flex-wrap">
      {categories.map((option) => {
        const isSelected = option.id === value;

        return (
          <Pressable
            key={option.id}
            accessibilityRole="button"
            accessibilityLabel={option.name}
            accessibilityState={{ selected: isSelected }}
            onPress={() => onSelect(option.id)}
            className="w-1/3 items-center px-1 py-3"
          >
            <View
              className={`relative h-12 w-12 items-center justify-center overflow-hidden rounded-pane border ${
                isSelected ? 'border-brand bg-brand-light' : 'border-line bg-pane'
              }`}
            >
              <CameMark active={isSelected} />
              <Ionicons name={option.icon as IconName} size={20} color={option.color} />
            </View>
            <Text
              className={`mt-1.5 text-center text-xs ${
                isSelected ? 'font-body-semibold text-brand' : 'font-body text-ink-muted'
              }`}
              numberOfLines={2}
            >
              {option.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

type WalletPickerProps = {
  wallets: WalletBalanceRow[];
  value: string | null;
  onChange: (walletId: string) => void;
  /** When set, delegates picker presentation to the parent (e.g. inline inside a Sheet). */
  onRequestOpen?: () => void;
};

/** Wallet field + sheet list, showing each wallet's current balance. */
export function WalletPicker({ wallets, value, onChange, onRequestOpen }: WalletPickerProps) {
  const [open, setOpen] = useState(false);
  const selected = wallets.find((wallet) => wallet.id === value) ?? null;

  return (
    <>
      <PickerField
        label="Wallet"
        value={selected?.name ?? null}
        placeholder="Choose a wallet"
        icon={selected ? (selected.icon as IconName) : 'wallet-outline'}
        iconColor={selected?.color}
        onPress={() => {
          if (onRequestOpen) onRequestOpen();
          else setOpen(true);
        }}
      />

      {!onRequestOpen ? (
        <Sheet visible={open} onClose={() => setOpen(false)} title="Wallet">
          <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
            <WalletPickerList
              wallets={wallets}
              value={value}
              onSelect={(id) => {
                onChange(id);
                setOpen(false);
              }}
            />
          </ScrollView>
        </Sheet>
      ) : null}
    </>
  );
}

type CategoryPickerProps = {
  categories: CategoryOption[];
  value: string | null;
  onChange: (categoryId: string) => void;
  /** When set, delegates picker presentation to the parent (e.g. inline inside a Sheet). */
  onRequestOpen?: () => void;
};

/** Category field + a 3-column sheet grid for the selected entry type. */
export function CategoryPicker({
  categories,
  value,
  onChange,
  onRequestOpen,
}: CategoryPickerProps) {
  const [open, setOpen] = useState(false);
  const selected = categories.find((option) => option.id === value) ?? null;

  return (
    <>
      <PickerField
        label="Category"
        value={selected?.name ?? null}
        placeholder="Choose a category"
        icon={selected ? (selected.icon as IconName) : 'pricetag-outline'}
        iconColor={selected?.color}
        onPress={() => {
          if (onRequestOpen) onRequestOpen();
          else setOpen(true);
        }}
      />

      {!onRequestOpen ? (
        <Sheet visible={open} onClose={() => setOpen(false)} title="Category">
          <ScrollView
            style={{ maxHeight: 400 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 8 }}
          >
            <CategoryPickerGrid
              categories={categories}
              value={value}
              onSelect={(id) => {
                onChange(id);
                setOpen(false);
              }}
            />
          </ScrollView>
        </Sheet>
      ) : null}
    </>
  );
}
