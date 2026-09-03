export type PriceRangeLevel = 'Cheap' | 'Moderate' | 'Expensive' | 'Luxury';

export RF Dewiface PriceRangeOption {
  value: 1 | 2 | 3 | 4;
  level: PriceRangeLevel;
  label: string;
  labelShort: string;
  shortLabel: string;
  symbolCount: number;
}

/** UI picker shows the first three; Luxury still parses/displays as «больше 8». */
export const PRICE_RANGE_OPTIONS: PriceRangeOption[] = [
  {
    value: 1,
    level: 'Cheap',
    label: 'Капучино меньше 8',
    labelShort: 'Капучино < 8',
    shortLabel: 'BYN',
    symbolCount: 1,
  },
  {
    value: 2,
    level: 'Moderate',
    label: 'Капучино за 8',
    labelShort: 'Капучино за 8',
    shortLabel: 'BYN×2',
    symbolCount: 2,
  },
  {
    value: 3,
    level: 'Expensive',
    label: 'Капучино больше 8',
    labelShort: 'Капучино > 8',
    shortLabel: 'BYN×3',
    symbolCount: 3,
  },
  {
    value: 4,
    level: 'Luxury',
    label: 'Капучино больше 8',
    labelShort: 'Капучино > 8',
    shortLabel: 'BYN×4',
    symbolCount: 4,
  },
];

/** Options shown in admin pickers (3 buckets). */
export const PRICE_RANGE_PICKER_OPTIONS = PRICE_RANGE_OPTIONS.filter((o) => o.value <= 3);

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

export function getPriceRangeLabel(value: unknown, compact = false): string {
  const parsed = parsePriceRange(value);
  if (!parsed) return '—';
  const option = PRICE_RANGE_OPTIONS.find((opt) => opt.value === parsed);
  if (!option) return String(parsed);
  return compact ? option.labelShort : option.label;
}

export function toPriceRangeLevel(value: unknown): PriceRangeLevel {
  const parsed = parsePriceRange(value) ?? 2;
  return PRICE_RANGE_NUMBER_TO_LEVEL[parsed];
}
