import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import Shimmer from './Shimmer';

const ProfileSkeleton: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const bgClass = isDark ? 'bg-[#1A1412]' : 'bg-[#FCFBFA]';
  const cardBg = isDark ? 'bg-[#2D241F]' : 'bg-white';
  const borderColor = isDark ? 'border-[#3D2F28]' : 'border-[#E8E4E1]';

  return (
    <div className={`min-h-screen ${bgClass} pt-24 pb-12 px-6`}>
      <div className="max-w-4xl mx-auto">
        {/* Профиль header */}
        <div className={`${cardBg} rounded-3xl p-8 border ${borderColor} mb-8`}>
          <div className="flex items-center gap-6 mb-6">
            {/* Аватар */}
            <Shimmer width="120px" height="120px" circle />
            
            {/* Инфо */}
            <div className="flex-1">
              <Shimmer width="200px" height="32px" className="mb-2" />
              <Shimmer width="150px" height="20px" className="mb-4" />
              <div className="flex gap-4">
                <Shimmer width="100px" height="24px" />
                <Shimmer width="100px" height="24px" />
                <Shimmer width="100px" height="24px" />
              </div>
            </div>
          </div>
          
          {/* Статистика */}
          <div className="grid grid-cols-3 gap-4 pt-6 border-t" style={{ borderColor: borderColor }}>
            {[1, 2, 3].map((i) => (
              <div key={i} className="text-center">
                <Shimmer width="60px" height="32px" className="mx-auto mb-2" />
                <Shimmer width="80px" height="16px" className="mx-auto" />
              </div>
            ))}
          </div>
        </div>

        {/* Контент секции */}
        <div className={`${cardBg} rounded-3xl p-8 border ${borderColor}`}>
          <Shimmer width="180px" height="28px" className="mb-6" />
          
          {/* Список элементов */}
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="mb-4 pb-4 border-b last:border-b-0" style={{ borderColor: borderColor }}>
              <Shimmer width="70%" height="20px" className="mb-2" />
              <Shimmer width="100%" height="16px" className="mb-1" />
              <Shimmer width="85%" height="16px" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfileSkeleton;
