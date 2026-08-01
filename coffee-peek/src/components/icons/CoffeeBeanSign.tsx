import React from 'react';

interface CoffeeBeanSignProps {
  size?: number | string;
  className?: string;
  color?: string;
  style?: React.CSSProperties;
  /** Decorative repeats should pass title={null} */
  title?: string | null;
}

/** Coffee bean mark used for price-range tiers. */
export const CoffeeBeanSign: React.FC<CoffeeBeanSignProps> = ({
  size = 14,
  className,
  color = 'currentColor',
  style,
  title = 'Кофейное зерно',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={color}
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ display: 'inline-block', verticalAlign: '-0.12em', flexShrink: 0, ...style }}
    aria-hidden={title ? undefined : true}
    role={title ? 'img' : undefined}
  >
    {title ? <title>{title}</title> : null}
    {/* Bean silhouette with S-crease cutout */}
    <path
      fillRule="evenodd"
      d="M12 1.75c-3.55 0-6.75 3.05-7.85 7.15-1.15 4.25-.15 8.85 2.85 11.55 1.95 1.75 3.55 2.3 5 2.3s3.05-.55 5-2.3c3-2.7 4-7.3 2.85-11.55C18.75 4.8 15.55 1.75 12 1.75zm0 2.4c-.85 3.1-1.05 6.55-.2 9.85.55 2.15 1.55 3.95 2.75 5.2C13.7 19.75 12.9 20 12 20s-1.7-.25-2.55-.8c1.2-1.25 2.2-3.05 2.75-5.2.85-3.3.65-6.75-.2-9.85z"
    />
  </svg>
);

interface BeanPriceMarksProps {
  count: number;
  size?: number;
  className?: string;
  color?: string;
  gap?: number;
}

/** Repeat coffee beans for price-range tiers. */
export const BeanPriceMarks: React.FC<BeanPriceMarksProps> = ({
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
        <CoffeeBeanSign key={i} size={size} color={color} title={null} />
      ))}
    </span>
  );
};

export default CoffeeBeanSign;
