import React, { memo, useState } from 'react';
import { type CoffeeShop, getPhotoUrl } from '../api/coffeeshop';
import { COLORS } from '../constants/colors';
import { useTheme } from '../contexts/ThemeContext';
import { useLocalFavorites } from '../hooks/useLocalFavorites';
import { distanceKm, formatDistance } from '../utils/distance';
import { getPriceRangeTier } from '../utils/priceRange';
import { isShopOpenNow } from '../utils/shopUtils';
import { AppIcon, BeanPriceMarks, StarIcon } from './icons';
import ShopPhotoPlaceholder from './ShopPhotoPlaceholder';

interface ShopCardColors {
  surface: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  background: string;
}

interface ShopCardProps {
  shop: CoffeeShop;
  colors: ShopCardColors;
  userLocation?: { latitude: number; longitude: number } | null;
  onSelect: (shopId: string) => void;
}

function extractPhotos(shop: CoffeeShop): string[] {
  if (shop.shopPhotos?.length) return shop.shopPhotos.filter(Boolean);
  const raw = shop as unknown as Record<string, unknown>;
  if (Array.isArray(raw.photos)) {
    return raw.photos.map(photo => {
      if (typeof photo === 'string') return photo;
      if (photo && typeof photo === 'object') return getPhotoUrl(photo as Parameters<typeof getPhotoUrl>[0]);
      return '';
    }).filter(Boolean);
  }
  return [];
}

const SHOP_TYPE_LABELS: Record<string, string> = {
  Specialty: 'Specialty', specialty: 'Specialty',
  CoffeeBar: 'Кофейня', coffee_bar: 'Кофейня',
  Cafe: 'Кафе', cafe: 'Кафе',
};

const ShopCard: React.FC<ShopCardProps> = memo(({ shop, colors, userLocation, onSelect }) => {
  const [hovered, setHovered] = useState(false);
  const { theme } = useTheme();
  const { isFavorite, toggleFavorite } = useLocalFavorites();
  const favorite = isFavorite(shop.id);
  const photos = extractPhotos(shop);
  const raw = shop as unknown as Record<string, unknown>;
  const brewMethods = Array.isArray(raw.brewMethods) ? raw.brewMethods as Array<{ id?: string; name: string }> : [];
  const roasters = Array.isArray(raw.roasters) ? raw.roasters as Array<{ id?: string; name: string; photoUrl?: string | null }> : [];
  const openNow = isShopOpenNow(shop);
  const priceTier = getPriceRangeTier(shop.priceRange);
  const address = shop.location?.address || shop.address || shop.cityName || '';
  const latitude = shop.location?.latitude ?? shop.latitude;
  const longitude = shop.location?.longitude ?? shop.longitude;
  const distance = userLocation && latitude !== undefined && longitude !== undefined
    ? distanceKm(userLocation.latitude, userLocation.longitude, latitude, longitude)
    : null;
  const type = shop.type ? (SHOP_TYPE_LABELS[shop.type] ?? shop.type) : '';
  const showRating = (shop.rating ?? 0) > 0;

  const open = () => onSelect(shop.id);

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`Открыть кофейню ${shop.name}`}
      onClick={open}
      onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') open(); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="overflow-hidden rounded-[28px] border outline-none transition-transform focus-visible:ring-2 focus-visible:ring-yellow-500"
      style={{
        background: colors.surface,
        borderColor: hovered ? `${COLORS.primary}70` : colors.border,
        cursor: 'pointer',
        boxShadow: hovered ? '0 12px 32px rgba(0,0,0,.22)' : '0 3px 14px rgba(0,0,0,.08)',
        transform: hovered ? 'translateY(-2px)' : undefined,
      }}
    >
      <div className="relative aspect-[16/9] overflow-hidden">
        {photos[0] ? (
          <img src={photos[0]} alt={shop.name} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-500" style={{ transform: hovered ? 'scale(1.035)' : undefined }} />
        ) : <ShopPhotoPlaceholder />}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/15" />

        {shop.isNew && (
          <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-black/70 px-3 py-2 text-sm font-bold text-white backdrop-blur-md">
            <AppIcon name="auto_awesome" size={17} color={COLORS.primary} />
            Новое
          </span>
        )}

        <div className="absolute right-4 top-4 flex items-center gap-2">
          {showRating && (
            <span className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-black/70 px-3.5 text-sm font-bold text-white backdrop-blur-md" aria-label={`Рейтинг ${shop.rating?.toFixed(1)}`}>
              <StarIcon filled size={18} color={COLORS.primary} />
              {shop.rating?.toFixed(1)}
              {shop.reviewCount ? <span className="font-medium text-white/75">({shop.reviewCount})</span> : null}
            </span>
          )}
          <button
            type="button"
            aria-label={favorite ? 'Убрать из избранного' : 'Добавить в избранное'}
            onClick={event => { event.stopPropagation(); toggleFavorite(shop.id); }}
            className="flex h-14 w-14 items-center justify-center rounded-full border-0 bg-black/75 backdrop-blur-md transition-transform hover:scale-105"
          >
            <AppIcon name="favorite" filled={favorite} size={34} color={favorite ? '#FB7185' : '#FFFFFF'} />
          </button>
        </div>

        {roasters.length > 0 && (
          <div className="absolute bottom-3 right-4 flex -space-x-3" aria-label={`Обжарщики: ${roasters.map(roaster => roaster.name).join(', ')}`}>
            {roasters.slice(0, 3).map((roaster, index) => (
              <span
                key={roaster.id ?? `${roaster.name}-${index}`}
                title={roaster.name}
                className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-[3px] bg-white text-sm font-extrabold text-stone-800 shadow-lg"
                style={{ borderColor: colors.surface, zIndex: index + 1 }}
              >
                {roaster.photoUrl
                  ? <img src={roaster.photoUrl} alt={roaster.name} className="h-full w-full object-cover" loading="lazy" />
                  : roaster.name.slice(0, 2).toUpperCase()}
              </span>
            ))}
            {roasters.length > 3 && (
              <span className="relative flex h-12 w-12 items-center justify-center rounded-full border-[3px] bg-stone-900 text-xs font-bold text-white shadow-lg" style={{ borderColor: colors.surface, zIndex: 4 }}>+{roasters.length - 3}</span>
            )}
          </div>
        )}
      </div>

      <div className="px-5 pb-5 pt-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="min-w-0 flex-1 truncate text-[22px] font-extrabold tracking-[-0.02em]" style={{ color: colors.textPrimary }}>{shop.name}</h3>
          {openNow !== undefined && (
            <span className="mt-0.5 inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-xs font-extrabold uppercase" style={{ background: openNow ? 'rgba(34,197,94,.16)' : 'rgba(239,68,68,.14)', color: openNow ? '#22C55E' : '#EF4444' }}>
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: 'currentColor' }} />
              {openNow ? 'Открыто' : 'Закрыто'}
            </span>
          )}
        </div>

        {brewMethods.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2" aria-label="Методы заваривания">
            {brewMethods.slice(0, 2).map((method, index) => <InfoChip key={method.id ?? `${method.name}-${index}`} colors={colors}>{method.name}</InfoChip>)}
            {brewMethods.length > 2 && <InfoChip colors={colors}>+{brewMethods.length - 2}</InfoChip>}
          </div>
        )}

        {(address || distance !== null) && (
          <p className="mt-4 flex min-w-0 items-center gap-1.5 text-sm" style={{ color: colors.textSecondary }}>
            <AppIcon name="location_on" size={18} color={COLORS.primary} style={{ flexShrink: 0 }} />
            <span className="truncate">{address}</span>
            {distance !== null && <span className="shrink-0">· {formatDistance(distance)} от вас</span>}
          </p>
        )}

        {(type || priceTier) && (
          <div className="mt-4 flex items-center gap-2 border-t pt-4 text-sm" style={{ borderColor: colors.border, color: colors.textSecondary }}>
            {type && <span>{type}</span>}
            {type && priceTier && <span>·</span>}
            {priceTier && <span className="inline-flex items-center gap-2" aria-label={`Уровень стоимости ${priceTier}`}><span>Стоимость</span><BeanPriceMarks count={priceTier} size={14} color={COLORS.primary} /></span>}
            <CaretArrow color={colors.textSecondary} />
          </div>
        )}
      </div>
    </article>
  );
});

ShopCard.displayName = 'ShopCard';

const InfoChip: React.FC<{ colors: ShopCardColors; children: React.ReactNode }> = ({ colors, children }) => (
  <span className="inline-flex min-h-9 items-center rounded-full border px-3 text-sm font-medium" style={{ borderColor: colors.border, background: colors.background, color: colors.textSecondary }}>{children}</span>
);

const CaretArrow: React.FC<{ color: string }> = ({ color }) => (
  <svg className="ml-auto shrink-0" width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
    <path d="m7.5 4 6 6-6 6" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default ShopCard;
