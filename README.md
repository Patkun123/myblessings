# MyBlessings

Offline-first financial management for individuals, families, churches, organisations, and small
businesses. Philippine Peso only, everything stored on the device.

Built with **Expo SDK 58**, **React Native 0.88**, **Expo Router**, **NativeWind v4**, and
**Drizzle ORM + expo-sqlite**.

---

## Status

**Phase 1 — Foundation** is complete:

- Expo Router shell: onboarding → PIN setup → tab shell, plus a full-screen lock gate.
- SQLite schema for all nine tables, generated migrations, and `PRAGMA foreign_keys` / WAL.
- Idempotent profile seeding (system categories + a default wallet).
- Money helpers (integer centavos) and derived wallet balances.
- Base UI kit: Button, Card, Input, MoneyInput, Modal, Sheet, FAB, Snackbar, EmptyState.
- Jest suite covering money math, the schema's constraints, and the PIN verifier.

Phase 2 (profiles, wallets, transfers, backup/restore) is next. See the implementation plan at
`~/.opencode/plan/MyBlessings-Implementation-Plan-v1.1.md`.

## Commands

```bash
npx expo start              # dev server (use a development build — see below)
npx expo lint               # ESLint (expo config, flat)
npx tsc --noEmit            # typecheck
npx jest                    # unit tests
npx drizzle-kit generate    # regenerate migrations after a schema change
npx expo-doctor             # dependency / config health check
```

> **Expo Go is not enough.** `expo-secure-store` works there, but PDF export, sharing, and
> notifications do not. Use a development build (`eas build --profile development`, or
> `npx expo run:android` / `run:ios`) before Phase 3.

### Web preview

`npx expo start --web` runs the app in a browser for UI work. Web is a **preview target
only** — the app ships to Android and iOS, and nothing stored in a browser is encrypted.
Three things make it work and must not be removed:

- `metro.config.js` adds `wasm` to `assetExts` and sets `Cross-Origin-Embedder-Policy:
  credentialless` + `Cross-Origin-Opener-Policy: same-origin`. `expo-sqlite` runs SQLite in a
  Web Worker and Drizzle's Expo driver is synchronous, so results come back through a
  `SharedArrayBuffer`, which browsers only expose to cross-origin-isolated pages. The same two
  headers are also patched onto `ServerResponse.writeHead`, because the Expo CLI answers the
  root document (`GET /`) from its manifest middleware, *before* Metro's middleware — so
  `enhanceMiddleware` alone never covers it, and a first load of `/` would fail with
  *"SharedArrayBuffer is not defined"*.
- `src/db/client.ts` opens the database with `await SQLite.openDatabaseAsync()` before creating
  the Drizzle client, and the root layout migrates only after that. Opening at module scope
  throws *"The SQLite web worker has not finished loading"*.
- `src/services/secureStore.web.ts` backs the PIN verifier and active-profile id with
  `localStorage`, because `expo-secure-store` ships an empty stub for web
  (`ExpoSecureStore.web.js` exports `{}`). That copy is not encrypted — use web to look at the
  UI, not to keep real books.

A static deploy needs the COOP/COEP headers in the host configuration too.

## Project layout

```
src/
  app/              # Expo Router routes only
    _layout.tsx     # migrations gate, session hydrate, lock gate, snackbar host
    index.tsx       # entry redirect
    (auth)/         # welcome, pin-setup
    (tabs)/         # home, transactions, wallets, budgets, reports
  components/
    auth/           # PinPad, LockScreen
    ui/             # design-system primitives
    wallet/         # wallet-specific composition
  constants/        # theme tokens, currency, default categories
  db/
    schema.ts       # Drizzle schema (single source of truth)
    client.ts       # connection + PRAGMAs
    seed.ts         # idempotent profile seeding
    queries/        # typed read queries
  domain/           # money parsing/formatting (pure, unit-tested)
  hooks/            # live-query hooks
  services/         # profile, PIN, session persistence
  stores/           # zustand: session/lock, snackbar
  utils/            # ids, dates
drizzle/            # generated SQL migrations + migrations.js (bundled)
```

## Conventions

- **Money is `INTEGER` centavos.** Never `REAL`, never floats in arithmetic. Parse with
  `parsePesoInput`, format with `formatPeso`. The database enforces `amount > 0`; direction comes
  from `type`.
- **Balances are derived**, never stored: `opening_balance_centavos + Σ ledger`.
- **Transfers are one `transfer` row plus two ledger legs** (`transfer_out` / `transfer_in`), with
  a partial unique index guaranteeing exactly one leg per direction.
- **Dates:** `occurred_on` is local `YYYY-MM-DD`; timestamps are UTC ISO-8601 (`created_at`,
  `updated_at`).
- **Deletes are soft** (`deleted_at`); every read filters it out, and partial unique indexes ignore
  deleted rows.
- **Every row is profile-scoped** by `user_id`.
- **Secrets stay out of SQLite.** The PIN verifier lives in SecureStore; the database itself is
  unencrypted at rest (documented risk, SQLCipher is the v2 path).

## Schema changes

1. Edit `src/db/schema.ts`.
2. Run `npx drizzle-kit generate`.
3. Run `npx jest src/db/schema.test.ts` — it applies every migration to a real SQLite engine and
   asserts the constraints still hold.
4. Never edit files in `drizzle/` by hand.

`drizzle/migrations.js` is regenerated by drizzle-kit and imported by the root layout, so a new
migration ships automatically.
