import type { WalletBalanceRow } from '@/db/queries/wallet';
import {
  buildCategorySlices,
  buildWalletSlices,
  describePieSectorPath,
  findSliceAtPoint,
} from '@/domain/breakdown';

describe('buildCategorySlices', () => {
  it('filters zero rows, sorts descending, and assigns distinct colors', () => {
    const slices = buildCategorySlices([
      { categoryId: 'c1', categoryName: 'Utilities', categoryColor: '#A8412B', totalCentavos: 20_000 },
      { categoryId: 'c2', categoryName: 'Food', categoryColor: '#A8412B', totalCentavos: 80_000 },
      { categoryId: 'c3', categoryName: 'Empty', categoryColor: '#A8412B', totalCentavos: 0 },
    ]);

    expect(slices.map((s) => s.label)).toEqual(['Food', 'Utilities']);
    expect(slices.map((s) => s.percent)).toEqual([80, 20]);
    expect(new Set(slices.map((s) => s.color)).size).toBe(2);
  });

  it('rolls tail categories beyond 6 into Other', () => {
    const rows = Array.from({ length: 8 }, (_, idx) => ({
      categoryId: `c-${idx}`,
      categoryName: `Category ${idx + 1}`,
      categoryColor: '#A8412B',
      totalCentavos: (8 - idx) * 10_000,
    }));

    const slices = buildCategorySlices(rows);
    expect(slices).toHaveLength(6);
    expect(slices[5]?.label).toBe('Other');
    // Tail items: 30_000 + 20_000 + 10_000 = 60_000
    expect(slices[5]?.centavos).toBe(60_000);
  });
});

describe('buildWalletSlices', () => {
  const makeWallet = (id: string, name: string, balanceCentavos: number): WalletBalanceRow => ({
    id,
    name,
    icon: 'wallet',
    color: '#8A5410',
    openingBalanceCentavos: balanceCentavos,
    incomeCentavos: 0,
    expenseCentavos: 0,
    balanceCentavos,
    transactionCount: 1,
    lastOccurredOn: '2026-11-27',
  });

  it('ignores non-positive wallets and computes shares', () => {
    const slices = buildWalletSlices([
      makeWallet('w1', 'Cash', 75_000),
      makeWallet('w2', 'Bank', 25_000),
      makeWallet('w3', 'Empty', 0),
      makeWallet('w4', 'Overdrawn', -5_000),
    ]);

    expect(slices.map((s) => [s.label, s.percent])).toEqual([
      ['Cash', 75],
      ['Bank', 25],
    ]);
  });
});

describe('describePieSectorPath', () => {
  it('builds a valid SVG path for partial sectors and full 360-degree circles', () => {
    const quarter = describePieSectorPath(94, 94, 84, 50, -Math.PI / 2, 0);
    expect(quarter.startsWith('M ')).toBe(true);
    expect(quarter.includes(' A 84 84 ')).toBe(true);
    expect(quarter.endsWith('Z')).toBe(true);

    const full = describePieSectorPath(94, 94, 84, 50, -Math.PI / 2, (Math.PI * 3) / 2);
    expect(full.startsWith('M ')).toBe(true);
    expect(full.match(/A 84 84 /g)?.length).toBe(2);
    expect(full.match(/A 50 50 /g)?.length).toBe(2);
  });
});

describe('findSliceAtPoint', () => {
  const sectors = [
    { id: 'top-right', startAngle: -Math.PI / 2, endAngle: 0 },
    { id: 'rest', startAngle: 0, endAngle: (Math.PI * 3) / 2 },
  ];

  it('matches ring points by angle and ignores center hole or outside clicks', () => {
    // Center is (94, 94), inner=50, outer=84.
    // Point at (94 + 65, 94 - 20) is in top-right quadrant within ring.
    expect(findSliceAtPoint(159, 74, 94, 50, 84, sectors)).toBe('top-right');
    // Point at (94 - 65, 94) is on the left side (angle π).
    expect(findSliceAtPoint(29, 94, 94, 50, 84, sectors)).toBe('rest');
    // Inside center hole.
    expect(findSliceAtPoint(94, 94, 94, 50, 84, sectors)).toBeNull();
    // Outside outer radius.
    expect(findSliceAtPoint(190, 94, 94, 50, 84, sectors)).toBeNull();
  });
});
