import React from 'react';
import { COLORS } from '../constants/colors';

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
    padding: '0 14px',
    borderRadius: 10,
    background: showFilters ? gold : inputBg,
    color: showFilters ? '#1A1412' : (dark ? '#fff' : '#1C1917'),
    border: `1px solid ${showFilters ? gold : borderColor}`,
    cursor: 'pointer',
    fontFamily: '"RF Dewi Expanded","Sora"',
    fontWeight: 600,
    fontSize: 13,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    transition: 'all .15s',
    flexShrink: 0,
    position: 'relative',
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

      {/* ── Desktop ───────────────────────────────────────────── */}
      <div className="hidden lg:block pt-6 pb-4">
        {/* Title — centered, own row */}
        <h1 style={{ margin: '0 0 16px', fontFamily: '"RF Dewi Expanded","Sora",system-ui', fontWeight: 700, fontSize: 26, lineHeight: 1.1, letterSpacing: '-0.02em', color: dark ? '#fff' : '#1C1917', textAlign: 'center' }}>
          Кофейни рядом
        </h1>

        {/* Search + Фильтры row */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Search — fills all space */}
          <div style={{ flex: 1, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}>
              <span className="material-symbols-rounded" style={{ fontSize: 18, color: goldWarm, lineHeight: 1 }}>search</span>
            </span>
            <input
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              maxLength={100}
              placeholder="Кофейня или район…"
              style={{ width: '100%', height: 40, borderRadius: 10, border: `1px solid ${inputBorder}`, background: inputBg, padding: '0 14px 0 40px', fontSize: 14, fontFamily: '"Noto Sans",system-ui', color: dark ? '#fff' : '#1C1917', outline: 'none', boxSizing: 'border-box' as const }}
            />
          </div>

          {/* Фильтры — right of search */}
          <button onClick={onFilterToggle} style={filterBtn(40)}>
            <span className="material-symbols-rounded" style={{ fontSize: 16, color: showFilters ? '#1A1412' : gold, lineHeight: 1 }}>tune</span>
            Фильтры
            {activeFilterCount > 0 && (
              <span style={{ minWidth: 18, height: 18, borderRadius: 99, background: showFilters ? '#1A1412' : gold, color: showFilters ? gold : '#1A1412', fontFamily: '"Noto Sans"', fontWeight: 700, fontSize: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Mobile header ─────────────────────────────────────── */}
      <div className="lg:hidden pt-[60px] pb-3">
        <div className="flex items-center justify-between">
          <h1 style={{ margin: 0, fontFamily: '"RF Dewi Expanded","Sora"', fontWeight: 700, fontSize: 20, letterSpacing: '-0.02em', color: dark ? '#fff' : '#1C1917' }}>
            Кофейни рядом
          </h1>
          <button style={{ position: 'relative', width: 38, height: 38, borderRadius: 99, background: colors.surface, border: `1px solid ${borderColor}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-rounded" style={{ fontSize: 20, color: dark ? '#fff' : '#1C1917', lineHeight: 1 }}>notifications</span>
            <span style={{ position: 'absolute', top: 8, right: 9, width: 7, height: 7, borderRadius: 99, background: gold, border: `2px solid ${colors.surface}` }} />
          </button>
        </div>
      </div>

      {/* ── Mobile search — Search left, Фильтры right ─────── */}
      <div className="lg:hidden pb-3">
        <div style={{ display: 'flex', gap: 8 }}>
          {/* Search — fills remaining */}
          <div style={{ flex: 1, position: 'relative' }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }}>
              <span className="material-symbols-rounded" style={{ fontSize: 18, color: goldWarm, lineHeight: 1 }}>search</span>
            </span>
            <input
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              maxLength={100}
              placeholder="Найти кофейню рядом"
              style={{ width: '100%', height: 44, borderRadius: 10, border: `1px solid ${inputBorder}`, background: colors.surface, padding: '0 14px 0 40px', fontSize: 14, fontFamily: '"Noto Sans"', color: dark ? '#fff' : '#1C1917', outline: 'none', boxSizing: 'border-box' as const }}
            />
          </div>

          {/* Фильтры — right */}
          <button onClick={onFilterToggle} style={filterBtn(44)}>
            <span className="material-symbols-rounded" style={{ fontSize: 16, color: showFilters ? '#1A1412' : gold, lineHeight: 1 }}>tune</span>
            Фильтры
            {activeFilterCount > 0 && (
              <span style={{ minWidth: 18, height: 18, borderRadius: 99, background: showFilters ? '#1A1412' : gold, color: showFilters ? gold : '#1A1412', fontFamily: '"Noto Sans"', fontWeight: 700, fontSize: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '0 5px' }}>
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
