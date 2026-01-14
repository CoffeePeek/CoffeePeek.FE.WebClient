import React from 'react';
import { DetailedCoffeeShop } from '../../api/coffeeshop';
import { getCurrentStatus } from '../../utils/shopUtils';

interface ShopHeaderProps {
  shop: DetailedCoffeeShop;
  avgRating: number;
  reviewsTotalCount: number;
  isFavorite: boolean;
  isCheckingFavorite: boolean;
  onToggleFavorite: () => void;
  textMain: string;
  textMuted: string;
  borderColor: string;
  primary: string;
}

export const ShopHeader: React.FC<ShopHeaderProps> = ({
  shop,
  avgRating,
  reviewsTotalCount,
  isFavorite,
  isCheckingFavorite,
  onToggleFavorite,
  textMain,
  textMuted,
  borderColor,
  primary,
}) => {
  const status = getCurrentStatus(shop);

  return (
    <div className="flex flex-wrap items-start justify-between gap-6 mb-6">
      <div>
        <h1 className={`text-5xl font-display font-bold ${textMain} mb-2 tracking-tight`}>
          {shop.name}
        </h1>
        <div className="flex items-center gap-3 text-sm">
          <span className={`bg-[${primary}]/10 text-[${primary}] font-bold px-3 py-1 rounded-lg flex items-center gap-1`}>
            <span className="material-symbols-outlined text-sm fill-1">star</span>
            {avgRating.toFixed(1)}
          </span>
          <span className={`${textMuted} font-medium border-b border-current/30`}>
            {shop.reviewCount || reviewsTotalCount} отзывов
          </span>
          <span className={textMuted}>•</span>
          {status && (
            <>
              <span className={`${status.isOpen ? 'text-green-600' : 'text-red-600'} font-bold uppercase tracking-wider text-xs`}>
                {status.isOpen ? 'Открыто' : 'Закрыто'}
              </span>
              <span className={textMuted}>•</span>
            </>
          )}
          <span className={`${textMuted} font-medium`}>$$</span>
        </div>
      </div>
      
      {/* Кнопки действий */}
      <div className="flex gap-3">
        <button
          onClick={onToggleFavorite}
          disabled={isCheckingFavorite}
          className={`w-12 h-12 rounded-2xl border ${borderColor} flex items-center justify-center hover:bg-[#F5EFE6] hover:border-[${primary}]/30 transition-all ${textMuted} hover:text-[${primary}] ${isFavorite ? 'bg-[#F5EFE6] text-[${primary}]' : ''}`}
        >
          <span className={`material-symbols-outlined ${isFavorite ? 'fill-1' : ''}`}>favorite</span>
        </button>
        <button className={`w-12 h-12 rounded-2xl border ${borderColor} flex items-center justify-center hover:bg-[#F5EFE6] hover:border-[${primary}]/30 transition-all ${textMuted} hover:text-[${primary}]`}>
          <span className="material-symbols-outlined">share</span>
        </button>
      </div>
    </div>
  );
};

