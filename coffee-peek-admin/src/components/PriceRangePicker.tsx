import React from 'react';
import {
  PRICE_RANGE_OPTIONS,
  parsePriceRange,
  type PriceRangeOption,
} from '../constants/priceRange';

function PriceRangeSymbols({ count, active }: { count: number; active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-base font-semibold leading-none ${
        active ? 'text-black' : 'text-primary'
      }`}
      aria-hidden
    >
      {Array.from({ length: count }, (_, index) => (
        <span key={index}>₽</span>
      ))}
    </span>
  );
}

interface PriceRangePickerProps {
  value: unknown;
  onChange: (value: 1 | 2 | 3 | 4 | undefined) => void;
  allowEmpty?: boolean;
  error?: string;
  disabled?: boolean;
}

export const PriceRangePicker: React.FC<PriceRangePickerProps> = ({
  value,
  onChange,
  allowEmpty = false,
  error,
  disabled = false,
}) => {
  const selected = parsePriceRange(value);

  const handleSelect = (option: PriceRangeOption) => {
    if (disabled) return;
    if (allowEmpty && selected === option.value) {
      onChange(undefined);
      return;
    }
    onChange(option.value);
  };

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {PRICE_RANGE_OPTIONS.map((option) => {
          const active = selected === option.value;
          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => handleSelect(option)}
              aria-pressed={active}
              className={[
                'flex flex-col items-center justify-center gap-1.5 rounded-xl border px-3 py-3 min-h-[88px] transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                active
                  ? 'border-primary bg-primary/15 ring-1 ring-primary/40'
                  : 'border-border-light dark:border-border-dark bg-white dark:bg-surface-dark hover:border-primary/60 hover:bg-primary/5',
              ].join(' ')}
            >
              <PriceRangeSymbols count={option.symbolCount} active={active} />
              <span
                className={`text-xs font-medium font-body text-center ${
                  active ? 'text-text-main dark:text-white' : 'text-text-muted dark:text-stone-400'
                }`}
              >
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
      {allowEmpty && selected && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange(undefined)}
          className="mt-2 text-xs text-text-muted dark:text-stone-500 hover:text-primary transition-colors font-body"
        >
          Сбросить выбор
        </button>
      )}
      {error && <p className="text-red-400 text-xs mt-1.5 font-body">{error}</p>}
    </div>
  );
};

export const PriceRangeDisplay: React.FC<{ value: unknown }> = ({ value }) => {
  const selected = parsePriceRange(value);
  if (!selected) return <span>—</span>;

  const option = PRICE_RANGE_OPTIONS.find((item) => item.value === selected);
  if (!option) return <span>{String(value)}</span>;

  return (
    <span className="inline-flex items-center gap-2">
      <PriceRangeSymbols count={option.symbolCount} active={false} />
      <span>{option.label}</span>
    </span>
  );
};
