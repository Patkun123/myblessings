import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text } from 'react-native';

import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Sheet } from '@/components/ui/Sheet';
import { WalletForm, type WalletFormValues } from '@/components/wallet/WalletForm';
import {
  createWallet,
  restoreWalletWithTransactions,
  softDeleteWalletWithTransactions,
  updateWallet,
  type WalletBalanceRow,
} from '@/db/queries/wallet';
import { useSessionStore } from '@/stores/sessionStore';
import { snackbar } from '@/stores/snackbarStore';

type WalletSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** When present, opens in Edit/Delete mode; otherwise Add mode. */
  wallet?: WalletBalanceRow | null;
  /** Whether deleting is permitted (blocked when only 1 active wallet remains). */
  canDelete?: boolean;
};

/** Bottom sheet for adding, editing, or deleting a wallet. */
export function WalletSheet({
  visible,
  onClose,
  wallet = null,
  canDelete = true,
}: WalletSheetProps) {
  const activeUserId = useSessionStore((state) => state.activeUserId);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!activeUserId) return null;
  const userId = activeUserId;
  const isEditing = Boolean(wallet);

  async function handleSubmit(values: WalletFormValues) {
    if (wallet) {
      await updateWallet(wallet.id, { userId, ...values });
      snackbar.show('Wallet updated.');
    } else {
      await createWallet({ userId, ...values });
      snackbar.show('Wallet added.');
    }
    onClose();
  }

  async function handleConfirmDelete() {
    if (!wallet || deleting) return;
    setDeleting(true);
    try {
      const { deletedTransactionIds } = await softDeleteWalletWithTransactions(
        userId,
        wallet.id
      );
      const walletId = wallet.id;
      const walletName = wallet.name;
      setConfirmOpen(false);
      onClose();
      snackbar.show(`${walletName} deleted.`, {
        action: {
          label: 'Undo',
          onPress: () => {
            void restoreWalletWithTransactions(userId, walletId, deletedTransactionIds);
          },
        },
      });
    } catch (cause) {
      setConfirmOpen(false);
      snackbar.show(
        cause instanceof Error ? cause.message : 'Could not delete this wallet.'
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Sheet
        visible={visible}
        onClose={onClose}
        title={isEditing ? 'Edit wallet' : 'New wallet'}
        showClose
        scrollable
        headerRight={
          wallet ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`View ${wallet.name} transactions`}
              hitSlop={6}
              onPress={() => {
                onClose();
                router.push({
                  pathname: '/(tabs)/transactions',
                  params: { walletId: wallet.id },
                });
              }}
              className="rounded-pane border border-line bg-pane px-2.5 py-1.5"
            >
              <Text className="font-body-semibold text-xs text-brand">View ledger</Text>
            </Pressable>
          ) : undefined
        }
      >
        <WalletForm
          key={wallet ? wallet.id : 'new-wallet'}
          initial={
            wallet
              ? {
                  name: wallet.name,
                  openingBalanceCentavos: wallet.openingBalanceCentavos,
                  icon: wallet.icon,
                  color: wallet.color,
                }
              : undefined
          }
          submitLabel={isEditing ? 'Save changes' : 'Add wallet'}
          onSubmit={handleSubmit}
          onDelete={
            isEditing
              ? () => {
                  if (!canDelete) {
                    snackbar.show('Keep at least one wallet to record transactions.');
                    return;
                  }
                  setConfirmOpen(true);
                }
              : undefined
          }
          deleteDisabled={isEditing && !canDelete}
          deleteHint="Keep at least one active wallet."
          autoFocus={!isEditing}
        />
      </Sheet>

      <Modal
        visible={confirmOpen}
        onClose={() => {
          if (!deleting) setConfirmOpen(false);
        }}
        dismissable={!deleting}
        title={wallet ? `Delete ${wallet.name}?` : 'Delete wallet?'}
        message={
          wallet && wallet.transactionCount > 0
            ? `This will remove ${wallet.name} and ${wallet.transactionCount} linked ${
                wallet.transactionCount === 1 ? 'entry' : 'entries'
              } from active totals. You can undo right after.`
            : 'This will remove the wallet from active totals. You can undo right after.'
        }
        footer={
          <>
            <Button
              label="Delete wallet"
              variant="danger"
              loading={deleting}
              onPress={() => void handleConfirmDelete()}
            />
            <Button
              label="Cancel"
              variant="secondary"
              disabled={deleting}
              onPress={() => setConfirmOpen(false)}
            />
          </>
        }
      />
    </>
  );
}
