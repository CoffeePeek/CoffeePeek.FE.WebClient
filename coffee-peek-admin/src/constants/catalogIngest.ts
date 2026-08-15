export type QueueStatus = 'Pending' | 'Skipped' | 'Published' | 'Rejected';
export type CoffeeFocus = 'specialty' | 'coffee_bar' | 'cafe';
export type CollectorBucket = 'priority' | 'review' | 'noise' | 'vending';
export type GoogleBusinessStatus =
  | 'Operational'
  | 'ClosedPermanently'
  | 'ClosedTemporarily'
  | 'NotFound'
  | 'Far';

export const QUEUE_STATUS_LABELS: Record<QueueStatus, string> = {
  Pending: 'Ожидает',
  Skipped: 'Позже',
  Published: 'В ленте',
  Rejected: 'Не в ленту',
};

export const COFFEE_FOCUS_OPTIONS: { value: CoffeeFocus; label: string; hint: string; key: string }[] = [
  { value: 'specialty', label: 'Specialty', hint: 'Третья волна / обжарка / origin', key: '1' },
  { value: 'coffee_bar', label: 'Кофейня', hint: 'Кофе — главный продукт', key: '2' },
  { value: 'cafe', label: 'Кафе', hint: 'Еда и атмосфера, кофе всё равно стоит списка', key: '3' },
];

export const COFFEE_FOCUS_LABELS: Record<CoffeeFocus, string> = {
  specialty: 'Specialty',
  coffee_bar: 'Кофейня',
  cafe: 'Кафе',
};

export const BUCKET_LABELS: Record<CollectorBucket, string> = {
  priority: 'Приоритет',
  review: 'Проверить',
  noise: 'Шум',
  vending: 'Вендинг',
};

export const GOOGLE_STATUS_LABELS: Record<GoogleBusinessStatus, string> = {
  Operational: 'Работает',
  ClosedPermanently: 'Закрыто',
  ClosedTemporarily: 'Временно закрыто',
  NotFound: 'Не найдено',
  Far: 'Далеко',
};

export const CATALOG_TAG_OPTIONS: { slug: string; label: string }[] = [
  { slug: 'to_go', label: 'С собой' },
  { slug: 'roastery', label: 'Обжарка' },
  { slug: 'bakery', label: 'Пекарня' },
  { slug: 'laptop_friendly', label: 'Ноутбук' },
  { slug: 'pet_friendly', label: 'С животными' },
  { slug: 'pour_over', label: 'Пуровер' },
  { slug: 'quiet_work', label: 'Тихая работа' },
  { slug: 'specialty', label: 'Specialty-тег' },
];

const FOCUS_ALIASES: Record<string, CoffeeFocus> = {
  specialty: 'specialty',
  Specialty: 'specialty',
  '0': 'specialty',
  coffee_bar: 'coffee_bar',
  CoffeeBar: 'coffee_bar',
  coffeeBar: 'coffee_bar',
  good_coffee: 'coffee_bar',
  '1': 'coffee_bar',
  cafe: 'cafe',
  Cafe: 'cafe',
  '2': 'cafe',
};

const BUCKET_ALIASES: Record<string, CollectorBucket> = {
  priority: 'priority',
  Priority: 'priority',
  '0': 'priority',
  review: 'review',
  Review: 'review',
  '1': 'review',
  noise: 'noise',
  Noise: 'noise',
  '2': 'noise',
  vending: 'vending',
  Vending: 'vending',
  '3': 'vending',
};

const GOOGLE_ALIASES: Record<string, GoogleBusinessStatus> = {
  Operational: 'Operational',
  OPERATIONAL: 'Operational',
  '0': 'Operational',
  ClosedPermanently: 'ClosedPermanently',
  CLOSED_PERMANENTLY: 'ClosedPermanently',
  '1': 'ClosedPermanently',
  ClosedTemporarily: 'ClosedTemporarily',
  CLOSED_TEMPORARILY: 'ClosedTemporarily',
  '2': 'ClosedTemporarily',
  NotFound: 'NotFound',
  NOT_FOUND: 'NotFound',
  '3': 'NotFound',
  Far: 'Far',
  FAR: 'Far',
  '4': 'Far',
};

export function parseCoffeeFocus(value: unknown): CoffeeFocus | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  return FOCUS_ALIASES[String(value)];
}

export function parseBucket(value: unknown): CollectorBucket | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  return BUCKET_ALIASES[String(value)];
}

export function parseGoogleStatus(value: unknown): GoogleBusinessStatus | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  return GOOGLE_ALIASES[String(value)];
}

export function isClosedPermanently(status?: GoogleBusinessStatus): boolean {
  return status === 'ClosedPermanently';
}

export function isUsableShopName(name?: string): boolean {
  const trimmed = name?.trim() ?? '';
  if (!trimmed) return false;
  const lower = trimmed.toLowerCase();
  return lower !== 'без имени' && lower !== 'unnamed' && !lower.startsWith('node/');
}

export function displayShopName(name?: string, brand?: string): string {
  if (isUsableShopName(name)) return name!.trim();
  if (brand?.trim()) return brand.trim();
  return 'без имени';
}

export function fallbackResearchLinks(input: {
  name?: string;
  brand?: string;
  address?: string;
  instagram?: string;
  website?: string;
  latitude?: number;
  longitude?: number;
  externalId?: string;
  googleMapsUri?: string;
}): {
  instagram: string;
  googleMaps: string;
  yandexMaps: string;
  yandexImages: string;
  osmHistory: string;
} {
  const title = [input.name, input.brand].filter(Boolean).join(' ') || 'кофейня';
  const query = encodeURIComponent([title, input.address].filter(Boolean).join(' '));
  const coords =
    input.latitude != null && input.longitude != null
      ? `${input.latitude},${input.longitude}`
      : '';
  const instagramHandle = input.instagram
    ?.replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .replace(/\/.*$/, '')
    .replace(/^@/, '');

  return {
    googleMaps:
      input.googleMapsUri ||
      (coords
        ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${title} ${coords}`)}`
        : `https://www.google.com/maps/search/?api=1&query=${query}`),
    instagram: instagramHandle
      ? `https://www.instagram.com/${instagramHandle}/`
      : `https://www.instagram.com/explore/search/keyword/?q=${query}`,
    yandexMaps:
      input.latitude != null && input.longitude != null
        ? `https://yandex.ru/maps/?pt=${input.longitude},${input.latitude}&z=17&l=map`
        : `https://yandex.ru/maps/?text=${query}`,
    yandexImages: `https://yandex.ru/images/search?text=${query}`,
    osmHistory: input.externalId
      ? `https://www.openstreetmap.org/${input.externalId}/history`
      : 'https://www.openstreetmap.org/history',
  };
}
