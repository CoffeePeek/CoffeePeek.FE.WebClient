export type PriceRangeLevel = 'Cheap' | 'Moderate' | 'Expensive' | 'Luxury';

export interface PriceRangeOption {
  value: 1 | 2 | 3 | 4;
  level: PriceRangeLevel;
  label: string;
  shortLabel: string;
  symbolCount: number;
}

export const PRICE_RANGE_OPTIONS: PriceRangeOption[] = [
  { value: 1, level: 'Cheap', label: 'Бюджетно', shortLabel: 'BYN', symbolCount: 1 },
  { value: 2, level: 'Moderate', label: 'Средне', shortLabel: 'BYN×2', symbolCount: 2 },
  { value: 3, level: 'Expensive', label: 'Дорого', shortLabel: 'BYN×3', symbolCount: 3 },
  { value: 4, level: 'Luxury', label: 'Премиум', shortLabel: 'BYN×4', symbolCount: 4 },
];

export const PRICE_RANGE_LEVEL_TO_NUMBER: Record<PriceRangeLevel, 1 | 2 | 3 | 4> = {
  Cheap: 1,
  Moderate: 2,
  Expensive: 3,
  Luxury: 4,
};

export const PRICE_RANGE_NUMBER_TO_LEVEL: Record<number, PriceRangeLevel> = {
  1: 'Cheap',
  2: 'Moderate',
  3: 'Expensive',
  4: 'Luxury',
};

export function parsePriceRange(value: unknown): 1 | 2 | 3 | 4 | undefined {
  if (value === undefined || value === null || value === '') return undefined;

  if (typeof value === 'number' && value >= 1 && value <= 4) {
    return value as 1 | 2 | 3 | 4;
  }

  if (typeof value === 'string') {
    const asNum = Number(value);
    if (!Number.isNaN(asNum) && asNum >= 1 && asNum <= 4) {
      return asNum as 1 | 2 | 3 | 4;
    }

    const fromLevel = PRICE_RANGE_LEVEL_TO_NUMBER[value as PriceRangeLevel];
    if (fromLevel) return fromLevel;
  }

  return undefined;
}

export function getPriceRangeLabel(value: unknown): string {
  const parsed = parsePriceRange(value);
  if (!parsed) return '—';
  return PRICE_RANGE_OPTIONS.find((opt) => opt.value === parsed)?.label ?? String(parsed);
}

export function toPriceRangeLevel(value: unknown): PriceRangeLevel {
  const parsed = parsePriceRange(value) ?? 2;
  return PRICE_RANGE_NUMBER_TO_LEVEL[parsed];
}
