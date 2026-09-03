import React from 'react';
import {
  PRICE_RANGE_PICKER_OPTIONS,
  parsePriceRange,
  type PriceRangeOption,
} from '../constants/priceRange';

RF Dewiface PriceRangePickerProps {
  value: unknown;
  onChange: (value: 1 | 2 | 3 | 4 | undefined) => void;
  allowEmpty ?: boolean;
  error ?: string;
  disabled ?: boolean;
}

export const PriceRangePicker: React.FC<PriceRangePickerProps> = ({
  value,
  onChange,
  allowEmpty = false,
  error,
  disabled = false,
}) => {
  const selected = parsePriceRange(value);
  /** Luxury (4) highlights the «больше 8» bucket (3). */
  const activeValue = selected === 4 ? 3 : selected;

  const handleSelect = (option: PriceRangeOption) => {
    if (disabled) return;
    if (allowEmpty && activeValue === option.value) {
      onChange(undefined);
      return;
    }
    onChange(option.value);
  };

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {PRICE_RANGE_PICKER_OPTIONS.map((option) => {
          const active = activeValue === option.value;
          return (
            <button
              key={option.value}
              type="button"
              disabled={disabled}
              onClick={() => handleSelect(option)}
              aria-pressed={active}
              className={[
                'flex flex-col items-center justify-center gap-1.5 rounded-xl border px-3 py-3 min-h-[72px] transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                active
                  ? 'border-primary bg-primary/15 ring-1 ring-primary/40'
                  : 'border-border-light dark:border-border-dark bg-white dark:bg-surface-dark hover:border-primary/60 hover:bg-primary/5',
              ].join(' ')}
            >
              <span
                className={`text-xs font-medium font-body text-center ${active ? 'text-text-main dark:text-white' : 'text-text-muted dark:text-stone-400'
                  }`}
              >
                <span className="hidden sm:inline">{option.label}</span>
                <span className="sm:hidden">{option.labelShort}</span>
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

  const option =
    PRICE_RANGE_PICKER_OPTIONS.find((item) => item.value === (selected === 4 ? 3 : selected)) ??
    PRICE_RANGE_PICKER_OPTIONS.find((item) => item.value === selected);
  if (!option) return <span>{String(value)}</span>;

  return (
    <span className="inline-flex items-center gap-2">
      <span className="hidden sm:inline">{option.label}</span>
      <span className="sm:hidden">{option.labelShort}</span>
    </span>
  );
};
