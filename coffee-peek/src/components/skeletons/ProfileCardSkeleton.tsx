import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import Shimmer from './Shimmer';

const ProfileCardSkeleton: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const cardBg = isDark ? 'bg-[#2D241F]' : 'bg-white';
  const borderColor = isDark ? 'border-[#3D2F28]' : 'border-[#E8E4E1]';

  return (
    <div className={`${cardBg} border ${borderColor} rounded-2xl p-6 mb-6`}>
      <div className="flex flex-col md:flex-row gap-6">
        {/* Аватар */}
        <div className="flex-shrink-0">
          <Shimmer width="128px" height="128px" circle />
        </div>

        {/* Инфо */}
        <div className="flex-1">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex-1">
              <Shimmer width="200px" height="32px" className="mb-2" />
              <Shimmer width="150px" height="20px" />
            </div>
            <div className="flex gap-2">
              <Shimmer width="120px" height="40px" className="rounded-xl" />
            </div>
          </div>

          {/* Статистика */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Shimmer width="100%" height="80px" className="rounded-xl" />
            <Shimmer width="100%" height="80px" className="rounded-xl" />
            <Shimmer width="100%" height="80px" className="rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCardSkeleton;
