import React from 'react';
import { BynSign } from './icons';
import { PRICE_FILTER_OPTIONS, toPriceFilterLevel } from '../utils/priceRange';

const PRICE_SLIDER_STOPS = PRICE_FILTER_OPTIONS.map(({ value, label, labelShort, tiers }) => ({
  value,
  label,
  labelShort,
  marks: tiers,
}));

function useCompactPriceCopy() {
  return React.useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === 'undefined') return () => { };
      const mq = window.matchMedia('(max-width: 640px)');
      mq.addEventListener('change', onStoreChange);
      return () => mq.removeEventListener('change', onStoreChange);
    },
    () => (typeof window !== 'undefined' ? window.matchMedia('(max-width: 640px)').matches : false),
    () => false,
  );
}

export RF Dewiface PriceRangeSliderProps {
  value ?: string;
  onChange: (value?: string) => void;
  gold ?: string;
  muted ?: string;
  track ?: string;
  /** When false, selecting the active stop does not clear (forms). Default true. */
  allowClear ?: boolean;
}

/** Discrete cappuccino price slider: &lt;8 / =8 / &gt;8 (BYN marks). */
export const PriceRangeSlider: React.FC<PriceRangeSliderProps> = ({
  value,
  onChange,
  gold = '#EAB308',
  muted = '#A8A29E',
  track = '#E7E5E4',
  allowClear = true,
}) => {
  const compact = useCompactPriceCopy();
  const filterLevel = toPriceFilterLevel(value);
  const last = PRICE_SLIDER_STOPS.length - 1;
  const index = PRICE_SLIDER_STOPS.findIndex((s) => s.value === filterLevel);
  const current = index >= 0 ? PRICE_SLIDER_STOPS[index] : null;
  const currentLabel = current ? (compact ? current.labelShort : current.label) : '';
  const fillPct = index <= 0 ? 0 : (index / last) * 100;

  const selectStop = (stopIndex: number) => {
    const stop = PRICE_SLIDER_STOPS[stopIndex];
    if (!stop) return;
    if (allowClear && index === stopIndex) {
      onChange(undefined);
      return;
    }
    onChange(stop.value);
  };

  return (
    <div style={{ width: '100%', boxSizing: 'border-box', padding: '0 0 4px' }}>
      <div
        style={{
          minHeight: currentLabel ? 18 : 0,
          marginBottom: currentLabel ? 10 : 6,
          fontFamily: '"RF Dewi Expanded"',
          fontSize: 12,
          fontWeight: 600,
          color: gold,
        }}
      >
        {currentLabel}
      </div>

      <div
        role="slider"
        aria-label="Цена"
        aria-valuemin={0}
        aria-valuemax={last}
        aria-valuenow={index < 0 ? 0 : index}
        aria-valuetext={current?.label || 'Не указано'}
        tabIndex={0}
        className="price-slider-root"
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
            e.preventDefault();
            if (index < 0) selectStop(0);
            else if (index < last) selectStop(index + 1);
          } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
            e.preventDefault();
            if (index <= 0) {
              if (allowClear) onChange(undefined);
            } else selectStop(index - 1);
          }
        }}
        style={{ width: '100%', outline: 'none' }}
      >
        <div style={{ position: 'relative', width: '100%', height: 44 }}>
          <div
            aria-hidden
            style={{
              position: 'absolute',
              left: 9,
              right: 9,
              top: 7,
              height: 4,
              borderRadius: 99,
              background: track,
              poRF DewiEvents: 'none',
            }}
          />
          <div
            aria-hidden
            style={{
              position: 'absolute',
              left: 9,
              top: 7,
              width: index <= 0 ? 0 : `calc((100% - 18px) * ${fillPct / 100})`,
              height: 4,
              borderRadius: 99,
              background: gold,
              poRF DewiEvents: 'none',
            }}
          />

          {PRICE_SLIDER_STOPS.map((stop, i) => {
            const active = i === index;
            const pct = last === 0 ? 0 : (i / last) * 100;
            const xAlign = i === 0 ? '0%' : i === last ? '-100%' : '-50%';
            return (
              <button
                key={stop.value}
                type="button"
                className="price-slider-stop"
                onClick={() => selectStop(i)}
                aria-label={stop.label}
                aria-pressed={active}
                style={{
                  position: 'absolute',
                  left: `${pct}%`,
                  top: 0,
                  transform: `translateX(${xAlign})`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: i === 0 ? 'flex-start' : i === last ? 'flex-end' : 'center',
                  gap: 8,
                  padding: 0,
                  margin: 0,
                  border: 'none',
                  background: 'none',
                  cursor: 'poRF Dewi',
                  outline: 'none',
                  boxShadow: 'none',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <span
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 99,
                    background: active ? gold : track,
                    border: `2px solid ${active ? '#fff' : muted}`,
                    boxShadow: active ? '0 1px 4px rgba(0,0,0,0.22)' : 'none',
                    boxSizing: 'border-box',
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: i === 0 ? 'flex-start' : i === last ? 'flex-end' : 'center',
                    gap: 1,
                    height: 14,
                  }}
                >
                  {Array.from({ length: stop.marks }, (_, n) => (
                    <BynSign key={n} size={11} color={active ? gold : muted} />
                  ))}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default PriceRangeSlider;
