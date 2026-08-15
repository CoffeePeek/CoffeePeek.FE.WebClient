import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  CATALOG_TAG_OPTIONS,
  COFFEE_FOCUS_LABELS,
  COFFEE_FOCUS_OPTIONS,
  GOOGLE_STATUS_LABELS,
  CoffeeFocus,
  GoogleBusinessStatus,
} from '../../constants/catalogIngest';
import { Badge, BadgeVariant } from '../ui/Badge';

export const ImportTabs: React.FC = () => {
  const { pathname } = useLocation();
  const queueActive =
    pathname === '/import' ||
    (pathname.startsWith('/import/') &&
      !pathname.startsWith('/import/inbox') &&
      !pathname.startsWith('/import/stats'));

  const tabClass = (active: boolean) =>
    `px-3 py-2 rounded-lg text-sm font-body min-h-[40px] ${
      active
        ? 'bg-primary/20 text-primary'
        : 'text-text-muted dark:text-stone-400 hover:text-text-main dark:hover:text-white hover:bg-white/5'
    }`;

  return (
    <div className="flex gap-1 overflow-x-auto">
      <NavLink to="/import" className={tabClass(queueActive)}>
        Очередь
      </NavLink>
      <NavLink to="/import/inbox" className={({ isActive }) => tabClass(isActive)}>
        Список
      </NavLink>
      <NavLink to="/import/stats" className={({ isActive }) => tabClass(isActive)}>
        Статистика
      </NavLink>
    </div>
  );
};

export const CoffeeFocusPicker: React.FC<{
  value?: CoffeeFocus;
  onChange: (value: CoffeeFocus) => void;
  disabled?: boolean;
}> = ({ value, onChange, disabled }) => (
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
    {COFFEE_FOCUS_OPTIONS.map((option) => {
      const active = value === option.value;
      return (
        <button
          key={option.value}
          type="button"
          disabled={disabled}
          onClick={() => onChange(option.value)}
          aria-pressed={active}
          className={[
            'flex flex-col items-start gap-1 rounded-xl border px-3 py-3 text-left min-h-[72px] transition-colors',
            active
              ? 'border-primary bg-primary/15 ring-1 ring-primary/40'
              : 'border-border-light dark:border-border-dark hover:border-primary/60',
          ].join(' ')}
        >
          <span className="text-sm font-semibold text-text-main dark:text-white font-display">
            {option.key}. {option.label}
          </span>
          <span className="text-xs text-text-muted dark:text-stone-400 font-body">{option.hint}</span>
        </button>
      );
    })}
  </div>
);

export const CatalogTagChips: React.FC<{
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}> = ({ value, onChange, disabled }) => (
  <div className="flex flex-wrap gap-2">
    {CATALOG_TAG_OPTIONS.map((tag) => {
      const active = value.includes(tag.slug);
      return (
        <button
          key={tag.slug}
          type="button"
          disabled={disabled}
          onClick={() =>
            onChange(active ? value.filter((slug) => slug !== tag.slug) : [...value, tag.slug])
          }
          className={`filter-chip ${
            active
              ? 'bg-primary text-black'
              : 'bg-gray-100 dark:bg-white/10 text-text-muted dark:text-stone-400 hover:bg-gray-200 dark:hover:bg-white/15'
          }`}
        >
          {tag.label}
        </button>
      );
    })}
  </div>
);

export function googleStatusBadgeVariant(status?: GoogleBusinessStatus): BadgeVariant {
  switch (status) {
    case 'Operational':
      return 'approved';
    case 'ClosedPermanently':
      return 'rejected';
    case 'ClosedTemporarily':
    case 'Far':
      return 'pending';
    case 'NotFound':
      return 'info';
    default:
      return 'default';
  }
}

export const GoogleStatusBadge: React.FC<{ status?: GoogleBusinessStatus }> = ({ status }) => (
  <Badge variant={googleStatusBadgeVariant(status)}>
    {status ? GOOGLE_STATUS_LABELS[status] : 'Google не проверен'}
  </Badge>
);

export const FocusBadge: React.FC<{ focus?: CoffeeFocus }> = ({ focus }) =>
  focus ? <Badge variant="info">{COFFEE_FOCUS_LABELS[focus]}</Badge> : <span className="text-stone-500">—</span>;
