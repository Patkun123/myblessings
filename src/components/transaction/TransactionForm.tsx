import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { CameMark } from '@/components/ui/CameMark';
import {
  CategoryPicker,
  CategoryPickerGrid,
  WalletPicker,
  WalletPickerList,
} from '@/components/transaction/TransactionPickers';
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
  /** Default type when creating a new entry (ignored if `initial` is provided). */
  initialType?: TransactionKind;
  /** Use `'inline'` inside bottom sheets to avoid nested modal dialogs on iOS. */
  pickerMode?: 'sheet' | 'inline';
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
      className={`relative min-h-[44px] justify-center overflow-hidden rounded-pane border px-4 py-2 ${
        active ? 'border-brand bg-brand-light' : 'border-line bg-surface'
      }`}
    >
      <CameMark active={active} />
      <Text
        className={`font-body-semibold text-xs ${active ? 'text-brand' : 'text-ink-muted'}`}
      >
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
  initialType = 'expense',
  pickerMode = 'sheet',
  submitLabel,
  onSubmit,
  onDelete,
}: TransactionFormProps) {
  const themeColors = useThemeColors();
  const today = todayCalendarDate();
  const yesterday = yesterdayCalendarDate();

  const [type, setType] = useState<TransactionKind>(initial?.type ?? initialType);
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
  const [inlinePicker, setInlinePicker] = useState<'none' | 'wallet' | 'category'>('none');
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

  if (pickerMode === 'inline' && inlinePicker !== 'none') {
    const pickingWallet = inlinePicker === 'wallet';
    return (
      <View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to entry"
          onPress={() => setInlinePicker('none')}
          className="mb-3 flex-row items-center gap-1.5 self-start rounded-pane border border-line bg-pane px-3 py-2"
        >
          <Ionicons name="arrow-back" size={16} color={themeColors.ink} />
          <Text className="font-body-semibold text-xs text-ink">
            {pickingWallet ? 'Choose wallet' : 'Choose category'}
          </Text>
        </Pressable>

        {pickingWallet ? (
          <WalletPickerList
            wallets={wallets}
            value={walletId}
            onSelect={(id) => {
              setWalletId(id);
              clearError();
              setInlinePicker('none');
            }}
          />
        ) : (
          <CategoryPickerGrid
            categories={categories}
            value={categoryId}
            onSelect={(id) => {
              setCategoryId(id);
              clearError();
              setInlinePicker('none');
            }}
          />
        )}
      </View>
    );
  }

  return (
    <View>
      <TypeToggle value={type} onChange={handleTypeChange} />

      <View
        className={`mt-4 flex-row items-center justify-center rounded-pane border bg-surface px-4 py-3 ${
          error ? 'border-expense' : 'border-line'
        }`}
      >
        <Text className="mr-1 font-body-semibold text-3xl text-ink-faint">₱</Text>
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
          style={{ fontVariant: ['tabular-nums'] }}
          className="flex-1 text-center font-body-bold text-4xl tabular-nums text-ink"
        />
      </View>

      <View className="mt-4 gap-4">
        <WalletPicker
          wallets={wallets}
          value={walletId}
          onChange={setWalletId}
          onRequestOpen={pickerMode === 'inline' ? () => setInlinePicker('wallet') : undefined}
        />
        <CategoryPicker
          categories={categories}
          value={categoryId}
          onChange={setCategoryId}
          onRequestOpen={pickerMode === 'inline' ? () => setInlinePicker('category') : undefined}
        />
      </View>

      <View className="mt-4">
        <Text className="mb-1.5 font-body-medium text-sm text-ink-muted">Date</Text>
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
