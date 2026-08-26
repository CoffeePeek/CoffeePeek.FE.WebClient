/**
 * Price-range helpers. Matches backend PriceRange: Cheap, Moderate, Expensive, Luxury.
 * Filter UI exposes three cappuccino buckets (+ empty); Luxury maps into «больше 8».
 */

export type PriceRangeLevel = 'Cheap' | 'Moderate' | 'Expensive' | 'Luxury';
export type PriceRangeTier = 1 | 2 | 3 | 4;

export type PriceFilterOption = {
  value: 'Cheap' | 'Moderate' | 'Expensive';
  label: string;
  labelShort: string;
  tiers: 1 | 2 | 3;
};

/** Filter / slider stops (excluding «any»). */
export const PRICE_FILTER_OPTIONS: readonly PriceFilterOption[] = [
  {
    value: 'Cheap',
    label: 'Капучино меньше 8',
    labelShort: 'Капучино < 8',
    tiers: 1,
  },
  {
    value: 'Moderate',
    label: 'Капучино за 8',
    labelShort: 'Капучино за 8',
    tiers: 2,
  },
  {
    value: 'Expensive',
    label: 'Капучино больше 8',
    labelShort: 'Капучино > 8',
    tiers: 3,
  },
] as const;

const TIER_BY_ALIAS: Record<string, PriceRangeTier> = {
  Cheap: 1,
  Budget: 1,
  '1': 1,
  Moderate: 2,
  '2': 2,
  Expensive: 3,
  Premium: 3,
  '3': 3,
  Luxury: 4,
  '4': 4,
};

export function getPriceRangeTier(
  priceRange: number | string | null | undefined
): PriceRangeTier | null {
  if (priceRange === undefined || priceRange === null || priceRange === '') return null;

  if (typeof priceRange === 'number') {
    if (priceRange >= 1 && priceRange <= 4) return priceRange as PriceRangeTier;
    return null;
  }

  return TIER_BY_ALIAS[priceRange] ?? null;
}

export function toPriceRangeLevel(
  priceRange: number | string | null | undefined
): PriceRangeLevel | undefined {
  const tier = getPriceRangeTier(priceRange);
  if (!tier) return undefined;
  if (tier === 1) return 'Cheap';
  if (tier === 2) return 'Moderate';
  if (tier === 3) return 'Expensive';
  return 'Luxury';
}

/** Level used by the price filter slider (Luxury folds into Expensive / «больше 8»). */
export function toPriceFilterLevel(
  priceRange: number | string | null | undefined
): PriceFilterOption['value'] | undefined {
  const level = toPriceRangeLevel(priceRange);
  if (!level) return undefined;
  if (level === 'Luxury') return 'Expensive';
  return level;
}

export function priceFilterLabel(
  priceRange: number | string | null | undefined,
  compact = false
): string {
  const level = toPriceFilterLevel(priceRange);
  if (!level) return '';
  const opt = PRICE_FILTER_OPTIONS.find((o) => o.value === level);
  if (!opt) return '';
  return compact ? opt.labelShort : opt.label;
}

export const PRICE_RANGE_TO_API: Record<string, number> = {
  Cheap: 1,
  Budget: 1,
  Moderate: 2,
  Expensive: 3,
  Premium: 3,
  Luxury: 4,
};
