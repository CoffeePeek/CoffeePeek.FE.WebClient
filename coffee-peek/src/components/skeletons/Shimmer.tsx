import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface ShimmerProps {
  width?: string;
  height?: string;
  className?: string;
  circle?: boolean;
}

/**
 * Базовый компонент Shimmer для создания skeleton loading элементов
 */
const Shimmer: React.FC<ShimmerProps> = ({ 
  width = '100%', 
  height = '1rem', 
  className = '',
  circle = false 
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const shimmerGradient = isDark 
    ? 'from-[#2D241F] via-[#3D2F28] to-[#2D241F]'
    : 'from-gray-100 via-gray-200 to-gray-100';

  const style = {
    width,
    height,
  };

  return (
    <div 
      className={`bg-gradient-to-r ${shimmerGradient} animate-shimmer ${circle ? 'rounded-full' : 'rounded-lg'} ${className}`}
      style={style}
    />
  );
};

export default Shimmer;
