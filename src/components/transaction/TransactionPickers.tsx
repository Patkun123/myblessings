import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { AmountText } from '@/components/ui/AmountText';
import { Sheet } from '@/components/ui/Sheet';
import { PickerField } from '@/components/transaction/PickerField';
import type { CategoryOption } from '@/db/queries/category';
import type { WalletBalanceRow } from '@/db/queries/wallet';
import { useThemeColors } from '@/stores/themeStore';
import type { IconName } from '@/types/icons';

type WalletPickerProps = {
  wallets: WalletBalanceRow[];
  value: string | null;
  onChange: (walletId: string) => void;
};

/** Wallet field + sheet list, showing each wallet's current balance. */
export function WalletPicker({ wallets, value, onChange }: WalletPickerProps) {
  const [open, setOpen] = useState(false);
  const themeColors = useThemeColors();
  const selected = wallets.find((wallet) => wallet.id === value) ?? null;

  return (
    <>
      <PickerField
        label="Wallet"
        value={selected?.name ?? null}
        placeholder="Choose a wallet"
        icon={selected ? (selected.icon as IconName) : 'wallet-outline'}
        iconColor={selected?.color}
        onPress={() => setOpen(true)}
      />

      <Sheet visible={open} onClose={() => setOpen(false)} title="Wallet">
        <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
          {wallets.map((wallet) => {
            const isSelected = wallet.id === value;

            return (
              <Pressable
                key={wallet.id}
                accessibilityRole="button"
                accessibilityLabel={wallet.name}
                accessibilityState={{ selected: isSelected }}
                onPress={() => {
                  onChange(wallet.id);
                  setOpen(false);
                }}
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
        </ScrollView>
      </Sheet>
    </>
  );
}

type CategoryPickerProps = {
  categories: CategoryOption[];
  value: string | null;
  onChange: (categoryId: string) => void;
};

/** Category field + a 3-column sheet grid for the selected entry type. */
export function CategoryPicker({ categories, value, onChange }: CategoryPickerProps) {
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
        onPress={() => setOpen(true)}
      />

      <Sheet visible={open} onClose={() => setOpen(false)} title="Category">
        {categories.length === 0 ? (
          <Text className="py-6 text-center text-sm text-ink-muted">No categories yet.</Text>
        ) : (
          <ScrollView
            style={{ maxHeight: 400 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 8 }}
          >
            <View className="flex-row flex-wrap">
              {categories.map((option) => {
                const isSelected = option.id === value;

                return (
                  <Pressable
                    key={option.id}
                    accessibilityRole="button"
                    accessibilityLabel={option.name}
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => {
                      onChange(option.id);
                      setOpen(false);
                    }}
                    className="w-1/3 items-center px-1 py-3"
                  >
                    <View
                      className={`h-11 w-11 items-center justify-center rounded-full ${
                        isSelected ? 'border-2 border-brand' : ''
                      }`}
                      style={{ backgroundColor: `${option.color}1A` }}
                    >
                      <Ionicons name={option.icon as IconName} size={20} color={option.color} />
                    </View>
                    <Text
                      className={`mt-1 text-center text-xs ${
                        isSelected ? 'font-semibold text-brand' : 'text-ink-muted'
                      }`}
                      numberOfLines={2}
                    >
                      {option.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>
        )}
      </Sheet>
    </>
  );
}
