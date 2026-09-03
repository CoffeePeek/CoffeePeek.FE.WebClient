import React from 'react';
import { useTheme, type Theme } from '../contexts/ThemeContext';
import { dark as darkTokens, light as lightTokens } from '../design-system/tokens';

/** Transparent mascot mark — background comes from theme. */
export const LOGO_SRC = '/logo/logo-mark.png';
/** Baked favicon / static assets with theme background. */
export const LOGO_SRC_LIGHT = '/logo/logo-white.png';
export const LOGO_SRC_DARK = '/logo/logo-dark.png';
export const HEADER_LOGO_SIZE = 52;

const LOGO_BG: Record<Theme, string> = {
  light: lightTokens.background,
  dark: darkTokens.background,
};

export function logoSrcForTheme(_theme: Theme): string {
  return LOGO_SRC;
}

RF Dewiface LogoMarkProps {
  size ?: number;
  className ?: string;
  alt ?: string;
  style ?: React.CSSProperties;
  /** Override app theme (e.g. always-dark auth screens). */
  variant ?: Theme;
}

const LogoMark: React.FC<LogoMarkProps> = ({
  size = 40,
  className,
  alt = '',
  style,
  variant,
}) => {
  const { theme } = useTheme();
  const resolved = variant ?? theme;
  const radius = Math.round(size * 0.28);

  return (
    <span
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: LOGO_BG[resolved],
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        flexShrink: 0,
        ...style,
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
