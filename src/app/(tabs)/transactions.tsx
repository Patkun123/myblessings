import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, ScrollView, Text, View } from 'react-native';

import { AmountText } from '@/components/ui/AmountText';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FAB } from '@/components/ui/FAB';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { Sheet } from '@/components/ui/Sheet';
import { TransactionRow } from '@/components/transaction/TransactionRow';
import { colors } from '@/constants/theme';
import type { TransactionWithMeta } from '@/db/queries/transaction';
import { signedCentavos, type TransactionKind } from '@/domain/transaction';
import { useTransactions } from '@/hooks/useTransactions';
import { useWalletBalances } from '@/hooks/useWalletBalances';
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
  const { wallets } = useWalletBalances();
  const [search, setSearch] = useState('');
  const [type, setType] = useState<TypeFilter>('all');
  const [walletId, setWalletId] = useState<string | null>(null);
  const [walletSheet, setWalletSheet] = useState(false);

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
                className={`rounded-full border px-3 py-1.5 ${
                  active ? 'border-brand bg-brand' : 'border-line bg-surface'
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${active ? 'text-white' : 'text-ink-muted'}`}
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
            className={`ml-auto flex-row items-center rounded-full border px-3 py-1.5 ${
              walletId ? 'border-brand bg-brand-light' : 'border-line bg-surface'
            }`}
          >
            <Ionicons
              name="wallet-outline"
              size={13}
              color={walletId ? colors.brand : colors.inkMuted}
            />
            <Text
              className={`ml-1 max-w-[110px] text-xs font-semibold ${
                walletId ? 'text-brand' : 'text-ink-muted'
              }`}
              numberOfLines={1}
            >
              {walletLabel}
            </Text>
            <Ionicons
              name="chevron-down"
              size={13}
              color={walletId ? colors.brand : colors.inkMuted}
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
              <Text className="text-xs font-semibold uppercase tracking-wider text-ink-faint">
                {dayHeading(item.date)}
              </Text>
              <AmountText
                centavos={item.netCentavos}
                tone={item.netCentavos < 0 ? 'expense' : 'income'}
                size="sm"
              />
            </View>
          ) : (
            <TransactionRow transaction={item.transaction} />
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
                <Button label="Create wallet" onPress={() => router.push('/wallet/new')} />
              ) : (
                <Button
                  label="Record a transaction"
                  onPress={() => router.push('/transaction/new')}
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

      <FAB icon="add" label="Add transaction" onPress={() => router.push('/transaction/new')} />

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
              <Ionicons name="wallet-outline" size={18} color={colors.inkMuted} />
            </View>
            <Text className="ml-3 flex-1 text-base text-ink">All wallets</Text>
            {walletId === null ? (
              <Ionicons name="checkmark-circle" size={20} color={colors.brand} />
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
                    <Ionicons name="checkmark-circle" size={20} color={colors.brand} />
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
