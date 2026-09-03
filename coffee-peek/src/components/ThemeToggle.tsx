import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { AppIcon } from './icons';
import { COLORS } from '../constants/colors';

interface ThemeToggleProps {
  style?: React.CSSProperties;
  size?: number;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ style, size = 40 }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const iconSize = Math.round(size * 0.5);

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Включить светлую тему' : 'Включить тёмную тему'}
      style={{
        width: size,
        height: size,
        padding: 0,
        boxSizing: 'border-box',
        borderRadius: 99,
        background: isDark ? 'rgba(45,36,31,0.75)' : '#fff',
        border: `1px solid ${isDark ? '#3D2F28' : '#E7E5E4'}`,
        color: COLORS.primary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        flexShrink: 0,
        backdropFilter: isDark ? 'blur(12px)' : 'none',
        transition: 'all .2s',
        ...style,
      }}
    >
      <AppIcon
        name={isDark ? 'light_mode' : 'dark_mode'}
        filled
        size={iconSize}
        color={COLORS.primary}
      />
    </button>
  );
};

export default ThemeToggle;
