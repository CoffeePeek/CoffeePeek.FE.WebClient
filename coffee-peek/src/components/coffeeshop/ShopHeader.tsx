import React from 'react';
import { DetailedCoffeeShop } from '../../api/coffeeshop';
import { getCurrentStatus } from '../../utils/shopUtils';
import { useTheme } from '../../contexts/ThemeContext';
import { getThemeClasses } from '../../utils/theme';

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
  const status = getCurrentStatus(shop);

  return (
    <div className="flex flex-wrap items-start justify-between gap-6 mb-6">
      <div>
        <h1 className={`text-5xl font-display font-bold ${textMain} mb-2 tracking-tight`}>
          {shop.name}
        </h1>
        <div className="flex items-center gap-3 text-sm flex-wrap">
          <span className={`${themeClasses.primary.bgLight} ${themeClasses.primary.text} font-bold px-3 py-1 rounded-lg flex items-center gap-1`}>
            <span className="material-symbols-outlined text-sm fill-1">star</span>
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
          <span className={`${textMuted} font-medium`}>$$</span>
        </div>
      </div>
      
      {/* Кнопки действий */}
      <div className="flex gap-3">
        {onCheckIn && (
          <button
            onClick={onCheckIn}
            className={`px-4 py-2 rounded-2xl border ${borderColor} flex items-center justify-center gap-2 ${themeClasses.primary.bgLight.replace('bg-', 'hover:bg-')} ${themeClasses.primary.borderLight.replace('border-', 'hover:border-')} transition-all ${themeClasses.primary.text} font-semibold text-sm`}
          >
            <span className="material-symbols-outlined text-lg">check_circle</span>
            Чекиниться
          </button>
        )}
        <button
          onClick={onToggleFavorite}
          disabled={isCheckingFavorite}
          className={`w-12 h-12 rounded-2xl border ${borderColor} flex items-center justify-center ${themeClasses.primary.bgLight.replace('bg-', 'hover:bg-')} transition-all ${
            isFavorite 
              ? `${themeClasses.primary.bgLight} ${themeClasses.primary.text} ${themeClasses.primary.borderLight}` 
              : `${textMuted} ${themeClasses.primary.hover} ${themeClasses.primary.borderLight.replace('border-', 'hover:border-')}`
          }`}
        >
          <span className={`material-symbols-outlined ${isFavorite ? 'fill-1' : ''}`}>favorite</span>
        </button>
        <button className={`w-12 h-12 rounded-2xl border ${borderColor} flex items-center justify-center ${themeClasses.primary.bgLight.replace('bg-', 'hover:bg-')} ${themeClasses.primary.borderLight.replace('border-', 'hover:border-')} transition-all ${textMuted} ${themeClasses.primary.hover}`}>
          <span className="material-symbols-outlined">share</span>
        </button>
      </div>
    </div>
  );
};

