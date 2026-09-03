import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface ShopPhotoPlaceholderProps {
  /** Matches Android 18sp default; pass 7 or 24 for compact/hero slots. */
  fontSize?: number;
  className?: string;
  style?: React.CSSProperties;
}

/** Empty-photo fill matching the mobile Compose placeholder. */
const ShopPhotoPlaceholder: React.FC<ShopPhotoPlaceholderProps> = ({
  fontSize = 18,
  className,
  style,
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div
      className={className}
      aria-hidden
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: isDark ? '#FFFFFF' : '#000000',
        ...style,
      }}
    >
      <span
        style={{
          fontFamily: '"RF Dewi Expanded", sans-serif',
          fontWeight: 800,
          fontSize,
          letterSpacing: '-0.045em',
          lineHeight: 1,
          textAlign: 'center',
          textTransform: 'uppercase',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          maxWidth: '100%',
          color: isDark ? '#000000' : '#FFFFFF',
          userSelect: 'none',
        }}
      >
        COFFEEPEEK
      </span>
    </div>
  );
};

export default ShopPhotoPlaceholder;
