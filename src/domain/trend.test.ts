import {
  buildTrendSeries,
  computeTrendBounds,
  formatCompactPesoAxis,
  getTrendDateWindow,
} from '@/domain/trend';

describe('getTrendDateWindow', () => {
  const ref = new Date(2026, 10, 27); // 2026-11-27

  it('returns 7 inclusive calendar days for 7D', () => {
    expect(getTrendDateWindow('7D', ref)).toEqual({
      start: '2026-11-21',
      end: '2026-11-27',
    });
  });

  it('returns 30 inclusive calendar days for 30D', () => {
    expect(getTrendDateWindow('30D', ref)).toEqual({
      start: '2026-10-29',
      end: '2026-11-27',
    });
  });

  it('returns 1st of month through reference day for MONTH', () => {
    expect(getTrendDateWindow('MONTH', ref)).toEqual({
      start: '2026-11-01',
      end: '2026-11-27',
    });
  });
});

describe('buildTrendSeries', () => {
  it('fills empty days and carries cumulative wallet balance across transactions', () => {
    const series = buildTrendSeries({
      start: '2026-11-24',
      end: '2026-11-27',
      startingBalanceCentavos: 50_000, // ₱500.00
      dailyRows: [
        {
          occurredOn: '2026-11-25',
          incomeCentavos: 100_000,
          expenseCentavos: 0,
          netLedgerCentavos: 100_000,
        },
        {
          occurredOn: '2026-11-27',
          incomeCentavos: 0,
          expenseCentavos: 25_050,
          netLedgerCentavos: -25_050,
        },
      ],
    });

    expect(series.map((p) => p.date)).toEqual([
      '2026-11-24',
      '2026-11-25',
      '2026-11-26',
      '2026-11-27',
    ]);
    expect(series.map((p) => p.balanceCentavos)).toEqual([50_000, 150_000, 150_000, 124_950]);
    expect(series.map((p) => p.incomeCentavos)).toEqual([0, 100_000, 0, 0]);
    expect(series.map((p) => p.expenseCentavos)).toEqual([0, 0, 0, 25_050]);
  });

  it('handles negative balances cleanly', () => {
    const series = buildTrendSeries({
      start: '2026-11-26',
      end: '2026-11-27',
      startingBalanceCentavos: 10_000,
      dailyRows: [
        {
          occurredOn: '2026-11-27',
          incomeCentavos: 0,
          expenseCentavos: 30_000,
          netLedgerCentavos: -30_000,
        },
      ],
    });

    expect(series[1]?.balanceCentavos).toBe(-20_000);
    const bounds = computeTrendBounds(series);
    expect(bounds.minCentavos).toBeLessThan(-20_000);
    expect(bounds.maxCentavos).toBeGreaterThan(30_000);
  });
});

describe('formatCompactPesoAxis', () => {
  it('formats zero, hundreds, thousands, and negative ticks compactly', () => {
    expect(formatCompactPesoAxis(0)).toBe('₱0');
    expect(formatCompactPesoAxis(50_000)).toBe('₱500');
    expect(formatCompactPesoAxis(150_000)).toBe('₱1.5k');
    expect(formatCompactPesoAxis(1_200_000)).toBe('₱12k');
    expect(formatCompactPesoAxis(-250_000)).toBe('-₱2.5k');
  });
});
