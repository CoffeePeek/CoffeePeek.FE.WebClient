import React from 'react';

export const MASCOT_SRC = {
  happy: '/maskot-emotion/maskot-happy.png',
  astonishment: '/maskot-emotion/maskot-astonishment.png',
  dance: '/maskot-emotion/maskot-dance.png',
  book: '/maskot-props/maskot-with-book.png',
  laptop: '/maskot-props/maskot-with-laptop.png',
  search: '/maskot-props/maskot-with-magnifying-glass.png',
  bean: '/maskot-props/maskot-with-bean.png',
  cup: '/maskot-props/maskot-wthi-cup.png',
  dessert: '/maskot-props/maskot-with-dessert.png',
} as const;

export type MascotPose = keyof typeof MASCOT_SRC;

interface MascotProps {
  pose: MascotPose;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  alt?: string;
  eager?: boolean;
}

const Mascot: React.FC<MascotProps> = ({
  pose,
  size = 160,
  className,
  style,
  alt = '',
  eager = false,
}) => (
  <img
    src={MASCOT_SRC[pose]}
    alt={alt}
    width={size}
    height={size}
    draggable={false}
    loading={eager ? 'eager' : 'lazy'}
    decoding="async"
    className={className}
    style={{
      width: size,
      height: size,
      objectFit: 'contain',
      display: 'block',
      pointerEvents: 'none',
      userSelect: 'none',
      ...style,
    }}
  />
);

export default Mascot;
