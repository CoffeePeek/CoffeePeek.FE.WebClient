import { CoffeeShopStatus } from '../api/admin';
import { BadgeVariant } from '../components/ui/Badge';

export const COFFEE_SHOP_STATUS_LABELS: Record<CoffeeShopStatus, string> = {
  Active: 'Открыта',
  TemporarilyClosed: 'Временно закрыта',
  PermanentlyClosed: 'Закрыта навсегда',
};

export const COFFEE_SHOP_STATUS_HINTS: Record<CoffeeShopStatus, string> = {
  Active: 'Показывается в поиске и на карте',
  TemporarilyClosed: 'Скрыта из поиска и карты, можно снова открыть',
  PermanentlyClosed: 'Больше не работает, скрыта из поиска и карты',
};

export const COFFEE_SHOP_STATUS_OPTIONS: { value: CoffeeShopStatus; label: string }[] = [
  { value: 'Active', label: 'Открыта' },
  { value: 'TemporarilyClosed', label: 'Временно закрыта' },
  { value: 'PermanentlyClosed', label: 'Закрыта навсегда' },
];

export function coffeeShopStatusBadgeVariant(status: CoffeeShopStatus): BadgeVariant {
  switch (status) {
    case 'Active':
      return 'approved';
    case 'TemporarilyClosed':
      return 'pending';
    case 'PermanentlyClosed':
      return 'rejected';
  }
}
