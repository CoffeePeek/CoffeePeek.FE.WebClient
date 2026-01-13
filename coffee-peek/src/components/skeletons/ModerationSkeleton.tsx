import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import Shimmer from './Shimmer';

const ModerationSkeleton: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const bgClass = isDark ? 'bg-[#1A1412]' : 'bg-[#FCFBFA]';
  const cardBg = isDark ? 'bg-[#2D241F]' : 'bg-white';
  const borderColor = isDark ? 'border-[#3D2F28]' : 'border-[#E8E4E1]';

  return (
    <div className={`min-h-screen ${bgClass} pt-24 pb-12 px-6`}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Shimmer width="300px" height="40px" className="mb-4" />
          <Shimmer width="200px" height="20px" />
        </div>

        {/* Фильтры */}
        <div className={`${cardBg} rounded-2xl p-6 border ${borderColor} mb-6`}>
          <div className="flex flex-wrap gap-4">
            <Shimmer width="120px" height="40px" className="rounded-xl" />
            <Shimmer width="120px" height="40px" className="rounded-xl" />
            <Shimmer width="120px" height="40px" className="rounded-xl" />
            <Shimmer width="120px" height="40px" className="rounded-xl" />
          </div>
        </div>

        {/* Список кофеен на модерацию */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className={`${cardBg} rounded-2xl p-6 border ${borderColor}`}
            >
              {/* Header карточки */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <Shimmer width="70%" height="24px" className="mb-2" />
                  <Shimmer width="50%" height="16px" />
                </div>
                <Shimmer width="80px" height="28px" className="rounded-full" />
              </div>

              {/* Изображение */}
              <div className="mb-4">
                <Shimmer width="100%" height="200px" className="rounded-xl" />
              </div>

              {/* Детали */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2">
                  <Shimmer width="20px" height="20px" />
                  <Shimmer width="60%" height="16px" />
                </div>
                <div className="flex items-center gap-2">
                  <Shimmer width="20px" height="20px" />
                  <Shimmer width="40%" height="16px" />
                </div>
                <div className="flex items-center gap-2">
                  <Shimmer width="20px" height="20px" />
                  <Shimmer width="50%" height="16px" />
                </div>
              </div>

              {/* Теги */}
              <div className="flex flex-wrap gap-2 mb-4">
                <Shimmer width="80px" height="24px" className="rounded-lg" />
                <Shimmer width="100px" height="24px" className="rounded-lg" />
                <Shimmer width="70px" height="24px" className="rounded-lg" />
              </div>

              {/* Кнопки действий */}
              <div className="flex gap-2 pt-4 border-t" style={{ borderColor }}>
                <Shimmer width="100px" height="40px" className="rounded-xl" />
                <Shimmer width="100px" height="40px" className="rounded-xl" />
                <Shimmer width="100px" height="40px" className="rounded-xl" />
              </div>
            </div>
          ))}
        </div>

        {/* Пагинация */}
        <div className="mt-8 flex justify-center gap-2">
          <Shimmer width="100px" height="40px" className="rounded-xl" />
          <Shimmer width="150px" height="40px" className="rounded-xl" />
          <Shimmer width="100px" height="40px" className="rounded-xl" />
        </div>
      </div>
    </div>
  );
};

export default ModerationSkeleton;
