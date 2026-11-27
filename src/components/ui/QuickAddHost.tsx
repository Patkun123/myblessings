import { useState } from 'react';

import { TransactionSheet } from '@/components/transaction/TransactionSheet';
import { MultiActionFAB } from '@/components/ui/MultiActionFAB';
import { WalletSheet } from '@/components/wallet/WalletSheet';
import type { TransactionKind } from '@/domain/transaction';
import { snackbar } from '@/stores/snackbarStore';

type QuickAddHostProps = {
  hasWallets: boolean;
};

/**
 * Bundles the multi-action floating `+` pop-up menu with Add Transaction
 * (`expense` / `income`) and Add Wallet bottom sheets for tab screens.
 */
export function QuickAddHost({ hasWallets }: QuickAddHostProps) {
  const [txnOpen, setTxnOpen] = useState(false);
  const [txnType, setTxnType] = useState<TransactionKind>('expense');
  const [walletOpen, setWalletOpen] = useState(false);

  function openTransaction(kind: TransactionKind) {
    if (!hasWallets) {
      snackbar.show('Create a wallet first to record entries.');
      setWalletOpen(true);
      return;
    }
    setTxnType(kind);
    setTxnOpen(true);
  }

  return (
    <>
      <MultiActionFAB
        onAddExpense={() => openTransaction('expense')}
        onAddIncome={() => openTransaction('income')}
        onAddWallet={() => setWalletOpen(true)}
      />

      <TransactionSheet
        visible={txnOpen}
        onClose={() => setTxnOpen(false)}
        initialType={txnType}
      />

      <WalletSheet visible={walletOpen} onClose={() => setWalletOpen(false)} />
    </>
  );
}
