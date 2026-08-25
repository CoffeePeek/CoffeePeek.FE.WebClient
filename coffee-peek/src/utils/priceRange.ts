/**
 * Price-range helpers. Matches backend PriceRange: Cheap, Moderate, Expensive, Luxury.
 */

export type PriceRangeLevel = 'Cheap' | 'Moderate' | 'Expensive' | 'Luxury';
export type PriceRangeTier = 1 | 2 | 3 | 4;

export const PRICE_FILTER_OPTIONS = [
  { value: 'Cheap' as const, label: 'Бюджетно', tiers: 1 as PriceRangeTier },
  { value: 'Moderate' as const, label: 'Средне', tiers: 2 as PriceRangeTier },
  { value: 'Expensive' as const, label: 'Дорого', tiers: 3 as PriceRangeTier },
  { value: 'Luxury' as const, label: 'Премиум', tiers: 4 as PriceRangeTier },
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

export function getPriceRangeTier(priceRange: number | string | null | undefined): PriceRangeTier | null {
  if (priceRange === undefined || priceRange === null || priceRange === '') return null;

  if (typeof priceRange === 'number') {
    if (priceRange >= 1 && priceRange <= 4) return priceRange as PriceRangeTier;
    return null;
  }

  return TIER_BY_ALIAS[priceRange] ?? null;
}

export function toPriceRangeLevel(priceRange: number | string | null | undefined): PriceRangeLevel | undefined {
  const tier = getPriceRangeTier(priceRange);
  if (!tier) return undefined;
  return PRICE_FILTER_OPTIONS[tier - 1].value;
}

export const PRICE_RANGE_TO_API: Record<string, number> = {
  Cheap: 1,
  Budget: 1,
  Moderate: 2,
  Expensive: 3,
  Premium: 3,
  Luxury: 4,
};
