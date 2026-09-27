import React from 'react';
import { PRICE_FILTER_OPTIONS, toPriceFilterLevel } from '../utils/priceRange';

const SEGMENT_LABELS = ['До 8', '8', 'От 8'] as const;

export interface PriceRangeSliderProps {
  value?: string;
  onChange: (value?: string) => void;
  gold?: string;
  muted?: string;
  track?: string;
  /** When false, selecting the active segment does not clear. Default true. */
  allowClear?: boolean;
}

/** Three discrete cappuccino price ranges presented as an Apple-style segmented control. */
export const PriceRangeSlider: React.FC<PriceRangeSliderProps> = ({
  value,
  onChange,
  gold = '#EAB308',
  muted = '#78716C',
  track = '#E7E5E4',
  allowClear = true,
}) => {
  const selected = toPriceFilterLevel(value);

  return (
    <div
      role="group"
      aria-label="Цена капучино"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        gap: 2,
        width: '100%',
        padding: 2,
        borderRadius: 999,
        overflow: 'hidden',
        background: track,
        boxSizing: 'border-box',
      }}
    >
      {PRICE_FILTER_OPTIONS.map((option, index) => {
        const active = selected === option.value;
        return (
          <button
            key={option.value}
            type="button"
            aria-label={option.label}
            aria-pressed={active}
            onClick={() => onChange(active && allowClear ? undefined : option.value)}
            style={{
              minWidth: 0,
              minHeight: 30,
              padding: '0 8px',
              border: 'none',
              borderRadius: 999,
              background: active ? gold : 'transparent',
              color: active ? '#1A1412' : muted,
              boxShadow: active ? '0 2px 8px rgba(0,0,0,.16)' : 'none',
              fontFamily: '"Manrope"',
              fontSize: 12,
              fontWeight: active ? 750 : 600,
              cursor: 'pointer',
              transition: 'background .2s, color .2s, box-shadow .2s',
            }}
          >
            {SEGMENT_LABELS[index]}
          </button>
        );
      })}
    </div>
  );
};

export default PriceRangeSlider;
