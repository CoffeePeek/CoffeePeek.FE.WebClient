import React from 'react';

export const LOGO_SRC = '/logo.png';
export const HEADER_LOGO_SIZE = 52;

interface LogoMarkProps {
  size?: number;
  className?: string;
  alt?: string;
  style?: React.CSSProperties;
}

const LogoMark: React.FC<LogoMarkProps> = ({
  size = 40,
  className,
  alt = '',
  style,
}) => (
  <img
    src={LOGO_SRC}
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

export default LogoMark;
