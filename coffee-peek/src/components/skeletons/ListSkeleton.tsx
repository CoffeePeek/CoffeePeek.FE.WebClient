import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import Shimmer from './Shimmer';

interface ListSkeletonProps {
  count?: number;
  showAvatar?: boolean;
}

/**
 * Универсальный skeleton для списков
 */
const ListSkeleton: React.FC<ListSkeletonProps> = ({ 
  count = 5,
  showAvatar = true 
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const cardBg = isDark ? 'bg-[#2D241F]' : 'bg-white';
  const borderColor = isDark ? 'border-[#3D2F28]' : 'border-[#E8E4E1]';

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className={`${cardBg} p-4 rounded-2xl border ${borderColor} mb-4`}
        >
          <div className="flex items-center gap-4">
            {showAvatar && (
              <Shimmer width="48px" height="48px" circle />
            )}
            
            <div className="flex-1">
              <Shimmer width="60%" height="20px" className="mb-2" />
              <Shimmer width="40%" height="16px" />
            </div>
            
            <Shimmer width="80px" height="32px" />
          </div>
        </div>
      ))}
    </>
  );
};

export default ListSkeleton;
