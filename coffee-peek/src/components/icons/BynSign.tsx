import React from 'react';

interface BynSignProps {
  size?: number | string;
  className?: string;
  color?: string;
  style?: React.CSSProperties;
  /** Decorative repeats should pass title={undefined} */
  title?: string | null;
}

/**
 * Graphic symbol of the Belarusian ruble (NBRB, 2026): Cyrillic «Б» with a mid bar.
 * Not yet reliable as Unicode in all fonts — render as SVG.
 */
export const BynSign: React.FC<BynSignProps> = ({
  size = 14,
  className,
  color = 'currentColor',
  style,
  title = 'Белорусский рубль',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={color}
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ display: 'inline-block', verticalAlign: '-0.15em', flexShrink: 0, ...style }}
    aria-hidden={title ? undefined : true}
    role={title ? 'img' : undefined}
  >
    {title ? <title>{title}</title> : null}
    {/* Letter Б body */}
    <path d="M5 3h13.2v3.2H8.4v5.1h6.1c3.7 0 6.3 2.4 6.3 5.55S18.2 22.4 14.5 22.4H5V3zm3.4 11.5v4.7h5.9c1.7 0 2.85-1.05 2.85-2.35s-1.15-2.35-2.85-2.35H8.4z" />
    {/* Mid bar parallel to the top — currency mark */}
    <rect x="2.2" y="10.35" width="10.2" height="2.7" rx="0.35" />
  </svg>
);

interface BynPriceMarksProps {
  count: number;
  size?: number;
  className?: string;
  color?: string;
  gap?: number;
}

/** Repeat the BYN sign for price-range tiers. */
export const BynPriceMarks: React.FC<BynPriceMarksProps> = ({
  count,
  size = 13,
  className,
  color,
  gap = 1,
}) => {
  const n = Math.max(0, Math.min(4, Math.floor(count)));
  if (n === 0) return null;
  return (
    <span
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', gap }}
      aria-label={`${n}`}
    >
      {Array.from({ length: n }, (_, i) => (
        <BynSign key={i} size={size} color={color} title={null} />
      ))}
    </span>
  );
};

export default BynSign;
