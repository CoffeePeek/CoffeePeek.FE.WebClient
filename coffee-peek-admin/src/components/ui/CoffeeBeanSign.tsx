import React from 'react';

const ACCENT = '#EAB308';
const BYN_ASPECT = 945 / 1170;
const BYN_PATH =
  'M945 826Q941 973 837 1070Q733 1167 578 1170H295H166V890H0V760H166V0H816V130H295V482H578Q733 486 837 583Q941 680 945 826ZM295 759H592V891H295V1041H579Q680 1039 748 977Q815 917 818 826Q815 734 747.5 673.0Q680 612 579 610H437H295Z';

interface CoffeeBeanSignProps {
  size?: number | string;
  className?: string;
  color?: string;
  style?: React.CSSProperties;
  title?: string | null;
}

/** Coffee bean (SVG Repo). Defaults to brand gold accent. */
export const CoffeeBeanSign: React.FC<CoffeeBeanSignProps> = ({
  size = 14,
  className,
  color = ACCENT,
  style,
  title = 'Кофейное зерно',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 326.05 326.05"
    fill={color}
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    style={{ display: 'inline-block', verticalAlign: '-0.12em', flexShrink: 0, ...style }}
    aria-hidden={title ? undefined : true}
    role={title ? 'img' : undefined}
  >
    {title ? <title>{title}</title> : null}
    <path d="M14.257,275.602C-17.052,220.391,4.253,133.798,69.023,69.01c73.553-73.543,175.256-91.076,227.182-39.16c0.061,0.068,0.112,0.145,0.195,0.214c-10.392,30.235-43.486,94.567-142.686,129.348C62.842,191.29,27.788,241.972,14.257,275.602z M310.81,48.75c-7.871,18.361-21.57,42.356-45.173,65.957c-23.725,23.735-57.445,47.046-105.208,63.8C63.49,212.5,36.405,268.149,28.848,295.116c0.357,0.36,0.664,0.733,1.011,1.083c51.921,51.918,153.628,34.386,227.176-39.169C322.479,191.585,343.526,103.869,310.81,48.75z" />
  </svg>
);

/** Official NBRB Belarusian ruble sign (glyph from nbrb webfont, rendered as SVG). */
export const BynSign: React.FC<{
  size?: number;
  className?: string;
  color?: string;
  style?: React.CSSProperties;
}> = ({ size = 14, className, color = ACCENT, style }) => {
  const height = size;
  const width = Math.max(1, Math.round(size * BYN_ASPECT));
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 945 1170"
      fill={color}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'inline-block', verticalAlign: '-0.12em', flexShrink: 0, ...style }}
      aria-hidden
    >
      <path d={BYN_PATH} />
    </svg>
  );
};

export const BeanPriceMarks: React.FC<{
  count: number;
  size?: number;
  className?: string;
  color?: string;
}> = ({ count, size = 13, className, color = ACCENT }) => {
  const n = Math.max(0, Math.min(4, Math.floor(count)));
  if (n === 0) return null;
  return (
    <span
      className={className}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 2, whiteSpace: 'nowrap' }}
      aria-label={`Ценовой уровень ${n}`}
    >
      {Array.from({ length: n }, (_, i) => (
        <BynSign key={i} size={size} color={color} />
      ))}
    </span>
  );
};
