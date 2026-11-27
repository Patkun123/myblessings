import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient,
  Path,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import { CameMark } from '@/components/ui/CameMark';
import { formatPeso, sumCentavos } from '@/domain/money';
import {
  computeTrendBounds,
  formatCompactPesoAxis,
  type TrendPoint,
  type TrendRange,
} from '@/domain/trend';
import { useTrendSeries } from '@/hooks/useTrendSeries';
import { useThemeColors } from '@/stores/themeStore';

const RANGE_OPTIONS: readonly { value: TrendRange; label: string }[] = [
  { value: '7D', label: '7D' },
  { value: '30D', label: '30D' },
  { value: 'MONTH', label: 'Month' },
];

const CHART_HEIGHT = 168;
const PAD_LEFT = 46;
const PAD_RIGHT = 12;
const PAD_TOP = 12;
const PAD_BOTTOM = 24;

type PointCoord = { x: number; y: number };

function buildCoords(
  values: readonly number[],
  plotWidth: number,
  plotHeight: number,
  minCentavos: number,
  maxCentavos: number
): PointCoord[] {
  if (values.length === 0) return [];
  const span = Math.max(1, maxCentavos - minCentavos);

  const toY = (value: number) =>
    PAD_TOP + (1 - (value - minCentavos) / span) * plotHeight;

  if (values.length === 1) {
    const y = toY(values[0] ?? 0);
    return [
      { x: PAD_LEFT, y },
      { x: PAD_LEFT + plotWidth, y },
    ];
  }

  return values.map((value, index) => ({
    x: PAD_LEFT + (index / (values.length - 1)) * plotWidth,
    y: toY(value),
  }));
}

function toLinePath(coords: readonly PointCoord[]): string {
  if (coords.length === 0) return '';
  return coords
    .map((pt, index) => `${index === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
    .join(' ');
}

function toAreaPath(coords: readonly PointCoord[], baseY: number): string {
  const first = coords[0];
  const last = coords[coords.length - 1];
  if (!first || !last) return '';
  const line = toLinePath(coords);
  return `${line} L ${last.x.toFixed(1)} ${baseY.toFixed(1)} L ${first.x.toFixed(1)} ${baseY.toFixed(1)} Z`;
}

type CashFlowChartProps = {
  hasWallets: boolean;
  currentBalanceCentavos: number;
  range?: TrendRange;
  onRangeChange?: (next: TrendRange) => void;
  showRangeToggle?: boolean;
  className?: string;
};

/**
 * Multi-line Capiz Window trend chart displaying Total Cash on Hand (wallet
 * balance trajectory) alongside daily Income and Expense lines.
 */
export function CashFlowChart({
  hasWallets,
  currentBalanceCentavos,
  range: controlledRange,
  onRangeChange,
  showRangeToggle = true,
  className,
}: CashFlowChartProps) {
  const [internalRange, setInternalRange] = useState<TrendRange>('7D');
  const range = controlledRange ?? internalRange;
  const [selection, setSelection] = useState<{ range: TrendRange; index: number | null }>({
    range,
    index: null,
  });
  const [chartWidth, setChartWidth] = useState(320);

  const selectedIndex = selection.range === range ? selection.index : null;
  function setSelectedIndex(updater: number | null | ((prev: number | null) => number | null)) {
    setSelection((prev) => {
      const currentIdx = prev.range === range ? prev.index : null;
      const nextIdx = typeof updater === 'function' ? updater(currentIdx) : updater;
      return { range, index: nextIdx };
    });
  }

  function handleSelectRange(next: TrendRange) {
    if (onRangeChange) onRangeChange(next);
    if (controlledRange === undefined) setInternalRange(next);
    setSelection({ range: next, index: null });
  }

  const themeColors = useThemeColors();
  const { points, periodIncomeCentavos, periodExpenseCentavos, hasActivity } =
    useTrendSeries(range);

  const activeIndex =
    selectedIndex !== null && selectedIndex >= 0 && selectedIndex < points.length
      ? selectedIndex
      : null;
  const inspectedPoint: TrendPoint | null =
    activeIndex !== null ? (points[activeIndex] ?? null) : null;

  const plotWidth = Math.max(120, chartWidth - PAD_LEFT - PAD_RIGHT);
  const plotHeight = CHART_HEIGHT - PAD_TOP - PAD_BOTTOM;
  const { minCentavos, maxCentavos } = computeTrendBounds(points);
  const span = Math.max(1, maxCentavos - minCentavos);

  const balanceCoords = buildCoords(
    points.map((p) => p.balanceCentavos),
    plotWidth,
    plotHeight,
    minCentavos,
    maxCentavos
  );
  const incomeCoords = buildCoords(
    points.map((p) => p.incomeCentavos),
    plotWidth,
    plotHeight,
    minCentavos,
    maxCentavos
  );
  const expenseCoords = buildCoords(
    points.map((p) => p.expenseCentavos),
    plotWidth,
    plotHeight,
    minCentavos,
    maxCentavos
  );

  const yTicks = [
    maxCentavos,
    Math.round((maxCentavos + minCentavos) / 2),
    minCentavos,
  ];
  const baseY = PAD_TOP + plotHeight;

  const xTickIndices =
    points.length <= 1
      ? [0]
      : points.length === 2
        ? [0, 1]
        : [0, Math.floor((points.length - 1) / 2), points.length - 1];

  const latestPoint = points[points.length - 1] ?? null;
  const displayedBalance = inspectedPoint
    ? inspectedPoint.balanceCentavos
    : latestPoint
      ? latestPoint.balanceCentavos
      : currentBalanceCentavos;
  const displayedIncome = inspectedPoint
    ? inspectedPoint.incomeCentavos
    : periodIncomeCentavos;
  const displayedExpense = inspectedPoint
    ? inspectedPoint.expenseCentavos
    : periodExpenseCentavos;

  const selectedCoordIndex =
    activeIndex === null
      ? points.length > 1
        ? points.length - 1
        : 0
      : activeIndex;

  const selectedX =
    points.length <= 1
      ? PAD_LEFT + plotWidth
      : PAD_LEFT + (selectedCoordIndex / (points.length - 1)) * plotWidth;

  const netPeriodCentavos = sumCentavos([periodIncomeCentavos, -periodExpenseCentavos]);

  return (
    <View className={`rounded-pane border border-line bg-surface p-3.5 ${className ?? 'mt-5'}`}>
      {/* Header & range toggle */}
      <View className="flex-row items-center justify-between gap-2">
        <View>
          <Text className="font-body-semibold text-[10px] tracking-label text-ink-faint">
            CASH FLOW & BALANCE
          </Text>
          <Text
            style={{ fontVariant: ['tabular-nums'] }}
            className="mt-0.5 font-body text-[11px] tabular-nums text-ink-muted"
          >
            {inspectedPoint
              ? `${inspectedPoint.label} · tap point to clear`
              : `Net ${netPeriodCentavos >= 0 ? '+' : ''}${formatPeso(netPeriodCentavos)}`}
          </Text>
        </View>

        {showRangeToggle ? (
          <View className="flex-row gap-1">
            {RANGE_OPTIONS.map((option) => {
              const selected = range === option.value;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="button"
                  accessibilityLabel={`Show ${option.label} trend`}
                  accessibilityState={{ selected }}
                  hitSlop={4}
                  onPress={() => handleSelectRange(option.value)}
                  className={`relative min-h-[32px] min-w-[44px] items-center justify-center overflow-hidden rounded-sm border px-2.5 ${
                    selected ? 'border-brand bg-brand-light' : 'border-line bg-canvas'
                  }`}
                >
                  <CameMark active={selected} />
                  <Text
                    style={{ fontVariant: ['tabular-nums'] }}
                    className={`text-[11px] tabular-nums ${
                      selected ? 'font-body-semibold text-brand' : 'font-body-medium text-ink-muted'
                    }`}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>

      {/* 3-line legend with live / inspected amounts */}
      <View className="mt-3 flex-row items-center justify-between gap-2 rounded-sm border border-line bg-pane px-2.5 py-2">
        <View className="flex-1">
          <View className="flex-row items-center gap-1.5">
            <View className="h-2 w-2 rounded-full" style={{ backgroundColor: themeColors.brand }} />
            <Text className="font-body-semibold text-[10px] tracking-label text-ink-faint">
              WALLET
            </Text>
          </View>
          <Text
            numberOfLines={1}
            style={{ fontVariant: ['tabular-nums'], color: themeColors.ink }}
            className="mt-0.5 font-body-bold text-xs tabular-nums"
          >
            {formatPeso(displayedBalance)}
          </Text>
        </View>

        <View className="flex-1 items-center">
          <View className="flex-row items-center gap-1.5">
            <View className="h-2 w-2 rounded-full" style={{ backgroundColor: themeColors.income }} />
            <Text className="font-body-semibold text-[10px] tracking-label text-ink-faint">
              INCOME
            </Text>
          </View>
          <Text
            numberOfLines={1}
            style={{ fontVariant: ['tabular-nums'], color: themeColors.income }}
            className="mt-0.5 font-body-bold text-xs tabular-nums"
          >
            {formatPeso(displayedIncome)}
          </Text>
        </View>

        <View className="flex-1 items-end">
          <View className="flex-row items-center gap-1.5">
            <View
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: themeColors.expense }}
            />
            <Text className="font-body-semibold text-[10px] tracking-label text-ink-faint">
              EXPENSE
            </Text>
          </View>
          <Text
            numberOfLines={1}
            style={{ fontVariant: ['tabular-nums'], color: themeColors.expense }}
            className="mt-0.5 font-body-bold text-xs tabular-nums"
          >
            {formatPeso(displayedExpense)}
          </Text>
        </View>
      </View>

      {/* Chart body */}
      {!hasWallets ? (
        <View className="mt-3 items-center justify-center rounded-sm border border-dashed border-line py-8">
          <Text className="text-center font-body text-xs text-ink-muted">
            Create a wallet to plot wallet balance and transaction lines.
          </Text>
        </View>
      ) : (
        <View
          className="relative mt-3"
          style={{ height: CHART_HEIGHT }}
          onLayout={(event) => {
            const nextWidth = Math.round(event.nativeEvent.layout.width);
            if (nextWidth > 0 && nextWidth !== chartWidth) {
              setChartWidth(nextWidth);
            }
          }}
        >
          <Svg width={chartWidth} height={CHART_HEIGHT}>
            <Defs>
              <LinearGradient id="walletAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor={themeColors.brand} stopOpacity={0.22} />
                <Stop offset="100%" stopColor={themeColors.brand} stopOpacity={0.01} />
              </LinearGradient>
            </Defs>

            {/* Horizontal gridlines + compact Y-axis ticks */}
            {yTicks.map((tick, idx) => {
              const y = PAD_TOP + (1 - (tick - minCentavos) / span) * plotHeight;
              return (
                <Line
                  key={`grid-${idx}`}
                  x1={PAD_LEFT}
                  y1={y}
                  x2={PAD_LEFT + plotWidth}
                  y2={y}
                  stroke={themeColors.line}
                  strokeWidth={1}
                  strokeDasharray={idx === 2 ? undefined : '3,3'}
                />
              );
            })}

            {yTicks.map((tick, idx) => {
              const y = PAD_TOP + (1 - (tick - minCentavos) / span) * plotHeight;
              return (
                <SvgText
                  key={`ylabel-${idx}`}
                  x={PAD_LEFT - 6}
                  y={y + 3}
                  textAnchor="end"
                  fontSize={10}
                  fontFamily="Archivo_500Medium"
                  fill={themeColors.inkFaint}
                >
                  {formatCompactPesoAxis(tick)}
                </SvgText>
              );
            })}

            {/* Area fill under Wallet Balance line */}
            {balanceCoords.length > 0 ? (
              <Path d={toAreaPath(balanceCoords, baseY)} fill="url(#walletAreaGrad)" />
            ) : null}

            {/* Selected day vertical guide */}
            {activeIndex !== null ? (
              <Line
                x1={selectedX}
                y1={PAD_TOP}
                x2={selectedX}
                y2={baseY}
                stroke={themeColors.inkFaint}
                strokeWidth={1}
                strokeDasharray="2,2"
              />
            ) : null}

            {/* Expense line */}
            {expenseCoords.length > 0 ? (
              <Path
                d={toLinePath(expenseCoords)}
                fill="none"
                stroke={themeColors.expense}
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}

            {/* Income line */}
            {incomeCoords.length > 0 ? (
              <Path
                d={toLinePath(incomeCoords)}
                fill="none"
                stroke={themeColors.income}
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}

            {/* Wallet Balance line (Total Cash on Hand) */}
            {balanceCoords.length > 0 ? (
              <Path
                d={toLinePath(balanceCoords)}
                fill="none"
                stroke={themeColors.brand}
                strokeWidth={2.4}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}

            {/* Endpoint or selected point markers */}
            {balanceCoords.length > 0 ? (
              <>
                <Circle
                  cx={
                    (activeIndex !== null
                      ? expenseCoords[activeIndex]
                      : expenseCoords[expenseCoords.length - 1]
                    )?.x ?? selectedX
                  }
                  cy={
                    (activeIndex !== null
                      ? expenseCoords[activeIndex]
                      : expenseCoords[expenseCoords.length - 1]
                    )?.y ?? baseY
                  }
                  r={activeIndex !== null ? 4 : 3}
                  fill={themeColors.expense}
                />
                <Circle
                  cx={
                    (activeIndex !== null
                      ? incomeCoords[activeIndex]
                      : incomeCoords[incomeCoords.length - 1]
                    )?.x ?? selectedX
                  }
                  cy={
                    (activeIndex !== null
                      ? incomeCoords[activeIndex]
                      : incomeCoords[incomeCoords.length - 1]
                    )?.y ?? baseY
                  }
                  r={activeIndex !== null ? 4 : 3}
                  fill={themeColors.income}
                />
                <Circle
                  cx={
                    (activeIndex !== null
                      ? balanceCoords[activeIndex]
                      : balanceCoords[balanceCoords.length - 1]
                    )?.x ?? selectedX
                  }
                  cy={
                    (activeIndex !== null
                      ? balanceCoords[activeIndex]
                      : balanceCoords[balanceCoords.length - 1]
                    )?.y ?? baseY
                  }
                  r={activeIndex !== null ? 4.5 : 3.5}
                  fill={themeColors.brand}
                  stroke={themeColors.surface}
                  strokeWidth={1.5}
                />
              </>
            ) : null}

            {/* X-axis date ticks */}
            {points.length > 0
              ? xTickIndices.map((idx, pos) => {
                  const pt = points[idx];
                  if (!pt) return null;
                  const x =
                    points.length === 1
                      ? PAD_LEFT + plotWidth / 2
                      : PAD_LEFT + (idx / (points.length - 1)) * plotWidth;
                  const anchor =
                    points.length === 1
                      ? 'middle'
                      : pos === 0
                        ? 'start'
                        : pos === xTickIndices.length - 1
                          ? 'end'
                          : 'middle';
                  return (
                    <SvgText
                      key={`xlabel-${pt.date}-${pos}`}
                      x={x}
                      y={CHART_HEIGHT - 6}
                      textAnchor={anchor}
                      fontSize={10}
                      fontFamily="Archivo_500Medium"
                      fill={themeColors.inkFaint}
                    >
                      {pt.label}
                    </SvgText>
                  );
                })
              : null}
          </Svg>

          {/* Touch columns for inspecting individual days */}
          {points.length > 0 ? (
            <View
              style={{
                position: 'absolute',
                left: PAD_LEFT,
                right: PAD_RIGHT,
                top: PAD_TOP,
                bottom: PAD_BOTTOM,
                flexDirection: 'row',
              }}
            >
              {points.map((point, index) => (
                <Pressable
                  key={point.date}
                  accessibilityRole="button"
                  accessibilityLabel={`Inspect ${point.label}`}
                  onPress={() =>
                    setSelectedIndex((prev) => (prev === index ? null : index))
                  }
                  style={{ flex: 1 }}
                />
              ))}
            </View>
          ) : null}
        </View>
      )}

      {hasWallets && !hasActivity ? (
        <Text className="mt-1 text-center font-body text-[11px] text-ink-faint">
          No transactions in this period yet — wallet baseline is plotted.
        </Text>
      ) : null}
    </View>
  );
}
