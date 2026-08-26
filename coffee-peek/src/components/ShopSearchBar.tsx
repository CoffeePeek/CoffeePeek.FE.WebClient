import React from 'react';
import { COLORS } from '../constants/colors';
import { AppIcon } from './icons';

interface ShopSearchBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  showFilters: boolean;
  onFilterToggle: () => void;
  activeFilterCount: number;
  colors: { surface: string; border: string; textPrimary: string; textSecondary: string; background: string };
  dark: boolean;
}

const ShopSearchBar: React.FC<ShopSearchBarProps> = ({
  searchQuery, onSearchChange, showFilters, onFilterToggle, activeFilterCount,
  colors, dark,
}) => {
  const gold = COLORS.primary;
  const goldWarm = '#D4A84B';
  const borderColor = dark ? '#3D2F28' : colors.border;
  const inputBg = dark ? 'rgba(255,255,255,0.04)' : '#fff';
  const inputBorder = dark ? '#3D2F28' : 'rgba(158,123,54,.4)';

  const filterBtn = (height: number): React.CSSProperties => ({
    height,
    padding: '0 10px',
    borderRadius: 10,
    background: showFilters ? gold : inputBg,
    color: showFilters ? '#1A1412' : (dark ? '#fff' : '#1C1917'),
    border: `1px solid ${showFilters ? gold : borderColor}`,
    cursor: 'pointer',
    fontFamily: '"RF Dewi Expanded"',
    fontWeight: 600,
    fontSize: 12,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    whiteSpace: 'nowrap',
    flexShrink: 0,
    minWidth: 'max-content',
    boxSizing: 'border-box',
    transition: 'all .15s',
    position: 'relative',
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

      {/* ── Desktop ───────────────────────────────────────────── */}
      <div className="hidden lg:block pt-6 pb-4">
        {/* Title — centered, own row */}
        <h1 style={{ margin: '0 0 16px', fontFamily: '"RF Dewi Expanded"', fontWeight: 700, fontSize: 26, lineHeight: 1.1, letterSpacing: '-0.02em', color: dark ? '#fff' : '#1C1917', textAlign: 'center' }}>
          Кофейни рядом
        </h1>

        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}>
            <AppIcon name="search" size={18} color={goldWarm} />
          </span>
          <input
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            maxLength={100}
            placeholder="Кофейня или район…"
            style={{ width: '100%', height: 40, borderRadius: 10, border: `1px solid ${inputBorder}`, background: inputBg, padding: '0 14px 0 40px', fontSize: 14, fontFamily: '"RF Dewi Expanded"', color: dark ? '#fff' : '#1C1917', outline: 'none', boxSizing: 'border-box' as const }}
          />
        </div>
      </div>

      {/* ── Mobile header ─────────────────────────────────────── */}
      <div className="lg:hidden pt-5 pb-3">
        <h1 style={{ margin: 0, fontFamily: '"RF Dewi Expanded"', fontWeight: 700, fontSize: 20, letterSpacing: '-0.02em', color: dark ? '#fff' : '#1C1917' }}>
          Кофейни рядом
        </h1>
      </div>

      {/* ── Mobile search — Search left, Фильтры right ─────── */}
      <div className="lg:hidden pb-3">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          {/* Search — fills remaining */}
          <div style={{ flex: '1 1 0', minWidth: 0, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
              <AppIcon name="search" size={18} color={goldWarm} />
            </span>
            <input
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              maxLength={100}
              placeholder="Найти кофейню"
              style={{ width: '100%', height: 44, borderRadius: 10, border: `1px solid ${inputBorder}`, background: colors.surface, padding: '0 14px 0 40px', fontSize: 14, fontFamily: '"RF Dewi Expanded"', color: dark ? '#fff' : '#1C1917', outline: 'none', boxSizing: 'border-box' as const, minWidth: 0 }}
            />
          </div>

          {/* Фильтры — right */}
          <button type="button" onClick={onFilterToggle} style={{ ...filterBtn(44), background: showFilters ? gold : colors.surface }}>
            <AppIcon name="tune" size={16} color={showFilters ? '#1A1412' : gold} />
            <span>Фильтры</span>
            {activeFilterCount > 0 && (
              <span style={{ minWidth: 18, height: 18, borderRadius: 99, background: showFilters ? '#1A1412' : gold, color: showFilters ? gold : '#1A1412', fontFamily: '"RF Dewi Expanded"', fontWeight: 700, fontSize: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShopSearchBar;
