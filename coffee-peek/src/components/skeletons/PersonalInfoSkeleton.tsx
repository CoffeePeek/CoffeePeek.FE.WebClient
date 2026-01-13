import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import Shimmer from './Shimmer';

const PersonalInfoSkeleton: React.FC = () => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const cardBg = isDark ? 'bg-[#2D241F]' : 'bg-white';
  const borderColor = isDark ? 'border-[#3D2F28]' : 'border-[#E8E4E1]';

  return (
    <div className={`${cardBg} border ${borderColor} rounded-2xl p-6`}>
      <Shimmer width="180px" height="28px" className="mb-4" />
      
      <div className="space-y-4">
        <div>
          <Shimmer width="120px" height="16px" className="mb-2" />
          <Shimmer width="100%" height="40px" className="rounded-xl" />
        </div>
        
        <div>
          <Shimmer width="80px" height="16px" className="mb-2" />
          <Shimmer width="100%" height="40px" className="rounded-xl" />
        </div>
        
        <div>
          <Shimmer width="60px" height="16px" className="mb-2" />
          <Shimmer width="100%" height="100px" className="rounded-xl" />
        </div>
        
        <div>
          <Shimmer width="140px" height="16px" className="mb-2" />
          <Shimmer width="120px" height="20px" />
        </div>
      </div>
    </div>
  );
};

export default PersonalInfoSkeleton;
