import React, { memo, useState } from 'react';
import { CoffeeShop, getPhotoUrl, formatEquipmentName } from '../api/coffeeshop';
import { COLORS } from '../constants/colors';
import { AppIcon, StarIcon, BeanPriceMarks } from './icons';
import { useLocalFavorites } from '../hooks/useLocalFavorites';
import { getPriceRangeTier } from '../utils/priceRange';

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
  onSelect: (shopId: string) => void;
}

function extractPhotos(shop: CoffeeShop): string[] {
  if (shop.shopPhotos?.length) {
    return shop.shopPhotos.filter((p): p is string => typeof p === 'string' && p.trim().length > 0);
  }
  const raw = (shop as unknown as Record<string, unknown>);
  if (Array.isArray(raw.photos) && raw.photos.length > 0) {
    return (raw.photos as unknown[]).map((p) => {
      if (p && typeof p === 'object' && ('fullUrl' in p || 'storageKey' in p)) return getPhotoUrl(p as Parameters<typeof getPhotoUrl>[0]);
      if (typeof p === 'string') return p;
      return '';
    }).filter(Boolean) as string[];
  }
  if (Array.isArray(raw.imageUrls)) {
    return (raw.imageUrls as unknown[]).filter((p): p is string => typeof p === 'string' && p.trim().length > 0);
  }
  return [];
}

const ShopCard: React.FC<ShopCardProps> = memo(({ shop, colors, onSelect }) => {
  const [hovered, setHovered] = useState(false);
  const { isFavorite, toggleFavorite } = useLocalFavorites();
  const fav = isFavorite(shop.id);
  const photos = extractPhotos(shop);
  const s = shop as Record<string, unknown>;
  const isFeatured = shop.rating && shop.rating >= 4.7;
  const priceTiers = getPriceRangeTier(shop.priceRange);
  const beans = Array.isArray(s.beans) ? (s.beans as { name: string }[]) : [];
  const equipments = Array.isArray(s.equipments) ? (s.equipments as object[]) : [];

  return (
    <article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onSelect(shop.id)}
      style={{
        background: colors.surface,
        border: `1px solid ${hovered ? `${COLORS.primary}50` : colors.border}`,
        borderRadius: 16, overflow: 'hidden', cursor: 'pointer',
        transition: 'all .2s',
        boxShadow: hovered
          ? '0 8px 24px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.04)'
          : 'inset 0 1px 0 rgba(255,255,255,0.04)',
        transform: hovered ? 'translateY(-3px)' : 'none',
      }}
    >
      {/* Photo — 5:3 ratio */}
      <div style={{ position: 'relative', aspectRatio: '5/3', overflow: 'hidden' }}>
        {photos.length > 0 ? (
          <>
            <img
              src={photos[0]}
              alt={shop.name}
              loading="lazy"
              decoding="async"
              style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform .5s', transform: hovered ? 'scale(1.05)' : 'scale(1)' }}
            />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.4) 100%)' }} />
          </>
        ) : (
          <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${COLORS.primary}20, #D4A84B20)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AppIcon name="local_cafe" size={40} color={colors.textSecondary} />
          </div>
        )}

        {/* Top-left: rating (+ optional «Хит») */}
        <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 5 }}>
          {shop.rating != null && shop.rating > 0 && (
            <span
              aria-label={`Рейтинг ${shop.rating.toFixed(1)}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '4px 8px', borderRadius: 8,
                background: 'rgba(26,20,18,0.72)', backdropFilter: 'blur(12px)',
                fontFamily: '"RF Dewi Expanded"', fontWeight: 700, fontSize: 12, color: COLORS.primary,
              }}
            >
              <StarIcon filled size={13} color={COLORS.primary} />
              {shop.rating.toFixed(1)}
            </span>
          )}
          {isFeatured && (
            <span style={{
              padding: '4px 8px', borderRadius: 8,
              background: COLORS.primary, color: '#1A1412',
              fontFamily: '"RF Dewi Expanded"', fontWeight: 700, fontSize: 10, letterSpacing: '.06em', textTransform: 'uppercase' as const,
            }}>Хит</span>
          )}
        </div>

        {/* Top-right: favorite */}
        <button
          type="button"
          aria-label={fav ? 'Убрать из избранного' : 'В избранное'}
          onClick={(e) => { e.stopPropagation(); toggleFavorite(shop.id); }}
          style={{
            position: 'absolute', top: 10, right: 10, width: 36, height: 36, borderRadius: 99,
            background: fav ? 'rgba(234,179,8,0.95)' : 'rgba(26,20,18,0.72)',
            backdropFilter: 'blur(12px)',
            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <AppIcon name="favorite" filled={fav} size={18} color={fav ? '#1A1412' : '#F5F5F4'} />
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: '12px 14px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 6 }}>
          <h3 style={{ margin: 0, fontFamily: '"RF Dewi Expanded"', fontWeight: 700, fontSize: 15, color: colors.textPrimary, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {shop.name}
          </h3>
          {typeof shop.isOpen !== 'undefined' && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              padding: '3px 8px', borderRadius: 6, whiteSpace: 'nowrap' as const,
              background: shop.isOpen ? 'rgba(34,197,94,.18)' : 'rgba(239,68,68,.18)',
              color: shop.isOpen ? '#4ADE80' : '#FCA5A5',
              fontFamily: '"RF Dewi Expanded"', fontWeight: 700, fontSize: 9, letterSpacing: '.06em', textTransform: 'uppercase' as const,
            }}>
              {shop.isOpen ? 'Открыто' : 'Закрыто'}
            </span>
          )}
        </div>

        <p style={{ margin: '4px 0 0', fontFamily: '"RF Dewi Expanded"', fontSize: 12, color: colors.textSecondary, display: 'flex', alignItems: 'center', gap: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <AppIcon name="location_on" size={13} color={COLORS.primary} style={{ flexShrink: 0 }} />
          {shop.address || shop.cityName || 'Адрес не указан'}
        </p>

        {/* Price + reviews — once */}
        {(priceTiers || shop.reviewCount) ? (
          <p style={{ margin: '6px 0 0', fontFamily: '"RF Dewi Expanded"', fontSize: 11, color: colors.textSecondary, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' as const }}>
            {priceTiers ? <BeanPriceMarks count={priceTiers} size={12} color={COLORS.primary} /> : null}
            {shop.reviewCount ? <span>{shop.reviewCount} отзывов</span> : null}
          </p>
        ) : null}

        {/* Tags: beans / equipment only — no price duplicate */}
        {(beans.length > 0 || equipments.length > 0) && (
          <div style={{ marginTop: 10, display: 'flex', gap: 4, flexWrap: 'wrap' as const }}>
            {beans.slice(0, 1).map(b => (
              <TagChip key={b.name} color={colors.textSecondary} bg={colors.background} border={colors.border}>{b.name}</TagChip>
            ))}
            {equipments.slice(0, 1).map((eq, i) => (
              <TagChip key={i} color={colors.textSecondary} bg={colors.background} border={colors.border}>
                {formatEquipmentName(eq as Parameters<typeof formatEquipmentName>[0])}
              </TagChip>
            ))}
          </div>
        )}
      </div>
    </article>
  );
});

ShopCard.displayName = 'ShopCard';

const TagChip: React.FC<{ color: string; bg: string; border: string; children: React.ReactNode }> = ({ color, bg, border, children }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '4px 10px', borderRadius: 8,
    background: bg, color, border: `1px solid ${border}`,
    fontFamily: '"RF Dewi Expanded"', fontWeight: 600, fontSize: 11, whiteSpace: 'nowrap' as const,
  }}>
    {children}
  </span>
);

export default ShopCard;
