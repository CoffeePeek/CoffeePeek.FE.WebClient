import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

export const LOGO_SRC_LIGHT = '/logo/logo-white.png';
export const LOGO_SRC_DARK = '/logo/logo-dark.png';

interface LogoMarkProps {
  size?: number;
  className?: string;
  alt?: string;
  /** Override app theme when the surface is always dark (login, sidebar). */
  variant?: 'light' | 'dark';
}

const LogoMark: React.FC<LogoMarkProps> = ({
  size = 32,
  className,
  alt = 'CoffeePeek',
  variant,
}) => {
  const { isDark } = useTheme();
  const dark = variant ? variant === 'dark' : isDark;
  const src = dark ? LOGO_SRC_DARK : LOGO_SRC_LIGHT;

  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      draggable={false}
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.28),
        objectFit: 'cover',
        display: 'block',
        flexShrink: 0,
      }}
    />
  );
};

export default LogoMark;
