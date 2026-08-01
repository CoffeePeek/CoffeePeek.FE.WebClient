import React from 'react';

interface BynSignProps {
  size?: number | string;
  className?: string;
  color?: string;
  style?: React.CSSProperties;
  title?: string | null;
}

/** Belarusian ruble graphic (NBRB 2026): Cyrillic «Б» with mid bar. */
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
    <path d="M6.5 2.5h11.5v3.1H9.6v5.35h7.35c3.55 0 6.05 2.2 6.05 5.35 0 3.2-2.55 5.45-6.15 5.45H6.5V2.5zm3.1 11.55v4.25h4.15c1.85 0 3.05-1.05 3.05-2.15s-1.2-2.1-3.05-2.1H9.6z" />
    <rect x="2" y="10.55" width="9.2" height="2.75" rx="0.2" />
  </svg>
);

export const BynPriceMarks: React.FC<{
  count: number;
  size?: number;
  className?: string;
  color?: string;
}> = ({ count, size = 13, className, color }) => {
  const n = Math.max(0, Math.min(4, Math.floor(count)));
  if (n === 0) return null;
  return (
    <span className={className} style={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
      {Array.from({ length: n }, (_, i) => (
        <BynSign key={i} size={size} color={color} title={null} />
      ))}
    </span>
  );
};
