import React from 'react';
import { useTheme, type Theme } from '../contexts/ThemeContext';

export const LOGO_SRC_LIGHT = '/logo/logo-white.png';
export const LOGO_SRC_DARK = '/logo/logo-dark.png';
export const LOGO_SRC = LOGO_SRC_DARK;
export const HEADER_LOGO_SIZE = 52;

export function logoSrcForTheme(theme: Theme): string {
  return theme === 'dark' ? LOGO_SRC_DARK : LOGO_SRC_LIGHT;
}

interface LogoMarkProps {
  size?: number;
  className?: string;
  alt?: string;
  style?: React.CSSProperties;
  /** Override app theme (e.g. always-dark auth screens). */
  variant?: Theme;
}

const LogoMark: React.FC<LogoMarkProps> = ({
  size = 40,
  className,
  alt = '',
  style,
  variant,
}) => {
  const { theme } = useTheme();
  const src = logoSrcForTheme(variant ?? theme);

  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={className}
      draggable={false}
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.28),
        objectFit: 'cover',
        display: 'block',
        flexShrink: 0,
        ...style,
      }}
    />
  );
};

export default LogoMark;
