import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import Shimmer from './Shimmer';

interface ShopCardSkeletonProps {
  count?: number;
}

const ShopCardSkeleton: React.FC<ShopCardSkeletonProps> = ({ count = 6 }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const bgClass = isDark ? 'bg-[#2D241F]' : 'bg-white';
  const borderColor = isDark ? 'border-[#3D2F28]' : 'border-[#E8E4E1]';

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`${bgClass} rounded-3xl overflow-hidden shadow-sm border ${borderColor}`}
        >
          {/* Изображение skeleton */}
          <div className="relative h-48 overflow-hidden">
            <Shimmer width="100%" height="100%" className="rounded-none" />
          </div>

          {/* Контент skeleton */}
          <div className="p-6">
            {/* Заголовок */}
            <div className="mb-4">
              <Shimmer width="75%" height="24px" className="mb-2" />
              <Shimmer width="50%" height="16px" />
            </div>

            {/* Рейтинг и статус */}
            <div className="flex items-center gap-3 mb-4">
              <Shimmer width="64px" height="24px" />
              <Shimmer width="96px" height="24px" />
              <Shimmer width="80px" height="24px" />
            </div>

            {/* Теги */}
            <div className="flex flex-wrap gap-2 mb-4">
              <Shimmer width="80px" height="28px" className="rounded-xl" />
              <Shimmer width="96px" height="28px" className="rounded-xl" />
              <Shimmer width="64px" height="28px" className="rounded-xl" />
            </div>

            {/* Адрес */}
            <Shimmer width="100%" height="16px" className="mb-2" />
            <Shimmer width="66%" height="16px" />
          </div>
        </div>
      ))}
    </>
  );
};

export default ShopCardSkeleton;
