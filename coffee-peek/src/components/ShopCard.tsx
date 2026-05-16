import React, { memo, useState } from 'react';
import { CoffeeShop, getPhotoUrl, formatEquipmentName } from '../api/coffeeshop';
import { COLORS } from '../constants/colors';

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
  favoriteShopIds: Set<string>;
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

const ShopCard: React.FC<ShopCardProps> = memo(({ shop, colors, favoriteShopIds, onSelect }) => {
  const [hovered, setHovered] = useState(false);
  const [fav, setFav] = useState(favoriteShopIds.has(shop.id));
  const photos = extractPhotos(shop);
  const s = shop as Record<string, unknown>;
  const isFeatured = shop.rating && shop.rating >= 4.7;

  const priceLabel =
    shop.priceRange === 'Budget' || shop.priceRange === 1 ? '$' :
    shop.priceRange === 'Moderate' || shop.priceRange === 2 ? '$$' :
    shop.priceRange ? '$$$' : null;

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
          <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${COLORS.primary}20, #B48C4B20)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-rounded" style={{ fontSize: 40, color: colors.textSecondary, lineHeight: 1 }}>local_cafe</span>
          </div>
        )}

        {/* Top-left: rating + "Хит" */}
        <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 5 }}>
          {shop.rating && shop.rating > 0 && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              padding: '3px 8px', borderRadius: 6,
              background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(12px)',
              fontFamily: '"RF Dewi Expanded","Sora",system-ui', fontWeight: 700, fontSize: 11, color: '#B48C4B',
            }}>
              <span className="material-symbols-rounded star-filled" style={{ fontSize: 12, color: '#B48C4B', lineHeight: 1 }}>star</span>
              {shop.rating.toFixed(1)}
            </span>
          )}
          {isFeatured && (
            <span style={{
              padding: '3px 7px', borderRadius: 6,
              background: 'rgba(234,179,8,0.92)', color: '#1A1412',
              fontFamily: '"Noto Sans",system-ui', fontWeight: 700, fontSize: 9, letterSpacing: '.06em', textTransform: 'uppercase' as const,
            }}>Хит</span>
          )}
        </div>

        {/* Top-right: favorite */}
        <button
          onClick={(e) => { e.stopPropagation(); setFav(v => !v); }}
          style={{
            position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: 99,
            background: 'rgba(255,255,255,0.94)', backdropFilter: 'blur(12px)',
            border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <span className={`material-symbols-rounded${fav ? ' star-filled' : ''}`} style={{ fontSize: 15, color: fav ? '#EF4444' : '#78716C', lineHeight: 1 }}>favorite</span>
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: '12px 14px 14px' }}>
        {/* Name + open/closed */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 6 }}>
          <h3 style={{ margin: 0, fontFamily: '"RF Dewi Expanded","Sora",system-ui', fontWeight: 700, fontSize: 15, color: colors.textPrimary, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {shop.name}
          </h3>
          {typeof shop.isOpen !== 'undefined' && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              padding: '3px 8px', borderRadius: 6, whiteSpace: 'nowrap' as const,
              background: shop.isOpen ? 'rgba(34,197,94,.18)' : 'rgba(239,68,68,.18)',
              color: shop.isOpen ? '#4ADE80' : '#FCA5A5',
              fontFamily: '"Noto Sans"', fontWeight: 700, fontSize: 9, letterSpacing: '.06em', textTransform: 'uppercase' as const,
            }}>
              {shop.isOpen ? 'Открыто' : 'Закрыто'}
            </span>
          )}
        </div>

        {/* Address */}
        <p style={{ margin: '4px 0 0', fontFamily: '"Noto Sans",system-ui', fontSize: 12, color: colors.textSecondary, display: 'flex', alignItems: 'center', gap: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          <span className="material-symbols-rounded" style={{ fontSize: 13, color: '#B48C4B', lineHeight: 1, flexShrink: 0 }}>location_on</span>
          {shop.address || shop.cityName || 'Адрес не указан'}
        </p>

        {/* Meta row */}
        <p style={{ margin: '2px 0 0', fontFamily: '"Noto Sans",system-ui', fontSize: 11, color: colors.textSecondary, opacity: 0.7 }}>
          {[shop.description ? undefined : null, priceLabel, shop.reviewCount ? `${shop.reviewCount} отзывов` : null].filter(Boolean).join(' · ')}
        </p>

        {/* Tags */}
        <div style={{ marginTop: 10, display: 'flex', gap: 4, flexWrap: 'wrap' as const }}>
          {Array.isArray(s.beans) && (s.beans as {name: string}[]).slice(0, 1).map(b => (
            <TagChip key={b.name} color={colors.textSecondary} bg={colors.background} border={colors.border}>{b.name}</TagChip>
          ))}
          {Array.isArray(s.equipments) && (s.equipments as object[]).slice(0, 1).map((eq, i) => (
            <TagChip key={i} color={colors.textSecondary} bg={colors.background} border={colors.border}>
              {formatEquipmentName(eq as Parameters<typeof formatEquipmentName>[0])}
            </TagChip>
          ))}
          {(!Array.isArray(s.beans) || !(s.beans as unknown[]).length) && (!Array.isArray(s.equipments) || !(s.equipments as unknown[]).length) && priceLabel && (
            <TagChip color={COLORS.primary} bg={`${COLORS.primary}10`} border={`${COLORS.primary}30`}>{priceLabel}</TagChip>
          )}
        </div>
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
    fontFamily: '"Noto Sans",system-ui', fontWeight: 600, fontSize: 11, whiteSpace: 'nowrap' as const,
  }}>
    {children}
  </span>
);

export default ShopCard;
