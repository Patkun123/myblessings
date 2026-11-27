import { useState } from 'react';
import { type GestureResponderEvent, Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { CameMark } from '@/components/ui/CameMark';
import {
  describePieSectorPath,
  findSliceAtPoint,
  type PieBreakdownMode,
  type PieSlice,
} from '@/domain/breakdown';
import { formatPeso } from '@/domain/money';
import type { TrendRange } from '@/domain/trend';
import { useBreakdownSlices } from '@/hooks/useBreakdownSlices';
import { useThemeColors } from '@/stores/themeStore';

const MODE_OPTIONS: readonly { value: PieBreakdownMode; label: string }[] = [
  { value: 'expense', label: 'Expenses' },
  { value: 'income', label: 'Income' },
  { value: 'wallets', label: 'Wallets' },
];

const MODE_CENTER_TITLE: Record<PieBreakdownMode, string> = {
  expense: 'TOTAL SPENT',
  income: 'TOTAL INCOME',
  wallets: 'TOTAL WALLETS',
};

const MODE_SUBTITLE: Record<PieBreakdownMode, string> = {
  expense: 'Spending by category',
  income: 'Inflows by category',
  wallets: 'Share across active wallets',
};

const MODE_EMPTY_COPY: Record<PieBreakdownMode, string> = {
  expense: 'No expenses recorded in this period.',
  income: 'No income recorded in this period.',
  wallets: 'No active wallets with a positive balance.',
};

const DONUT_SIZE = 188;
const CENTER = DONUT_SIZE / 2;
const OUTER_RADIUS = 84;
const INNER_RADIUS = 50;

type BreakdownPieChartProps = {
  range: TrendRange;
  className?: string;
};

type PieSector = {
  slice: PieSlice;
  path: string;
  startAngle: number;
  endAngle: number;
  isSelected: boolean;
};

function buildSectors(
  slices: readonly PieSlice[],
  totalCentavos: number,
  selectedId: string | null
): PieSector[] {
  const sectors: PieSector[] = [];
  let angle = -Math.PI / 2;

  for (const slice of slices) {
    const sweep = totalCentavos > 0 ? (slice.centavos / totalCentavos) * Math.PI * 2 : 0;
    const startAngle = angle;
    const endAngle = angle + sweep;
    angle = endAngle;

    const isSelected = selectedId === slice.id;
    const radiusBoost = isSelected ? 4 : 0;

    sectors.push({
      slice,
      path: describePieSectorPath(
        CENTER,
        CENTER,
        OUTER_RADIUS + radiusBoost,
        INNER_RADIUS,
        startAngle,
        endAngle
      ),
      startAngle,
      endAngle,
      isSelected,
    });
  }

  return sectors;
}

/**
 * Capiz-styled SVG donut chart on Reports showing category expenses, category
 * income, or active wallet shares synced to the Reports period range.
 */
export function BreakdownPieChart({ range, className }: BreakdownPieChartProps) {
  const [mode, setMode] = useState<PieBreakdownMode>('expense');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const themeColors = useThemeColors();

  const { slices, totalCentavos } = useBreakdownSlices(range, mode);

  const selectedSlice: PieSlice | null =
    selectedId !== null ? (slices.find((slice) => slice.id === selectedId) ?? null) : null;

  const sectors = buildSectors(slices, totalCentavos, selectedSlice?.id ?? null);

  function toggleSlice(id: string) {
    setSelectedId((prev) => (prev === id ? null : id));
  }

  function handleDonutPress(event: GestureResponderEvent) {
    const native = event.nativeEvent as GestureResponderEvent['nativeEvent'] & {
      offsetX?: number;
      offsetY?: number;
    };
    const x = typeof native.locationX === 'number' ? native.locationX : native.offsetX;
    const y = typeof native.locationY === 'number' ? native.locationY : native.offsetY;
    if (typeof x !== 'number' || typeof y !== 'number') return;

    const hitId = findSliceAtPoint(
      x,
      y,
      CENTER,
      INNER_RADIUS,
      OUTER_RADIUS,
      sectors.map((s) => ({ id: s.slice.id, startAngle: s.startAngle, endAngle: s.endAngle }))
    );
    if (hitId) toggleSlice(hitId);
  }

  return (
    <View className={`rounded-pane border border-line bg-surface p-3.5 ${className ?? ''}`}>
      {/* Header + mode pills */}
      <View className="flex-row items-center justify-between gap-2">
        <View>
          <Text className="font-body-semibold text-[10px] tracking-label text-ink-faint">
            BREAKDOWN
          </Text>
          <Text className="mt-0.5 font-body text-[11px] text-ink-muted">
            {MODE_SUBTITLE[mode]}
          </Text>
        </View>

        <View className="flex-row gap-1">
          {MODE_OPTIONS.map((option) => {
            const selected = mode === option.value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                accessibilityLabel={`Show ${option.label} breakdown`}
                accessibilityState={{ selected }}
                hitSlop={4}
                onPress={() => {
                  setMode(option.value);
                  setSelectedId(null);
                }}
                className={`relative min-h-[32px] items-center justify-center overflow-hidden rounded-sm border px-2.5 ${
                  selected ? 'border-brand bg-brand-light' : 'border-line bg-canvas'
                }`}
              >
                <CameMark active={selected} />
                <Text
                  className={`text-[11px] ${
                    selected ? 'font-body-semibold text-brand' : 'font-body-medium text-ink-muted'
                  }`}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {slices.length === 0 ? (
        <View className="mt-4 items-center justify-center rounded-sm border border-dashed border-line px-4 py-8">
          <Text className="text-center font-body text-xs text-ink-muted">
            {MODE_EMPTY_COPY[mode]}
          </Text>
        </View>
      ) : (
        <>
          {/* Donut chart with centered readout */}
          <View className="mt-4 items-center justify-center">
            <View
              className="relative items-center justify-center"
              style={{ width: DONUT_SIZE, height: DONUT_SIZE }}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Select breakdown slice"
                onPress={handleDonutPress}
                style={{ width: DONUT_SIZE, height: DONUT_SIZE }}
              >
                <Svg width={DONUT_SIZE} height={DONUT_SIZE} pointerEvents="none">
                  {sectors.map(({ slice, path, isSelected }) => (
                    <Path
                      key={slice.id}
                      d={path}
                      fill={slice.color}
                      opacity={selectedSlice && !isSelected ? 0.4 : 1}
                      stroke={themeColors.surface}
                      strokeWidth={slices.length > 1 ? 2 : 0}
                    />
                  ))}
                </Svg>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  selectedSlice ? `Clear ${selectedSlice.label} selection` : MODE_CENTER_TITLE[mode]
                }
                onPress={() => {
                  if (selectedSlice) setSelectedId(null);
                }}
                className="absolute items-center justify-center px-2"
                style={{ width: INNER_RADIUS * 1.75 }}
              >
                <Text
                  numberOfLines={1}
                  className="font-body-semibold text-[9px] tracking-label text-ink-faint"
                >
                  {selectedSlice ? selectedSlice.label.toUpperCase() : MODE_CENTER_TITLE[mode]}
                </Text>
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  style={{ fontVariant: ['tabular-nums'] }}
                  className="mt-0.5 font-body-bold text-sm tabular-nums text-ink"
                >
                  {formatPeso(selectedSlice ? selectedSlice.centavos : totalCentavos)}
                </Text>
                <Text
                  style={{ fontVariant: ['tabular-nums'] }}
                  className="mt-0.5 font-body text-[10px] tabular-nums text-ink-muted"
                >
                  {selectedSlice
                    ? `${selectedSlice.percent}% share`
                    : `${slices.length} ${slices.length === 1 ? 'item' : 'items'}`}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Hairline-separated legend */}
          <View className="mt-4 rounded-sm border border-line bg-pane px-3">
            {slices.map((slice, index) => {
              const isSelected = selectedSlice?.id === slice.id;
              return (
                <Pressable
                  key={slice.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${slice.label}, ${slice.percent} percent`}
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => toggleSlice(slice.id)}
                  className={`flex-row items-center justify-between py-2.5 ${
                    index === slices.length - 1 ? '' : 'border-b border-line'
                  }`}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.78 : selectedSlice && !isSelected ? 0.55 : 1,
                  })}
                >
                  <View className="mr-3 flex-1 flex-row items-center">
                    <View
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: slice.color }}
                    />
                    <Text
                      numberOfLines={1}
                      className={`ml-2.5 flex-1 text-xs ${
                        isSelected ? 'font-body-bold text-brand' : 'font-body-medium text-ink'
                      }`}
                    >
                      {slice.label}
                    </Text>
                  </View>

                  <View className="flex-row items-center gap-2.5">
                    <Text
                      style={{ fontVariant: ['tabular-nums'] }}
                      className="font-body-semibold text-[11px] tabular-nums text-ink-muted"
                    >
                      {`${slice.percent}%`}
                    </Text>
                    <Text
                      style={{ fontVariant: ['tabular-nums'] }}
                      className="min-w-[78px] text-right font-body-bold text-xs tabular-nums text-ink"
                    >
                      {formatPeso(slice.centavos)}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </>
      )}
    </View>
  );
}
