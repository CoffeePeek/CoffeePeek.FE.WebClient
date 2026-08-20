import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { Moon, Sun } from '@/components/Icon';

interface ThemeToggleProps {
  style?: React.CSSProperties;
  size?: number;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ style, size = 40 }) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Включить светлую тему' : 'Включить тёмную тему'}
      style={{
        width: size,
        height: size,
        borderRadius: 99,
        background: isDark ? 'rgba(45,36,31,0.75)' : '#fff',
        border: `1px solid ${isDark ? '#3D2F28' : '#E7E5E4'}`,
        color: isDark ? '#fff' : '#1C1917',
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
      {isDark
        ? <Sun size={Math.round(size * 0.5)} color="currentColor" />
        : <Moon size={Math.round(size * 0.5)} color="currentColor" />}
    </button>
  );
};

export default ThemeToggle;
