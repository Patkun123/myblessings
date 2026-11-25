import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { MoneyInput } from '@/components/ui/MoneyInput';
import { WALLET_PRESETS, type WalletPreset } from '@/constants/categories';
import { colors } from '@/constants/theme';
import { validateWalletDraft } from '@/domain/wallet';

export type WalletFormValues = {
  name: string;
  openingBalanceCentavos: number;
  icon: string;
  color: string;
};

type WalletFormProps = {
  submitLabel: string;
  /** Should throw on failure; the form surfaces the message. */
  onSubmit: (values: WalletFormValues) => Promise<void>;
  autoFocus?: boolean;
};

/**
 * Shared wallet form for first-run setup and "add another wallet".
 * Owns its own busy/error state so screens stay thin.
 */
export function WalletForm({ submitLabel, onSubmit, autoFocus = true }: WalletFormProps) {
  const [name, setName] = useState('');
  const [openingBalance, setOpeningBalance] = useState('');
  const [preset, setPreset] = useState<WalletPreset>(WALLET_PRESETS[0]);
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
          Money already in this wallet today. Leave blank to start at ₱0.00.
        </Text>
      </View>

      <View className="mt-5">
        <Text className="mb-2 text-sm font-medium text-ink-muted">Kind</Text>
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
                className={`flex-1 items-center rounded-xl border py-3 ${
                  selected ? 'border-brand bg-brand-light' : 'border-line bg-surface'
                }`}
              >
                <Ionicons
                  name={option.icon}
                  size={20}
                  color={selected ? colors.brand : colors.inkFaint}
                />
                <Text
                  className={`mt-1 text-xs font-medium ${
                    selected ? 'text-brand' : 'text-ink-muted'
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
    </View>
  );
}
