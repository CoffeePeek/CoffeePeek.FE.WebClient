import React from 'react';
import { DetailedCoffeeShop } from '../../api/coffeeshop';
import { useTheme } from '../../contexts/ThemeContext';
import { getThemeClasses } from '../../utils/theme';
import { AppIcon, StarIcon, BynPriceMarks } from '../icons';
import { getPriceRangeTier } from '../../utils/priceRange';

interface ShopHeaderProps {
  shop: DetailedCoffeeShop;
  avgRating: number;
  reviewsTotalCount: number;
  isFavorite: boolean;
  isCheckingFavorite: boolean;
  onToggleFavorite: () => void;
  onCheckIn?: () => void;
  textMain: string;
  textMuted: string;
  borderColor: string;
}

export const ShopHeader: React.FC<ShopHeaderProps> = ({
  shop,
  avgRating,
  reviewsTotalCount,
  isFavorite,
  isCheckingFavorite,
  onToggleFavorite,
  onCheckIn,
  textMain,
  textMuted,
  borderColor,
}) => {
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  const priceTiers = getPriceRangeTier(shop.priceRange);
  const iconMuted = theme === 'dark' ? '#E7E5E4' : '#44403C';

  return (
    <div className="flex flex-wrap items-start justify-between gap-6 mb-6">
      <div>
        <h1 className={`text-5xl font-display font-bold ${textMain} mb-2 tracking-tight`}>
          {shop.name}
        </h1>
        <div className="flex items-center gap-3 text-sm flex-wrap">
          <span className={`${themeClasses.primary.bgLight} ${themeClasses.primary.text} font-bold px-3 py-1 rounded-lg flex items-center gap-1`}>
            <StarIcon filled size={14} />
            {avgRating.toFixed(1)}
          </span>
          <span className={`${textMuted} font-medium border-b border-current/30`}>
            {shop.reviewCount || reviewsTotalCount} отзывов
          </span>
          <span className={textMuted}>•</span>
          {shop.isNew && (
            <>
              <span className="bg-green-500/20 text-green-400 font-bold px-2 py-1 rounded-lg text-xs uppercase tracking-wider">
                Новая
              </span>
              <span className={textMuted}>•</span>
            </>
          )}
          {shop.isOpen && (
            <>
              <span className="bg-green-500/20 text-green-400 font-bold px-2 py-1 rounded-lg text-xs uppercase tracking-wider">
                Открыта
              </span>
              <span className={textMuted}>•</span>
            </>
          )}
          {priceTiers && (
            <BynPriceMarks count={priceTiers} size={14} color={iconMuted} />
          )}
        </div>
      </div>

      <div className="flex gap-3">
        {onCheckIn && (
          <button
            onClick={onCheckIn}
            className={`px-4 py-2 rounded-2xl border ${borderColor} flex items-center justify-center gap-2 ${themeClasses.primary.bgLight} hover:opacity-90 transition-all ${themeClasses.primary.text} font-semibold text-sm`}
          >
            <AppIcon name="check_circle" size={18} color="currentColor" />
            Чекиниться
          </button>
        )}
        <button
          type="button"
          onClick={onToggleFavorite}
          disabled={isCheckingFavorite}
          aria-label={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
          className={`w-12 h-12 rounded-2xl border ${borderColor} flex items-center justify-center transition-all ${
            isFavorite
              ? `${themeClasses.primary.bgLight} ${themeClasses.primary.borderLight}`
              : `${theme === 'dark' ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'}`
          }`}
        >
          <AppIcon
            name="favorite"
            filled={isFavorite}
            size={20}
            color={isFavorite ? '#EAB308' : iconMuted}
          />
        </button>
        <button
          type="button"
          aria-label="Поделиться"
          className={`w-12 h-12 rounded-2xl border ${borderColor} flex items-center justify-center transition-all ${
            theme === 'dark' ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'
          }`}
        >
          <AppIcon name="share" size={20} color={iconMuted} />
        </button>
      </div>
    </div>
  );
};
