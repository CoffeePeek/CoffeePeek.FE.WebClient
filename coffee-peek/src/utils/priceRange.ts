/**
 * Price-range helpers for coffee shop UI (Budget / Moderate / Premium).
 */

export type PriceRangeTier = 1 | 2 | 3;

export function getPriceRangeTier(priceRange: number | string | null | undefined): PriceRangeTier | null {
  if (priceRange === undefined || priceRange === null || priceRange === '') return null;

  if (priceRange === 'Budget' || priceRange === 1 || priceRange === '1') return 1;
  if (priceRange === 'Moderate' || priceRange === 2 || priceRange === '2') return 2;
  if (priceRange === 'Premium' || priceRange === 'Expensive' || priceRange === 3 || priceRange === '3') return 3;
  if (priceRange === 'Luxury' || priceRange === 4 || priceRange === '4') return 3; // map luxury → 3 marks in consumer UI

  return null;
}

export const PRICE_FILTER_OPTIONS = [
  { value: 'Budget', label: 'Бюджетный', tiers: 1 as PriceRangeTier },
  { value: 'Moderate', label: 'Средний', tiers: 2 as PriceRangeTier },
  { value: 'Premium', label: 'Премиум', tiers: 3 as PriceRangeTier },
] as const;
