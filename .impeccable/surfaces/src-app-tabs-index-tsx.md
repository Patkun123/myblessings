---
version: 1
slug: "src-app-tabs-index-tsx"
primary_target: "src/app/(tabs)/index.tsx"
related_targets: ["src/app/(tabs)/transactions.tsx","src/app/(tabs)/wallets.tsx","src/app/(tabs)/budgets.tsx","src/app/(tabs)/reports.tsx","src/app/(auth)/welcome.tsx","src/app/settings.tsx"]
---

## Scope

Mode: **Operate**. Every screen the app ships: onboarding (welcome, wallet setup, PIN setup), the lock screen, all five tabs (Home, Transactions, Wallets, Budgets, Reports), the transaction and wallet forms, pickers and sheets, settings, change-PIN, and every empty/loading/error state. Platform `adaptive` — iOS and Android, portrait, phone-first, light and dark appearance (`dark` lamplit room default, `light` daylight exposure). Redesign: the old look is evidence, not authority; product truth, data model, copy facts and native affordances stay.

## Audience and job

Individuals, families, churches, organizations, and small businesses in the Philippines managing separate books via local profiles on their phone, often with irregular or no signal. Their job on Home is to answer "what does every wallet or fund hold right now, and what moved last" in one glance, then record an entry. Success is a user who trusts the total enough to act or report on it immediately, and can log an expense, income, tithe, or offering in under thirty seconds offline.

Constraints: local-only (SQLite), Philippine peso only, no cloud, no accounts, no gamification, no investment language, no trust badges. Money is manually entered; nothing is auto-seeded. The header always names the app. Anti-reference: corporate fintech — cold navy gradients, decorative charts, "grow your wealth" energy.

## Chosen direction

**The Capiz Window.** Every wallet or fund is a pane in one window, and the light it holds is the money.

## Direction contract

THESIS: Every wallet or fund is a pane in one window and the light it holds is the money. It refuses the balance-card-plus-quick-actions-plus-donut dashboard: the fund grid *is* the dashboard, and a pane that stops carrying data stops being a pane.

OWN-WORLD: A five-tone shell ramp and nothing ad hoc — frame `#1C1613` (dark hardwood), ground `#221A15`, pane `#2A211B`, lit pane `#E9A94A` (lamplight), ink `#F4ECDD` (capiz ivory) — plus muted `#B9B0A2`, growth `#6FA98A`, spend `#D07A63` (and matching daylight exposure `#F4ECDD` canvas, `#FBF6EC` surface, `#F1E6D2` pane, `#8A5410` brand, `#241C16` plate). One rounded window frame (`20px`) holds `4px`-gapped panes (`12px`); lamplight rises from each pane's bottom edge in proportion to its share of the total, fading upward through the pane's own shade. The transom is the only plate/ivory field on the screen. Archivo for all UI; every figure tabular. Selection, disabled and focus are drawn as came marks (a drawn rule and notch), never colour alone.

STORY: A user opens the app and sees what every wallet or fund holds and which one just moved; they believe the total because each pane prints its own proof — entry count and last movement — under the balance; they tap a pane to work that wallet's ledger, or the lamplight button to record an entry.

FIRST VIEWPORT: Brand bar: 26–28px heart mark on a lamplight tile, "MyBlessings" at 15px, month label and settings/lock at right. Below, the window: an ~88px plate transom carrying `ALL WALLETS · N`, the total at 34px as the only monumental figure on the screen, then `N entries · N active` and an offline-saved dot. Under it a two-column pane grid of 82px+ panes — wallet name and share % on top, balance at 15px and the proof line beneath — zero-balance panes dimmed, a dashed `ADD WALLET` pane closing the grid. Then the month row (`IN` / `OUT` / `NET` at 13px) over a 3px proportional bar, then `LATEST` with three rows. A 50–56px lamplight FAB sits bottom-right above the tab bar. Signature interaction: a pane's lamplight rises to its new share when money moves, and tapping a pane opens that wallet's filtered ledger. Motion: one lamplight ramp, exponential ease-out, ~320ms; no scattered effects.

FORM: The Capiz Window — position 5 of 7 on my ordered list, dealt by the roll and kept. seed:9b73d9e1f70eee14

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Unresolved

- Budgets and Reports are still placeholders and are restyled, not built out, in this pass.
- Transfers, pledges, recurring rules, PDF/CSV export, and local backup/restore remain Phase 2+.
