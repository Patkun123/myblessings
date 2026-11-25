import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { CategoryPicker, WalletPicker } from '@/components/transaction/TransactionPickers';
import { TypeToggle } from '@/components/transaction/TypeToggle';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { WalletBalanceRow } from '@/db/queries/wallet';
import { sanitizeAmountInput, toDecimalString } from '@/domain/money';
import {
  TRANSACTION_DESCRIPTION_MAX,
  TRANSACTION_NOTE_MAX,
  validateTransactionDraft,
  type TransactionKind,
} from '@/domain/transaction';
import { useCategories } from '@/hooks/useCategories';
import { useThemeColors } from '@/stores/themeStore';
import { todayCalendarDate, yesterdayCalendarDate } from '@/utils/date';

export type TransactionFormValues = {
  type: TransactionKind;
  amountCentavos: number;
  walletId: string;
  categoryId: string;
  occurredOn: string;
  description: string | null;
  note: string | null;
};

export type TransactionFormInitial = {
  type: TransactionKind;
  amountCentavos: number;
  walletId: string;
  categoryId: string | null;
  occurredOn: string;
  description: string | null;
  note: string | null;
};

type TransactionFormProps = {
  wallets: WalletBalanceRow[];
  /** Present when editing an existing entry. */
  initial?: TransactionFormInitial;
  submitLabel: string;
  onSubmit: (values: TransactionFormValues) => Promise<void>;
  onDelete?: () => void;
};

type DateChipProps = {
  label: string;
  active: boolean;
  onPress: () => void;
};

function DateChip({ label, active, onPress }: DateChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      className={`rounded-full border px-3.5 py-1.5 ${
        active ? 'border-brand bg-brand-light' : 'border-line bg-surface'
      }`}
    >
      <Text className={`text-xs font-semibold ${active ? 'text-brand' : 'text-ink-muted'}`}>
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * Shared create/edit form.
 *
 * Category choices follow the selected type, so an income entry can never be
 * filed under an expense category. Validation runs on submit and the parent
 * only navigates after the write succeeds.
 */
export function TransactionForm({
  wallets,
  initial,
  submitLabel,
  onSubmit,
  onDelete,
}: TransactionFormProps) {
  const themeColors = useThemeColors();
  const today = todayCalendarDate();
  const yesterday = yesterdayCalendarDate();

  const [type, setType] = useState<TransactionKind>(initial?.type ?? 'expense');
  const [amount, setAmount] = useState(
    initial ? toDecimalString(initial.amountCentavos) : ''
  );
  const [walletId, setWalletId] = useState<string | null>(
    initial?.walletId ?? wallets[0]?.id ?? null
  );
  const [categoryId, setCategoryId] = useState<string | null>(initial?.categoryId ?? null);
  const [occurredOn, setOccurredOn] = useState(initial?.occurredOn ?? today);
  const [description, setDescription] = useState(initial?.description ?? '');
  const [note, setNote] = useState(initial?.note ?? '');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const { categories } = useCategories(type);
  const selectedCategory = categories.find((option) => option.id === categoryId) ?? null;

  function clearError() {
    if (error) setError(null);
  }

  function handleTypeChange(next: TransactionKind) {
    setType(next);
    // Categories are type-scoped; a previously chosen one is no longer valid.
    setCategoryId(null);
    clearError();
  }

  async function handleSubmit() {
    const result = validateTransactionDraft({
      type,
      amount,
      walletId,
      categoryId,
      categoryType: selectedCategory?.type ?? null,
      occurredOn,
      description,
      note,
    });

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await onSubmit(result.values);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save this entry.');
      setBusy(false);
    }
  }

  return (
    <View>
      <TypeToggle value={type} onChange={handleTypeChange} />

      <View
        className={`mt-4 flex-row items-center justify-center rounded-2xl border bg-surface px-4 py-3 ${
          error ? 'border-expense' : 'border-line'
        }`}
      >
        <Text className="mr-1 text-3xl font-semibold text-ink-faint">₱</Text>
        <TextInput
          value={amount}
          onChangeText={(text) => {
            setAmount(sanitizeAmountInput(text));
            clearError();
          }}
          placeholder="0.00"
          placeholderTextColor={themeColors.inkFaint}
          keyboardType="decimal-pad"
          autoFocus={!initial}
          accessibilityLabel="Amount"
          testID="transaction-amount"
          className="flex-1 text-center text-4xl font-bold text-ink"
        />
      </View>

      <View className="mt-4 gap-4">
        <WalletPicker wallets={wallets} value={walletId} onChange={setWalletId} />
        <CategoryPicker categories={categories} value={categoryId} onChange={setCategoryId} />
      </View>

      <View className="mt-4">
        <Text className="mb-1.5 text-sm font-medium text-ink-muted">Date</Text>
        <View className="flex-row gap-2">
          <DateChip
            label="Today"
            active={occurredOn === today}
            onPress={() => {
              setOccurredOn(today);
              clearError();
            }}
          />
          <DateChip
            label="Yesterday"
            active={occurredOn === yesterday}
            onPress={() => {
              setOccurredOn(yesterday);
              clearError();
            }}
          />
        </View>
        <View className="mt-2">
          <Input
            value={occurredOn}
            onChangeText={(text) => {
              setOccurredOn(text.trim());
              clearError();
            }}
            placeholder="YYYY-MM-DD"
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={10}
            accessibilityLabel="Date"
          />
        </View>
      </View>

      <View className="mt-4">
        <Input
          label="Description (optional)"
          value={description}
          onChangeText={(text) => {
            setDescription(text);
            clearError();
          }}
          placeholder={
            type === 'income' ? 'e.g. November salary' : 'e.g. Groceries at the market'
          }
          maxLength={TRANSACTION_DESCRIPTION_MAX}
        />
      </View>

      <View className="mt-4">
        <Input
          label="Note (optional)"
          value={note}
          onChangeText={(text) => {
            setNote(text);
            clearError();
          }}
          placeholder="Anything you want to remember"
          maxLength={TRANSACTION_NOTE_MAX}
        />
      </View>

      {error ? <Text className="mt-4 text-sm text-expense">{error}</Text> : null}

      <View className="mt-6">
        <Button label={submitLabel} size="lg" loading={busy} onPress={handleSubmit} />
      </View>

      {onDelete ? (
        <Pressable
          accessibilityRole="button"
          onPress={onDelete}
          className="mt-4 items-center py-3"
        >
          <Text className="text-sm font-semibold text-expense">Delete transaction</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
