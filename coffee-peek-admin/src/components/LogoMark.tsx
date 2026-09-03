import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

/** Transparent mascot mark — background comes from theme. */
export const LOGO_SRC = '/logo/logo.png';
/** Baked favicon / static assets with theme background. */

const LOGO_BG = {
  light: '#FAFAF9',
  dark: '#1A1412',
} as const;

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
  const radius = Math.round(size * 0.28);

  return (
    <span
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: dark ? LOGO_BG.dark : LOGO_BG.light,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <img
        src={LOGO_SRC}
        alt={alt}
        width={size}
        height={size}
        draggable={false}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'block',
        }}
      />
    </span>
  );
};

export default LogoMark;
