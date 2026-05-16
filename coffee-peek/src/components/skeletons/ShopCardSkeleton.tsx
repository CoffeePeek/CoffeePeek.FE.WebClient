import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import Shimmer from './Shimmer';

interface ShopCardSkeletonProps {
  count?: number;
  variant?: 'card' | 'row';
}

const ShopCardSkeleton: React.FC<ShopCardSkeletonProps> = ({ count = 6, variant = 'card' }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const surface = isDark ? '#2D241F' : '#ffffff';
  const border = isDark ? '#3D2F28' : '#E7E5E4';

  if (variant === 'row') {
    return (
      <>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: 12,
            background: surface, border: `1px solid ${border}`,
            borderRadius: 16,
          }}>
            {/* Square photo */}
            <Shimmer width={84} height={84} style={{ borderRadius: 12 }} />

            {/* Text content */}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {/* Name + rating */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <Shimmer width="55%" height={16} />
                <Shimmer width={44} height={22} style={{ borderRadius: 6 }} />
              </div>
              {/* Status + address */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Shimmer width={52} height={16} style={{ borderRadius: 6 }} />
                <Shimmer width="38%" height={13} />
              </div>
              {/* Tags */}
              <div style={{ display: 'flex', gap: 4 }}>
                <Shimmer width={60} height={22} style={{ borderRadius: 8 }} />
                <Shimmer width={72} height={22} style={{ borderRadius: 8 }} />
              </div>
            </div>
          </div>
        ))}
      </>
    );
  }

  // Card variant — matches ShopCard: borderRadius 16, 5:3 photo, 12px 14px body padding
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          background: surface, border: `1px solid ${border}`,
          borderRadius: 16, overflow: 'hidden',
        }}>
          {/* Photo — 5:3 aspect ratio */}
          <div style={{ position: 'relative', aspectRatio: '5/3', overflow: 'hidden' }}>
            <Shimmer width="100%" height="100%" className="!rounded-none" />
          </div>

          {/* Body */}
          <div style={{ padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {/* Name + open badge */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
              <Shimmer width="58%" height={16} />
              <Shimmer width={52} height={18} style={{ borderRadius: 6 }} />
            </div>

            {/* Address */}
            <Shimmer width="75%" height={13} />

            {/* Meta */}
            <Shimmer width="45%" height={12} />

            {/* Tags */}
            <div style={{ marginTop: 4, display: 'flex', gap: 4 }}>
              <Shimmer width={64} height={24} style={{ borderRadius: 8 }} />
              <Shimmer width={76} height={24} style={{ borderRadius: 8 }} />
            </div>
          </div>
        </div>
      ))}
    </>
  );
};

export default ShopCardSkeleton;
