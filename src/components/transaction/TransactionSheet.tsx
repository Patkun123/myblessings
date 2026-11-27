import { Text, View } from 'react-native';

import {
  TransactionForm,
  type TransactionFormInitial,
  type TransactionFormValues,
} from '@/components/transaction/TransactionForm';
import { Sheet } from '@/components/ui/Sheet';
import {
  createTransaction,
  restoreTransaction,
  softDeleteTransaction,
  updateTransaction,
  type TransactionWithMeta,
} from '@/db/queries/transaction';
import type { TransactionKind } from '@/domain/transaction';
import { useWalletBalances } from '@/hooks/useWalletBalances';
import { useSessionStore } from '@/stores/sessionStore';
import { snackbar } from '@/stores/snackbarStore';

type TransactionSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** When present, opens in Edit/Delete mode; otherwise Add mode. */
  transaction?: TransactionWithMeta | null;
  /** Default type when adding a new transaction (`'expense'` or `'income'`). */
  initialType?: TransactionKind;
};

/** Bottom sheet for adding, editing, or deleting a transaction. */
export function TransactionSheet({
  visible,
  onClose,
  transaction = null,
  initialType = 'expense',
}: TransactionSheetProps) {
  const activeUserId = useSessionStore((state) => state.activeUserId);
  const { wallets } = useWalletBalances();

  if (!activeUserId) return null;
  const userId = activeUserId;
  const isEditing = Boolean(transaction);

  const title = isEditing
    ? 'Edit transaction'
    : initialType === 'income'
      ? 'New income'
      : 'New expense';

  const initial: TransactionFormInitial | undefined = transaction
    ? {
        type: transaction.type === 'income' ? 'income' : 'expense',
        amountCentavos: transaction.amountCentavos,
        walletId: transaction.walletId,
        categoryId: transaction.categoryId,
        occurredOn: transaction.occurredOn,
        description: transaction.description,
        note: transaction.note,
      }
    : undefined;

  async function handleSubmit(values: TransactionFormValues) {
    if (transaction) {
      await updateTransaction(transaction.id, { userId, ...values });
      snackbar.show('Transaction updated.');
    } else {
      await createTransaction({ userId, ...values });
      snackbar.show(values.type === 'income' ? 'Income recorded.' : 'Expense recorded.');
    }
    onClose();
  }

  function handleDelete() {
    if (!transaction) return;
    const entryId = transaction.id;
    void (async () => {
      await softDeleteTransaction(userId, entryId);
      onClose();
      snackbar.show('Transaction deleted.', {
        action: {
          label: 'Undo',
          onPress: () => {
            void restoreTransaction(userId, entryId);
          },
        },
      });
    })();
  }

  return (
    <Sheet visible={visible} onClose={onClose} title={title} showClose scrollable>
      {wallets.length === 0 ? (
        <View className="py-4">
          <Text className="text-center font-body text-sm leading-5 text-ink-muted">
            Create a wallet first before recording income or expenses.
          </Text>
        </View>
      ) : (
        <TransactionForm
          key={transaction ? transaction.id : `new-${initialType}-${visible ? 'open' : 'closed'}`}
          wallets={wallets}
          initial={initial}
          initialType={initialType}
          pickerMode="inline"
          submitLabel={isEditing ? 'Save changes' : 'Save entry'}
          onSubmit={handleSubmit}
          onDelete={isEditing ? handleDelete : undefined}
        />
      )}
    </Sheet>
  );
}
