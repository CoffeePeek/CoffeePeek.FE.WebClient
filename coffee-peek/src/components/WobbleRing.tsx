import React from 'react';

interface WobbleRingProps {
  /** Diameter in px. Defaults to 48. */
  size?: number;
  /** Stroke colour. Defaults to #EAB308 (gold). */
  color?: string;
  className?: string;
}

/**
 * Organic "Wobble ring" loader — border-radius-morphing ring + rotation.
 * Keyframes live in index.css (.wobble-ring class).
 *
 * Replaces border-t-transparent spinners app-wide.
 * Shimmer / skeleton components are intentionally left unchanged.
 */
const WobbleRing: React.FC<WobbleRingProps> = ({
  size = 48,
  color = '#EAB308',
  className = '',
}) => (
  <span
    className={`wobble-ring ${className}`}
    role="status"
    aria-label="Загрузка"
    style={{
      width: size,
      height: size,
      borderWidth: Math.max(2, Math.round(size / 16)),
      borderTopColor: color,
      borderRightColor: color,
    }}
  />
);

export default WobbleRing;
