import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import Shimmer from './Shimmer';

const ShopDetailSkeleton: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const bgClass = isDark ? 'bg-[#1A1412]' : 'bg-[#FCFBFA]';
  const cardBg = isDark ? 'bg-[#2D241F]' : 'bg-white';
  const borderColor = isDark ? 'border-[#3D2F28]' : 'border-[#E8E4E1]';

  return (
    <div className={`min-h-screen ${bgClass} font-body`}>
      {/* Галерея фотографий skeleton */}
      <section className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 grid-rows-2 gap-4 h-[500px]">
          <div className="col-span-12 md:col-span-8 row-span-2 rounded-3xl overflow-hidden">
            <Shimmer width="100%" height="100%" className="rounded-3xl" />
          </div>
          <div className="hidden md:block col-span-4 row-span-1 rounded-3xl overflow-hidden">
            <Shimmer width="100%" height="100%" className="rounded-3xl" />
          </div>
          <div className="hidden md:block col-span-4 row-span-1 rounded-3xl overflow-hidden">
            <Shimmer width="100%" height="100%" className="rounded-3xl" />
          </div>
        </div>
      </section>

      {/* Основной контент */}
      <section className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-12 gap-12">
        {/* Левая колонка */}
        <div className="col-span-12 lg:col-span-8 space-y-12">
          {/* Заголовок */}
          <div>
            <Shimmer width="60%" height="48px" className="mb-4" />
            <div className="flex items-center gap-3">
              <Shimmer width="80px" height="28px" />
              <Shimmer width="120px" height="28px" />
              <Shimmer width="100px" height="28px" />
            </div>
          </div>

          {/* Описание */}
          <div className={`${cardBg} p-6 rounded-3xl border ${borderColor}`}>
            <Shimmer width="200px" height="32px" className="mb-4" />
            <Shimmer width="100%" height="16px" className="mb-2" />
            <Shimmer width="95%" height="16px" className="mb-2" />
            <Shimmer width="90%" height="16px" />
          </div>

          {/* Детали кофе */}
          <div className={`${cardBg} p-6 rounded-3xl border ${borderColor}`}>
            <Shimmer width="200px" height="32px" className="mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i}>
                  <Shimmer width="140px" height="20px" className="mb-3" />
                  <div className="flex flex-wrap gap-2">
                    <Shimmer width="80px" height="32px" />
                    <Shimmer width="100px" height="32px" />
                    <Shimmer width="90px" height="32px" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Правая колонка */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          <div className={`${cardBg} rounded-3xl border ${borderColor} p-8`}>
            <Shimmer width="100%" height="80px" className="mb-6" />
            <Shimmer width="100%" height="200px" />
          </div>
        </div>
      </section>
    </div>
  );
};

export default ShopDetailSkeleton;
