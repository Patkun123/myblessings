import type { CategoryType } from '@/db/schema';
import { colors } from '@/constants/theme';
import type { IconName } from '@/types/icons';

export type DefaultCategory = {
  name: string;
  icon: string;
  color: string;
  type: CategoryType;
};

/**
 * Ionicons names (never emoji, so rendering is identical across platforms).
 * System rows are archived, never deleted, by the user.
 */
export const DEFAULT_CATEGORIES: readonly DefaultCategory[] = [
  // Income
  { name: 'Salary', icon: 'cash', color: colors.income, type: 'income' },
  { name: 'Business Income', icon: 'storefront', color: colors.income, type: 'income' },
  { name: 'Freelance', icon: 'laptop', color: colors.income, type: 'income' },
  { name: 'Tithe Received', icon: 'church', color: colors.accent, type: 'income' },
  { name: 'Offering Received', icon: 'hand-left', color: colors.accent, type: 'income' },
  { name: 'Donation Received', icon: 'gift', color: colors.income, type: 'income' },
  { name: 'Interest', icon: 'trending-up', color: colors.income, type: 'income' },
  { name: 'Other Income', icon: 'add-circle', color: colors.inkMuted, type: 'income' },

  // Expense
  { name: 'Food & Groceries', icon: 'cart', color: colors.expense, type: 'expense' },
  { name: 'Transportation', icon: 'bus', color: colors.expense, type: 'expense' },
  { name: 'Utilities', icon: 'bulb', color: colors.expense, type: 'expense' },
  { name: 'Rent / Mortgage', icon: 'home', color: colors.expense, type: 'expense' },
  { name: 'Education', icon: 'school', color: colors.expense, type: 'expense' },
  { name: 'Healthcare', icon: 'medkit', color: colors.expense, type: 'expense' },
  { name: 'Tithe Given', icon: 'church', color: colors.accent, type: 'expense' },
  { name: 'Offering Given', icon: 'hand-left', color: colors.accent, type: 'expense' },
  { name: 'Love Gift', icon: 'heart', color: colors.accent, type: 'expense' },
  { name: 'Ministry Expense', icon: 'book', color: colors.accent, type: 'expense' },
  { name: 'Mission Support', icon: 'globe', color: colors.accent, type: 'expense' },
  { name: 'Building Fund', icon: 'business', color: colors.accent, type: 'expense' },
  { name: 'Office Supplies', icon: 'clipboard', color: colors.expense, type: 'expense' },
  { name: 'Payroll', icon: 'people', color: colors.expense, type: 'expense' },
  { name: 'Bank Fees', icon: 'card', color: colors.expense, type: 'expense' },
  { name: 'Other Expense', icon: 'remove-circle', color: colors.inkMuted, type: 'expense' },
];

/**
 * Starting points for the "new wallet" form. Nothing is created automatically:
 * the user names every wallet and enters its opening balance themselves.
 */
export const WALLET_PRESETS = [
  { id: 'cash', label: 'Cash', icon: 'cash', color: colors.brand },
  { id: 'bank', label: 'Bank', icon: 'business', color: colors.inkMuted },
  { id: 'ewallet', label: 'E-wallet', icon: 'phone-portrait', color: colors.accent },
  { id: 'savings', label: 'Savings', icon: 'shield-checkmark', color: colors.income },
] as const satisfies readonly { id: string; label: string; icon: IconName; color: string }[];

export type WalletPreset = (typeof WALLET_PRESETS)[number];
