import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, ScrollView, Text, View } from 'react-native';

import { TransactionRow } from '@/components/transaction/TransactionRow';
import { TransactionSheet } from '@/components/transaction/TransactionSheet';
import { AmountText } from '@/components/ui/AmountText';
import { Button } from '@/components/ui/Button';
import { CameMark } from '@/components/ui/CameMark';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { QuickAddHost } from '@/components/ui/QuickAddHost';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Sheet } from '@/components/ui/Sheet';
import { WalletSheet } from '@/components/wallet/WalletSheet';
import type { TransactionWithMeta } from '@/db/queries/transaction';
import { signedCentavos, type TransactionKind } from '@/domain/transaction';
import { useTransactions } from '@/hooks/useTransactions';
import { useWalletBalances } from '@/hooks/useWalletBalances';
import { useThemeColors } from '@/stores/themeStore';
import type { IconName } from '@/types/icons';
import { dayHeading } from '@/utils/date';

type TypeFilter = 'all' | TransactionKind;

const TYPE_FILTERS: readonly { value: TypeFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expense' },
];

type DayItem = { kind: 'day'; date: string; netCentavos: number };
type RowItem = { kind: 'txn'; transaction: TransactionWithMeta };
type ListItem = DayItem | RowItem;

/**
 * Newest first, with a day header that carries the day's net movement.
 * The query already sorts by `occurred_on DESC`, so grouping is a single pass.
 */
function groupByDay(rows: TransactionWithMeta[]): ListItem[] {
  const items: ListItem[] = [];

  for (const row of rows) {
    const last = items[items.length - 1];
    if (!last || last.kind !== 'day' || last.date !== row.occurredOn) {
      items.push({ kind: 'day', date: row.occurredOn, netCentavos: 0 });
    }

    const day = items[items.length - 1] as DayItem;
    day.netCentavos += signedCentavos(
      row.type === 'income' ? 'income' : 'expense',
      row.amountCentavos
    );
    items.push({ kind: 'txn', transaction: row });
  }

  return items;
}

export default function TransactionsScreen() {
  const themeColors = useThemeColors();
  const { wallets } = useWalletBalances();
  const params = useLocalSearchParams<{ walletId?: string }>();
  const [search, setSearch] = useState('');
  const [type, setType] = useState<TypeFilter>('all');
  const [walletId, setWalletId] = useState<string | null>(params.walletId ?? null);
  const [lastRouteWalletId, setLastRouteWalletId] = useState<string | undefined>(params.walletId);
  const [walletSheet, setWalletSheet] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionWithMeta | null>(null);
  const [addTransactionOpen, setAddTransactionOpen] = useState(false);
  const [addWalletOpen, setAddWalletOpen] = useState(false);

  if (params.walletId !== lastRouteWalletId) {
    setLastRouteWalletId(params.walletId);
    if (params.walletId) setWalletId(params.walletId);
  }

  const { transactions, hasMore, loadMore } = useTransactions({
    search,
    type: type === 'all' ? null : type,
    walletId,
  });

  const items = groupByDay(transactions);
  const filtering = search.trim() !== '' || type !== 'all' || walletId !== null;
  const walletLabel = walletId
    ? (wallets.find((wallet) => wallet.id === walletId)?.name ?? 'Wallet')
    : 'All wallets';

  return (
    <Screen>
      <ScreenHeader title="Transactions" subtitle="Search, filter, and review every entry." />

      <View className="pb-1">
        <Input
          icon="search"
          value={search}
          onChangeText={setSearch}
          placeholder="Search description, note or category"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Search transactions"
        />

        <View className="mt-3 flex-row items-center gap-2">
          {TYPE_FILTERS.map((option) => {
            const active = option.value === type;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityLabel={option.label}
                accessibilityState={{ selected: active }}
                onPress={() => setType(option.value)}
                className={`relative min-h-[44px] justify-center overflow-hidden rounded-pane border px-3.5 py-2 ${
                  active ? 'border-brand bg-brand' : 'border-line bg-surface'
                }`}
              >
                <CameMark active={active} color={themeColors.brandInk} />
                <Text
                  className={`font-body-semibold text-xs ${
                    active ? 'text-brand-ink' : 'text-ink-muted'
                  }`}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Filter by wallet"
            onPress={() => setWalletSheet(true)}
            className={`relative ml-auto min-h-[44px] flex-row items-center overflow-hidden rounded-pane border px-3 py-2 ${
              walletId ? 'border-brand bg-brand-light' : 'border-line bg-surface'
            }`}
          >
            <CameMark active={Boolean(walletId)} />
            <Ionicons
              name="wallet-outline"
              size={14}
              color={walletId ? themeColors.brand : themeColors.inkMuted}
            />
            <Text
              className={`ml-1.5 max-w-[110px] font-body-semibold text-xs ${
                walletId ? 'text-brand' : 'text-ink-muted'
              }`}
              numberOfLines={1}
            >
              {walletLabel}
            </Text>
            <Ionicons
              name="chevron-down"
              size={14}
              color={walletId ? themeColors.brand : themeColors.inkMuted}
            />
          </Pressable>
        </View>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) =>
          item.kind === 'day' ? `day-${item.date}` : item.transaction.id
        }
        renderItem={({ item }) =>
          item.kind === 'day' ? (
            <View className="flex-row items-center justify-between pb-1 pt-4">
              <Text className="font-body-semibold text-[11px] uppercase tracking-label text-ink-faint">
                {dayHeading(item.date)}
              </Text>
              <AmountText
                centavos={item.netCentavos}
                tone={item.netCentavos < 0 ? 'expense' : 'income'}
                size="sm"
              />
            </View>
          ) : (
            <TransactionRow
              transaction={item.transaction}
              onPress={() => setEditingTransaction(item.transaction)}
            />
          )
        }
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 96 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            icon="swap-vertical-outline"
            title={filtering ? 'No matching entries' : 'No transactions yet'}
            message={
              filtering
                ? 'Try a different search or filter.'
                : 'Income and expenses you record will be listed here, newest first.'
            }
            action={
              filtering ? undefined : wallets.length === 0 ? (
                <Button label="Create wallet" onPress={() => setAddWalletOpen(true)} />
              ) : (
                <Button
                  label="Record a transaction"
                  onPress={() => setAddTransactionOpen(true)}
                />
              )
            }
          />
        }
        ListFooterComponent={
          hasMore ? (
            <View className="mt-4">
              <Button label="Load more" variant="secondary" onPress={loadMore} />
            </View>
          ) : undefined
        }
      />

      <QuickAddHost hasWallets={wallets.length > 0} />

      <TransactionSheet
        visible={editingTransaction !== null}
        onClose={() => setEditingTransaction(null)}
        transaction={editingTransaction}
      />

      <TransactionSheet
        visible={addTransactionOpen}
        onClose={() => setAddTransactionOpen(false)}
        initialType="expense"
      />

      <WalletSheet visible={addWalletOpen} onClose={() => setAddWalletOpen(false)} />

      <Sheet visible={walletSheet} onClose={() => setWalletSheet(false)} title="Filter by wallet">
        <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="All wallets"
            onPress={() => {
              setWalletId(null);
              setWalletSheet(false);
            }}
            className="flex-row items-center border-b border-line py-3"
          >
            <View className="h-10 w-10 items-center justify-center rounded-full bg-canvas">
              <Ionicons name="wallet-outline" size={18} color={themeColors.inkMuted} />
            </View>
            <Text className="ml-3 flex-1 text-base text-ink">All wallets</Text>
            {walletId === null ? (
              <Ionicons name="checkmark-circle" size={20} color={themeColors.brand} />
            ) : null}
          </Pressable>

          {wallets.map((wallet) => {
            const selected = wallet.id === walletId;
            return (
              <Pressable
                key={wallet.id}
                accessibilityRole="button"
                accessibilityLabel={wallet.name}
                onPress={() => {
                  setWalletId(wallet.id);
                  setWalletSheet(false);
                }}
                className="flex-row items-center border-b border-line py-3"
              >
                <View
                  className="h-10 w-10 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${wallet.color}1A` }}
                >
                  <Ionicons name={wallet.icon as IconName} size={18} color={wallet.color} />
                </View>
                <Text className="ml-3 flex-1 text-base text-ink" numberOfLines={1}>
                  {wallet.name}
                </Text>
                <AmountText centavos={wallet.balanceCentavos} tone="muted" />
                {selected ? (
                  <View className="ml-2">
                    <Ionicons name="checkmark-circle" size={20} color={themeColors.brand} />
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </Sheet>
    </Screen>
  );
}
