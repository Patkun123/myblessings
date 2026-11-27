# Product

<!-- impeccable:product-schema 1 -->

## Platform

adaptive

## Users

MyBlessings serves five primary audiences equally through separate local profiles on the same device:

- **Individuals and families** tracking household cash flow, daily expenses, savings, and personal giving.
- **Churches and religious organizations** (volunteer or staff treasurers, often without formal accounting training) recording tithes, offerings, donations, pledges, and ministry or building-fund spending.
- **Nonprofit/community organizations** monitoring multiple funds and financial accountability.
- **Small businesses** tracking business income, operating expenses, office supplies, and payroll.

## Product Purpose

MyBlessings is a general-purpose, offline-first mobile financial management application that simplifies manual recording of income, expenses, transfers, offerings, and donations; monitors wallet and fund balances in real time as records are entered; enforces budgets with spending alerts; and generates financial summaries and exportable reports (PDF and CSV) for transparency and accountability — all without internet access, cloud accounts, or third-party servers.

## Positioning

General-purpose + offline-first + giving-native. Unlike church-only finance tools or cloud-dependent personal budgeting apps, MyBlessings accommodates personal, family, small-business, organization, and church books on one device (isolated by local PIN-protected profiles), keeps every record in local SQLite, operates strictly in Philippine Peso (`₱`), and treats tithes, offerings, donations, love gifts, mission support, building funds, and pledges as first-class ledger concepts alongside household and business categories.

## Operating Context

- **Devices & form factor:** Android and iOS phones (`adaptive`), portrait-first, supporting light and dark appearance.
- **Connectivity:** Works in low- or no-connectivity environments (homes, sanctuaries, small shops, travel); network is never required.
- **Profile separation & privacy:** Users can keep multiple local profiles on one device (for example, `Family` and `Grace Church`), each protected by its own PIN lock so a shared phone stays private.
- **Manual entry:** Wallets and transactions are never auto-seeded with fake balances; users name each wallet and enter opening balances and entries themselves.
- **Dev preview:** Web (`expo start --web`) is a development preview target only, not a shipping surface.

## Capabilities and Constraints

Confirmed in the codebase today:

- Local profiles with onboarding, per-profile PIN setup/change, profile switching, and an app-background lock gate.
- Manual wallets with custom names, icons, colors, and opening balances; balances are always derived from the ledger (`opening_balance_centavos + Σ ledger`), never stored.
- Income and expense recording with category (default personal, business, and church categories), wallet, local `YYYY-MM-DD` date, description, and note; Overview totals (total balance, monthly income/expense, recent transactions); Transactions list with day grouping, search, type and wallet filters, and editing; light and dark appearance.

Confirmed v1.0 scope (schema and placeholders ready, screens/services still to be built):

- Wallet-to-wallet fund transfers (one `transfer` row materialized as two `transfer_out` / `transfer_in` ledger legs).
- Church offerings, tithes, donor tracking, and pledge fulfillment tracking (`pledge` + linked transactions).
- Recurring transactions (`weekly`, `biweekly`, `monthly` rules with duplicate guards).
- Weekly and monthly budgets per category, wallet, or globally, with carry-over and threshold alerts at 75%, 90%, and 100%.
- Financial and church accountability reports filtered by date range, wallet, category, or type, exported and shared as PDF or CSV.
- Local database backup and restore.

Binding technical & product constraints:

- **Offline-first, local-only SQLite:** No cloud sync or multi-user network roles in v1.0. UUIDv4 primary keys and soft deletes (`deleted_at`) are used across tables. Every table is profile-scoped by `user_id`.
- **Philippine Peso (`₱`) only:** Money is stored as positive `INTEGER` centavos (`amount > 0`), never floats; direction comes from transaction type.
- **Security model:** PIN verifiers live in `expo-secure-store`; the SQLite database itself is unencrypted at rest in v1.0 (a documented risk, with SQLCipher as the v2 path).
- **Stack & runtime:** Expo SDK 58, React Native 0.88, Expo Router, NativeWind v4, Zustand, Drizzle ORM + `expo-sqlite`. A development build (`eas build --profile development` or `expo run:android|ios`) is required for native modules such as PDF export, sharing, and notifications; Expo Go is not sufficient.

Undecided (post-v1.0):

- Whether cloud sync, multi-currency support, or networked multi-user roles ship in future versions.

## Brand Commitments

- **Name:** MyBlessings.
- **Voice:** Neutral-warm stewardship — respectful, plain-spoken, practical, and free of corporate fintech hype or accounting jargon. Speaks naturally to both everyday household/business budgeting and church giving.
- **Domain vocabulary:** Preserve `tithe`, `offering`, `love gift`, `mission support`, `building fund`, and `pledge` as real domain terms alongside `salary`, `business income`, `payroll`, and household categories.
- **Existing brand signals:** The MyBlessings name and the heart icon used in onboarding; no formal logo system or separate voice guide is documented yet.

## Evidence on Hand

- `README.md`: project status, conventions, and web-preview SQLite/COOP/COEP notes.
- `src/db/schema.ts` and `drizzle/`: the 9-table SQLite schema (`user`, `settings`, `wallet`, `category`, `transfer`, `recurring_rule`, `pledge`, `transaction`, `budget`) and generated migrations.
- `src/constants/categories.ts`: default income and expense categories covering individuals, businesses, organizations, and churches, plus `WALLET_PRESETS`.
- `src/app/`: current Expo Router screens (`welcome`, `pin-setup`, `index`, `transactions`, `wallets`, `budgets`, `reports`, and detail/settings routes).
- Jest tests: unit tests for money math (`src/domain/money.test.ts`), schema constraints (`src/db/schema.test.ts`), and PIN verification (`src/services/pinService.test.ts`).

Absent, and not to be fabricated: customer testimonials, church or business references, usage metrics, benchmarks, press, pricing, or app store claims.

## Product Principles

1. **One app, every ledger.** Individuals, families, small businesses, organizations, and churches are equal first-class users, separated cleanly via local profiles.
2. **Works with zero signal.** Every core workflow completes locally on the device; connectivity is never a dependency.
3. **Stewardship over jargon.** Labels, summaries, and reports stay plain and readable so anyone can manage books without accounting training.
4. **Trust through transparency.** Balances derive strictly from the ledger, deletes are soft, and data stays under the user's control with local backup.
5. **Giving as a first-class workflow.** Offerings, tithes, donations, and pledges have dedicated ledger structure rather than being hidden as generic expenses.
