---
name: MyBlessings — The Capiz Window
description: Offline-first Philippine Peso ledger styled as a lamplit capiz-shell window in dark hardwood.
colors:
  frame-dark: "#1C1613"
  ground-dark: "#221A15"
  pane-dark: "#2A211B"
  line-dark: "#3B2F26"
  lamplight: "#E9A94A"
  lamplight-deep: "#C2872E"
  capiz-ivory: "#F4ECDD"
  ink-muted-dark: "#B9B0A2"
  ink-faint-dark: "#8A8073"
  growth-dark: "#6FA98A"
  spend-dark: "#D07A63"
  warning-dark: "#E0A93F"
  canvas-light: "#F4ECDD"
  surface-light: "#FBF6EC"
  pane-light: "#F1E6D2"
  line-light: "#D9C9AC"
  brand-light: "#8A5410"
  brand-light-deep: "#6B400C"
  hardwood-ink: "#241C16"
  ink-muted-light: "#5F5449"
  ink-faint-light: "#8A7C6C"
  growth-light: "#2F6B4F"
  spend-light: "#A8412B"
typography:
  monumental:
    fontFamily: "Archivo_700Bold, Archivo, sans-serif"
    fontSize: "34px"
    fontWeight: 700
    lineHeight: 1.18
    fontFeature: "tnum"
  title:
    fontFamily: "Archivo_700Bold, Archivo, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: 1.25
  heading:
    fontFamily: "Archivo_600SemiBold, Archivo, sans-serif"
    fontSize: "17px"
    fontWeight: 600
    lineHeight: 1.35
  body:
    fontFamily: "Archivo_400Regular, Archivo, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "Archivo_600SemiBold, Archivo, sans-serif"
    fontSize: "10px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.14em"
rounded:
  sm: "8px"
  pane: "12px"
  card: "14px"
  window: "20px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  xxl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.lamplight}"
    textColor: "{colors.hardwood-ink}"
    typography: "{typography.heading}"
    rounded: "{rounded.pane}"
    height: "48px"
    padding: "0 20px"
  button-secondary:
    backgroundColor: "{colors.ground-dark}"
    textColor: "{colors.capiz-ivory}"
    typography: "{typography.heading}"
    rounded: "{rounded.pane}"
    height: "48px"
    padding: "0 20px"
  input-field:
    backgroundColor: "{colors.ground-dark}"
    textColor: "{colors.capiz-ivory}"
    typography: "{typography.body}"
    rounded: "{rounded.pane}"
    height: "56px"
    padding: "0 16px"
  wallet-pane:
    backgroundColor: "{colors.pane-dark}"
    textColor: "{colors.capiz-ivory}"
    rounded: "{rounded.pane}"
    padding: "12px"
  transom-plate:
    backgroundColor: "{colors.capiz-ivory}"
    textColor: "{colors.hardwood-ink}"
    rounded: "{rounded.pane}"
    padding: "14px 16px"
---

# Design System: MyBlessings — The Capiz Window

## Overview

**Creative North Star: "The Capiz Window"**

MyBlessings treats a user's finances like a traditional Filipino capiz-shell window set in dark hardwood: every wallet or fund is a pane in one shared window frame, and the warm lamplight rising from the bottom edge of each pane shows how much of the total money it holds. The default appearance is a lamplit evening room so totals and entries stay calm and legible in dim sanctuary offices, kitchens, or evening shops, paired with a matching daylight noon exposure for outdoor use.

The interface rejects cold corporate fintech gradients, decorative donut charts, and gamified wealth tropes. Every screen stays grounded in plain stewardship language, high-contrast Philippine Peso tabular numbers, and structural came marks that communicate state without relying on color alone.

**Key Characteristics:**
- Five-tone hardwood-to-ivory shell ramp across both lamplit (dark default) and daylight (light) exposures.
- One rounded window frame enclosing 4px-gapped wallet panes and a single contrasting transom plate.
- Archivo across every text role with mandatory tabular numerals (`tabular-nums`) on all currency and proof counts.
- Structural came marks (drawn corner rule and notch) paired with color on active, selected, and disabled controls.

## Colors

The palette is built on a five-tone warm neutral ramp anchored by a single lamplight amber accent, with earthy sage and terracotta reserved strictly for inflows and outflows.

### Primary
- **Lamplight Amber** (`#E9A94A` dark / `#8A5410` light): Reserved for primary actions, the recording FAB, brand heart tile, came marks, and proportional bottom-up pane illumination. Foreground on lamplight is always high-contrast hardwood (`#241C16`) in dark mode and warm ivory (`#FBF6EC`) in light mode — never white on `#E9A94A`.

### Neutral
- **Dark Hardwood Frame** (`#1C1613` dark / `#F4ECDD` light): Root canvas and window frame background.
- **Room Ground** (`#221A15` dark / `#FBF6EC` light): Elevated surfaces, form inputs, sheets, modals, and the bottom tab bar.
- **Capiz Pane** (`#2A211B` dark / `#F1E6D2` light): Individual wallet panes, picker tiles, and keypad surfaces.
- **Muntin Line** (`#3B2F26` dark / `#D9C9AC` light): 1px structural borders, list hairlines, and 4px pane grid gaps.
- **Capiz Ivory / Plate** (`#F4ECDD` dark / `#241C16` light): High-contrast transom plate and snackbar surface, paired with inverse plate ink (`#241C16` dark / `#F4ECDD` light).
- **Primary & Secondary Ink** (`#F4ECDD` / `#B9B0A2` / `#8A8073` dark; `#241C16` / `#5F5449` / `#8A7C6C` light): Warm ivory and sepia-toned muted text for labels, dates, and proof lines.

### Semantic
- **Sage Growth** (`#6FA98A` dark / `#2F6B4F` light): Income amounts, positive inflow bars, and the offline-saved dot.
- **Terracotta Spend** (`#D07A63` dark / `#A8412B` light): Expenses, negative balances, destructive actions, and validation errors.

**The Single Transom Rule.** Only the top total-balance transom on a window (and transient snackbars) may use the inverted `plate` surface; all other containers remain in the hardwood/ground/pane ramp.

**The Brand-Ink Contrast Rule.** Never place `#FFFFFF` text or icons on `#E9A94A` lamplight; always use the paired `brandInk` token (`#241C16` dark / `#FBF6EC` light).

## Typography

**Display & Body Font:** `Archivo` (`Archivo_400Regular`, `Archivo_500Medium`, `Archivo_600SemiBold`, `Archivo_700Bold`)
**Label / Figure Treatment:** `Archivo_600SemiBold` / `Archivo_700Bold` with `tabular-nums`

**Character:** One geometric-grotesque workhorse family carries every role from the monumental transom total down to 10px tracked labels, keeping dense financial rows scannable without decorative display pairings.

### Hierarchy
- **Monumental Total** (Bold `700`, `34px`, `40px` line-height, `tabular-nums`): Used once per screen for the transom total balance.
- **Screen Title** (Bold `700`, `24px`): Used for stack and tab screen titles (`ScreenHeader`, onboarding, settings, transaction forms).
- **Heading / List Primary** (SemiBold `600`, `15px`–`17px`): Brand bar title (`15px`), section headings, wallet names, and primary ledger amounts (`15px` tabular).
- **Body** (Regular `400`, `14px`–`16px`): Form inputs, empty-state guidance, and descriptive copy.
- **Tracked Label** (SemiBold `600`, `10px`–`11px`, `0.14em` tracking, uppercase): Transom header (`OVERALL TOTAL WALLET`), `IN` / `OUT` / `NET` headers, month badge, and `CASH FLOW & BALANCE` header.

**The Tabular Figures Rule.** Every currency amount, percentage, entry count, and PIN digit renders with `fontVariant: ['tabular-nums']` so columns never jitter as balances update.

## Layout

Portrait-first phone layout (`adaptive` across Android and iOS) using a `20px` horizontal screen gutter (`px-5`), `4px` (`xs`) muntin gaps inside the Capiz Window grid, and `16px` (`lg`) to `24px` (`xl`) separation between major sections. Scroll views reserve `96px` bottom padding whenever a floating action button is present so the last ledger row clears both the FAB and the bottom tab bar.

## Elevation & Depth

Depth is conveyed through **tonal surface stepping and 1px muntin borders**, not drop shadows. The canvas (`#1C1613`), surface (`#221A15`), and pane (`#2A211B`) step upward in warmth while borders (`1px`) separate adjacent regions. Only the floating action button and drawer backdrop carry subtle elevation above scrolling content.

**The Flat-Pane Rule.** Cards, wallet panes, and input fields never stack shadows or nest cards inside cards; lists inside a container separate rows with `1px` bottom hairlines.

## Shapes

- **Window Frame (`20px`):** Outer shell wrapping the transom and pane grid (`rounded-window`).
- **Pane / Button / Input (`12px`):** Standard structural unit for wallet panes, buttons, inputs, pickers, chips, and icon tiles (`rounded-pane`).
- **Top-Rounded Sheets (`20px`):** Bottom picker sheets use `20px` top corners and a `4px` handle bar.
- **Circular Controls (`999px`):** PIN pad keys, avatars, and the floating action button.

**The Came Mark Rule.** Active filter chips, wallet kind presets, theme options, type toggles, and category tiles mark selection with a drawn corner came mark (`CameMark`) in addition to border and fill shifts so state never depends on color alone.

## Components

Components share one quiet, tactile vocabulary across tabs, auth flows, and sheets.

### Buttons
- **Shape:** `12px` radius (`rounded-pane`), `48px` (`md`) or `56px` (`lg`) height.
- **Primary:** `bg-brand` with `brand-ink` label and border; disabled adds a dashed border alongside `0.48` opacity.
- **Secondary / Ghost / Danger:** `secondary` uses `bg-surface` with `1px` `border-line`; `ghost` is borderless `text-brand`; `danger` uses `bg-expense` with `text-brand-ink`.

### Chips & Selectors
- **Style:** `12px` radius (`rounded-pane`), `min-h-[44px]` touch target, `1px` border.
- **State:** Selected chips switch to `brand-light` or `brand` fill and render a top-right `CameMark`.

### Inputs & Money Fields
- **Style:** `56px` height, `12px` radius, `bg-surface`, `1px` `border-line` (switching to `border-expense` on validation error).
- **Money Input:** Leading `₱` glyph in `ink-faint` with `tabular-nums` numeric entry.

### Navigation
- **Brand Header (`AppHeader`):** Persistent top bar inside the safe area with menu trigger, `26px` lamplight heart tile (`6px` radius), `"MyBlessings"` (`15px`), and the `MMM yyyy` month badge (`44px` minimum hit target on the menu button).
- **Bottom Tabs:** Five tabs (`Home`, `Transactions`, `Wallets`, `Budgets`, `Reports`) on `surface` background with `1px` top border and `Archivo_600SemiBold` `11px` labels.

### Signature Component: `CapizWindow`
- **Structure:** A `20px`-framed window with `4px` padding containing the `88px+` `plate` transom (`OVERALL TOTAL WALLET`, offline-saved dot, `34px` total balance derived from all active wallets and ledger transactions, entry/wallet proof line) above a 2-column grid of wallet panes (`Wallet + Income - Expenses` breakdown, no inline `Add Wallet` slot).
- **Reports Charts (`CashFlowChart` & `BreakdownPieChart`):** Multi-line SVG trend chart (`TOTAL CASH ON HAND`, `INCOME`, `EXPENSE`) and interactive SVG donut breakdown chart (`Expenses` / `Income` / `Wallets`) synchronized across `7D`, `30D`, and `Month` windows on the Reports tab.
- **Navigation Drawer (`Sidebar`):** Profile header followed by `History`, `About` (app name, version, developer), `Settings`, and `Logout`.

## Do's and Don'ts

### Do:
- **Do** keep `dark` (lamplit room) as the default exposure while supporting `light` (daylight) and `system` via theme tokens.
- **Do** include `CameMark` on selectable chips, toggles, and presets so selection is structurally legible.
- **Do** enforce `tabular-nums` and integer centavos (`₱`) on every financial amount and proof metric.
- **Do** keep every touch target at `44px`–`48px` minimum height/width.

### Don't:
- **Don't** place `#FFFFFF` text or icons on `#E9A94A` lamplight; use `brandInk`.
- **Don't** add eyebrow/kicker labels above headings (`ScreenHeader` or section headers).
- **Don't** nest cards inside cards or add decorative charts, gradients, or trust badges outside the proportional pane lamplight.
- **Don't** auto-seed wallets or fake balances; empty states must teach and invite manual creation.
