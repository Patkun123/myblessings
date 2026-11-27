import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { CameMark } from '@/components/ui/CameMark';
import { Input } from '@/components/ui/Input';
import { MoneyInput } from '@/components/ui/MoneyInput';
import { WALLET_PRESETS, type WalletPreset } from '@/constants/categories';
import { toDecimalString } from '@/domain/money';
import { validateWalletDraft } from '@/domain/wallet';
import { useThemeColors } from '@/stores/themeStore';

export type WalletFormValues = {
  name: string;
  openingBalanceCentavos: number;
  icon: string;
  color: string;
};

export type WalletFormInitial = {
  name: string;
  openingBalanceCentavos: number;
  icon: string;
  color: string;
};

type WalletFormProps = {
  initial?: WalletFormInitial;
  submitLabel: string;
  /** Should throw on failure; the form surfaces the message. */
  onSubmit: (values: WalletFormValues) => Promise<void>;
  onDelete?: () => void;
  deleteDisabled?: boolean;
  deleteHint?: string;
  autoFocus?: boolean;
};

/**
 * Shared wallet form for first-run setup, adding a wallet, and editing/deleting
 * an existing wallet. Owns its own busy/error state so screens and sheets stay thin.
 */
export function WalletForm({
  initial,
  submitLabel,
  onSubmit,
  onDelete,
  deleteDisabled = false,
  deleteHint,
  autoFocus = true,
}: WalletFormProps) {
  const themeColors = useThemeColors();
  const initialPreset =
    (initial ? WALLET_PRESETS.find((option) => option.icon === initial.icon) : undefined) ??
    WALLET_PRESETS[0];

  const [name, setName] = useState(initial?.name ?? '');
  const [openingBalance, setOpeningBalance] = useState(
    initial && initial.openingBalanceCentavos !== 0
      ? toDecimalString(initial.openingBalanceCentavos)
      : ''
  );
  const [preset, setPreset] = useState<WalletPreset>(initialPreset);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    const result = validateWalletDraft({ name, openingBalance });
    if (!result.ok) {
      setError(result.error);
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await onSubmit({
        name: result.name,
        openingBalanceCentavos: result.openingBalanceCentavos,
        icon: preset.icon,
        color: preset.color,
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save this wallet.');
      setBusy(false);
    }
  }

  return (
    <View>
      <Input
        label="Wallet name"
        value={name}
        onChangeText={(text) => {
          setName(text);
          if (error) setError(null);
        }}
        placeholder="Cash, GCash, BPI savings"
        autoCapitalize="words"
        autoFocus={autoFocus}
        returnKeyType="next"
        maxLength={40}
      />

      <View className="mt-4">
        <MoneyInput
          label="Opening balance (optional)"
          value={openingBalance}
          onChangeText={(text) => {
            setOpeningBalance(text);
            if (error) setError(null);
          }}
          onSubmitEditing={handleSubmit}
        />
        <Text className="mt-1.5 text-xs leading-5 text-ink-faint">
          Money already in this wallet before recorded entries. Leave blank for ₱0.00.
        </Text>
      </View>

      <View className="mt-5">
        <Text className="mb-2 font-body-medium text-sm text-ink-muted">Kind</Text>
        <View className="flex-row gap-2">
          {WALLET_PRESETS.map((option) => {
            const selected = option.id === preset.id;
            return (
              <Pressable
                key={option.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={option.label}
                onPress={() => setPreset(option)}
                className={`relative min-h-[64px] flex-1 items-center justify-center overflow-hidden rounded-pane border py-3 ${
                  selected ? 'border-brand bg-brand-light' : 'border-line bg-surface'
                }`}
              >
                <CameMark active={selected} />
                <Ionicons
                  name={option.icon}
                  size={20}
                  color={selected ? themeColors.brand : themeColors.inkFaint}
                />
                <Text
                  className={`mt-1 text-xs ${
                    selected ? 'font-body-semibold text-brand' : 'font-body-medium text-ink-muted'
                  }`}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {error ? <Text className="mt-4 text-sm text-expense">{error}</Text> : null}

      <View className="mt-6">
        <Button label={submitLabel} size="lg" loading={busy} onPress={handleSubmit} />
      </View>

      {onDelete ? (
        <View className="mt-4 items-center">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Delete wallet"
            disabled={deleteDisabled || busy}
            onPress={onDelete}
            className="items-center py-3"
            style={{ opacity: deleteDisabled || busy ? 0.45 : 1 }}
          >
            <Text className="text-sm font-semibold text-expense">Delete wallet</Text>
          </Pressable>
          {deleteDisabled && deleteHint ? (
            <Text className="text-center text-xs text-ink-faint">{deleteHint}</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
