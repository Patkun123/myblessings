import { accentColors, normalizeAccent } from '@/constants/theme';
import type { WalletBalanceRow } from '@/db/queries/wallet';
import type { Centavos } from '@/domain/money';

export type PieBreakdownMode = 'expense' | 'income' | 'wallets';

export type CategoryAggregateRow = {
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  totalCentavos: Centavos;
};

export type PieSlice = {
  id: string;
  label: string;
  centavos: Centavos;
  percent: number;
  color: string;
};

/**
 * Distinct warm Capiz-aligned slice hues so multiple categories sharing the
 * same semantic group (e.g. multiple expense categories) stay distinguishable.
 */
const CAPIZ_SLICE_PALETTE = [
  accentColors.giving,
  accentColors.income,
  accentColors.expense,
  accentColors.plum,
  '#C9892B',
  '#5A7D8C',
  accentColors.neutral,
] as const;

const MAX_NAMED_SLICES = 6;

function pickDistinctColor(preferred: string | null | undefined, used: Set<string>, index: number): string {
  const normalized = preferred ? normalizeAccent(preferred) : null;
  if (normalized && !used.has(normalized.toUpperCase())) {
    used.add(normalized.toUpperCase());
    return normalized;
  }

  for (let offset = 0; offset < CAPIZ_SLICE_PALETTE.length; offset += 1) {
    const candidate = CAPIZ_SLICE_PALETTE[(index + offset) % CAPIZ_SLICE_PALETTE.length]!;
    if (!used.has(candidate.toUpperCase())) {
      used.add(candidate.toUpperCase());
      return candidate;
    }
  }

  return CAPIZ_SLICE_PALETTE[index % CAPIZ_SLICE_PALETTE.length]!;
}

function finalizeSlices(
  items: { id: string; label: string; centavos: Centavos; preferredColor?: string | null }[]
): PieSlice[] {
  const positive = items
    .filter((item) => item.centavos > 0)
    .sort((a, b) => b.centavos - a.centavos);

  if (positive.length === 0) return [];

  const grouped =
    positive.length > MAX_NAMED_SLICES
      ? [
          ...positive.slice(0, MAX_NAMED_SLICES - 1),
          {
            id: 'other',
            label: 'Other',
            centavos: positive
              .slice(MAX_NAMED_SLICES - 1)
              .reduce((sum, item) => sum + item.centavos, 0),
            preferredColor: accentColors.neutral,
          },
        ]
      : positive;

  const total = grouped.reduce((sum, item) => sum + item.centavos, 0);
  if (total <= 0) return [];

  const usedColors = new Set<string>();
  return grouped.map((item, index) => ({
    id: item.id,
    label: item.label,
    centavos: item.centavos,
    percent: Math.max(1, Math.round((item.centavos / total) * 100)),
    color: pickDistinctColor(item.preferredColor, usedColors, index),
  }));
}

export function buildCategorySlices(rows: readonly CategoryAggregateRow[]): PieSlice[] {
  return finalizeSlices(
    rows.map((row, idx) => ({
      id: row.categoryId ?? `uncategorized-${idx}`,
      label: row.categoryName?.trim() || 'Uncategorized',
      centavos: row.totalCentavos,
      preferredColor: row.categoryColor,
    }))
  );
}

export function buildWalletSlices(wallets: readonly WalletBalanceRow[]): PieSlice[] {
  return finalizeSlices(
    wallets.map((wallet) => ({
      id: wallet.id,
      label: wallet.name,
      centavos: wallet.balanceCentavos,
      preferredColor: wallet.color,
    }))
  );
}

function polarToCartesian(cx: number, cy: number, radius: number, angleRad: number) {
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  };
}

/**
 * Generates an SVG `<Path>` string for a donut slice from `startAngleRad` to
 * `endAngleRad` (radians, where `-Math.PI / 2` is 12 o'clock). Handles full
 * 360-degree circles cleanly when a single slice represents 100%.
 */
export function describePieSectorPath(
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  startAngleRad: number,
  endAngleRad: number
): string {
  const sweep = endAngleRad - startAngleRad;
  if (sweep <= 0) return '';

  // Full circle: split into two 180° arcs because SVG A-commands collapse when start == end.
  if (sweep >= Math.PI * 2 - 0.0001) {
    const midAngle = startAngleRad + Math.PI;
    const outerStart = polarToCartesian(cx, cy, outerRadius, startAngleRad);
    const outerMid = polarToCartesian(cx, cy, outerRadius, midAngle);
    const innerStart = polarToCartesian(cx, cy, innerRadius, startAngleRad);
    const innerMid = polarToCartesian(cx, cy, innerRadius, midAngle);

    if (innerRadius <= 0) {
      return [
        `M ${outerStart.x.toFixed(2)} ${outerStart.y.toFixed(2)}`,
        `A ${outerRadius} ${outerRadius} 0 1 1 ${outerMid.x.toFixed(2)} ${outerMid.y.toFixed(2)}`,
        `A ${outerRadius} ${outerRadius} 0 1 1 ${outerStart.x.toFixed(2)} ${outerStart.y.toFixed(2)}`,
        'Z',
      ].join(' ');
    }

    return [
      `M ${outerStart.x.toFixed(2)} ${outerStart.y.toFixed(2)}`,
      `A ${outerRadius} ${outerRadius} 0 1 1 ${outerMid.x.toFixed(2)} ${outerMid.y.toFixed(2)}`,
      `A ${outerRadius} ${outerRadius} 0 1 1 ${outerStart.x.toFixed(2)} ${outerStart.y.toFixed(2)}`,
      `M ${innerStart.x.toFixed(2)} ${innerStart.y.toFixed(2)}`,
      `A ${innerRadius} ${innerRadius} 0 1 0 ${innerMid.x.toFixed(2)} ${innerMid.y.toFixed(2)}`,
      `A ${innerRadius} ${innerRadius} 0 1 0 ${innerStart.x.toFixed(2)} ${innerStart.y.toFixed(2)}`,
      'Z',
    ].join(' ');
  }

  const largeArcFlag = sweep > Math.PI ? 1 : 0;
  const outerStart = polarToCartesian(cx, cy, outerRadius, startAngleRad);
  const outerEnd = polarToCartesian(cx, cy, outerRadius, endAngleRad);

  if (innerRadius <= 0) {
    return [
      `M ${cx.toFixed(2)} ${cy.toFixed(2)}`,
      `L ${outerStart.x.toFixed(2)} ${outerStart.y.toFixed(2)}`,
      `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerEnd.x.toFixed(2)} ${outerEnd.y.toFixed(2)}`,
      'Z',
    ].join(' ');
  }

  const innerStart = polarToCartesian(cx, cy, innerRadius, endAngleRad);
  const innerEnd = polarToCartesian(cx, cy, innerRadius, startAngleRad);

  return [
    `M ${outerStart.x.toFixed(2)} ${outerStart.y.toFixed(2)}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${outerEnd.x.toFixed(2)} ${outerEnd.y.toFixed(2)}`,
    `L ${innerStart.x.toFixed(2)} ${innerStart.y.toFixed(2)}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerEnd.x.toFixed(2)} ${innerEnd.y.toFixed(2)}`,
    'Z',
  ].join(' ');
}

export type AngleSector = {
  id: string;
  startAngle: number;
  endAngle: number;
};

/**
 * Hit-tests `(x, y)` against donut ring sectors whose angles start at `-π/2`
 * (12 o'clock) and advance clockwise up to `3π/2`.
 */
export function findSliceAtPoint(
  x: number,
  y: number,
  center: number,
  innerRadius: number,
  outerRadius: number,
  sectors: readonly AngleSector[]
): string | null {
  const dx = x - center;
  const dy = y - center;
  const distance = Math.hypot(dx, dy);

  if (distance < innerRadius - 4 || distance > outerRadius + 8) {
    return null;
  }

  let angle = Math.atan2(dy, dx);
  if (angle < -Math.PI / 2) {
    angle += Math.PI * 2;
  }

  for (const sector of sectors) {
    if (angle >= sector.startAngle && angle <= sector.endAngle) {
      return sector.id;
    }
  }

  return null;
}
