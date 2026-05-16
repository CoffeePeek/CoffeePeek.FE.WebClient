import React from 'react';
import { City } from '../api/coffeeshop';
import { COLORS } from '../constants/colors';

type FilterTab = 'open' | 'new' | 'favorite' | 'visited';

interface ShopSearchBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  showFilters: boolean;
  onFilterToggle: () => void;
  cities: City[];
  selectedCity: string;
  onCityChange: (cityId: string) => void;
  showCityDropdown: boolean;
  onCityDropdownToggle: () => void;
  activeFilterTabs: Set<FilterTab>;
  onFilterTabToggle: (id: FilterTab) => void;
  colors: { surface: string; border: string; textPrimary: string; textSecondary: string; background: string };
  dark: boolean;
}

const FILTER_TABS: { id: FilterTab; label: string; icon: string }[] = [
  { id: 'open',     label: 'Открыто',    icon: 'schedule'    },
  { id: 'new',      label: 'Новые',      icon: 'fiber_new'   },
  { id: 'favorite', label: 'Избранные',  icon: 'favorite'    },
  { id: 'visited',  label: 'Посещённые', icon: 'check_circle'},
];

const ShopSearchBar: React.FC<ShopSearchBarProps> = ({
  searchQuery, onSearchChange, showFilters, onFilterToggle,
  cities, selectedCity, onCityChange, showCityDropdown, onCityDropdownToggle,
  activeFilterTabs, onFilterTabToggle, colors, dark,
}) => {
  const currentCity = cities.find(c => c.id === selectedCity)?.name || 'Москва';
  const gold = COLORS.primary;
  const goldWarm = '#B48C4B';
  const muted = dark ? '#A39E93' : '#78716C';
  const subtle = dark ? '#5C544F' : '#A8A29E';
  const borderColor = dark ? '#3D2F28' : colors.border;
  const inputBg = dark ? 'rgba(255,255,255,0.04)' : '#fff';
  const inputBorder = dark ? '#3D2F28' : 'rgba(158,123,54,.4)';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* ── Desktop hero ─────────────────────────────────────── */}
      <div className="hidden lg:block pt-6 pb-5">
        <div className="flex items-center gap-4">
          {/* Left: title + location */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-3 flex-wrap">
              <h1 style={{ margin: 0, fontFamily: '"RF Dewi Expanded","Sora",system-ui', fontWeight: 700, fontSize: 28, lineHeight: 1.1, letterSpacing: '-0.02em', color: dark ? '#fff' : '#1C1917' }}>
                Кофейни рядом
              </h1>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 99, background: 'rgba(34,197,94,.10)', color: '#22C55E', fontFamily: '"Noto Sans"', fontWeight: 700, fontSize: 11, letterSpacing: '.06em', textTransform: 'uppercase' as const }}>
                <span style={{ width: 7, height: 7, borderRadius: 99, background: '#22C55E', animation: 'wobble-spin 2s linear infinite' }} />
                Открыты
              </span>
              {/* City selector */}
              <div className="relative">
                <button onClick={onCityDropdownToggle} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: '"Noto Sans"', fontSize: 13, color: muted }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 14, color: goldWarm, lineHeight: 1 }}>location_on</span>
                  {currentCity}
                  <button style={{ background: 'none', border: 'none', color: gold, fontFamily: '"Noto Sans"', fontWeight: 600, fontSize: 12, cursor: 'pointer', padding: 0 }}>сменить</button>
                </button>
                {showCityDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={onCityDropdownToggle} />
                    <div style={{ position: 'absolute', top: '100%', left: 0, marginTop: 8, borderRadius: 12, border: `1px solid ${borderColor}`, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', zIndex: 20, minWidth: 160, maxHeight: 280, overflowY: 'auto' as const, background: dark ? '#2D241F' : '#fff' }}>
                      {cities.map((city) => (
                        <button key={city.id} onClick={() => { onCityChange(city.id); onCityDropdownToggle(); }}
                          style={{ width: '100%', padding: '8px 12px', textAlign: 'left', background: selectedCity === city.id ? `${gold}15` : 'transparent', color: selectedCity === city.id ? gold : (dark ? '#fff' : '#1C1917'), border: 'none', cursor: 'pointer', fontFamily: '"Noto Sans"', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                          {selectedCity === city.id && <span className="material-symbols-rounded star-filled" style={{ fontSize: 14, color: gold, lineHeight: 1 }}>check_circle</span>}
                          <span style={{ marginLeft: selectedCity === city.id ? 0 : 22 }}>{city.name}</span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: search + filter button */}
          <div style={{ flex: '0 0 520px', display: 'flex', gap: 8 }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 18, color: goldWarm, lineHeight: 1 }}>search</span>
              </span>
              <input
                value={searchQuery}
                onChange={e => onSearchChange(e.target.value)}
                maxLength={100}
                placeholder="Кофейня, район или сорт зерна…"
                style={{ width: '100%', height: 44, borderRadius: 12, border: `1px solid ${inputBorder}`, background: inputBg, padding: '0 52px 0 44px', fontSize: 14, fontFamily: '"Noto Sans",system-ui', color: dark ? '#fff' : '#1C1917', outline: 'none', boxSizing: 'border-box' as const }}
              />
              <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontFamily: '"Noto Sans"', fontSize: 11, color: subtle, padding: '3px 7px', border: `1px solid ${borderColor}`, borderRadius: 6, pointerEvents: 'none' }}>⌘K</span>
            </div>
            <button onClick={onFilterToggle} style={{ height: 44, padding: '0 16px', borderRadius: 12, background: inputBg, color: dark ? '#fff' : '#1C1917', border: `1px solid ${borderColor}`, cursor: 'pointer', fontFamily: '"RF Dewi Expanded","Sora"', fontWeight: 600, fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 16, color: gold, lineHeight: 1 }}>tune</span>
              Фильтры
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile header ──────────────────────────────────────── */}
      <div className="lg:hidden pt-[60px] pb-3">
        <div className="flex items-center justify-between">
          <div>
            <p style={{ margin: 0, fontFamily: '"Noto Sans"', fontSize: 12, color: muted, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 13, color: goldWarm, lineHeight: 1 }}>location_on</span>
              {currentCity}
            </p>
            <h1 style={{ margin: '4px 0 0', fontFamily: '"RF Dewi Expanded","Sora"', fontWeight: 700, fontSize: 22, letterSpacing: '-0.02em', color: dark ? '#fff' : '#1C1917' }}>
              Кофейни рядом
            </h1>
          </div>
          <button style={{ position: 'relative', width: 40, height: 40, borderRadius: 99, background: colors.surface, border: `1px solid ${borderColor}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-rounded" style={{ fontSize: 20, color: dark ? '#fff' : '#1C1917', lineHeight: 1 }}>notifications</span>
            <span style={{ position: 'absolute', top: 8, right: 9, width: 8, height: 8, borderRadius: 99, background: gold, border: `2px solid ${colors.surface}` }} />
          </button>
        </div>
      </div>

      {/* ── Mobile search ─────────────────────────────────────── */}
      <div className="lg:hidden pb-3">
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }}>
            <span className="material-symbols-rounded" style={{ fontSize: 20, color: goldWarm, lineHeight: 1 }}>search</span>
          </span>
          <input
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            maxLength={100}
            placeholder="Найти кофейню рядом"
            style={{ width: '100%', height: 48, borderRadius: 12, border: `1px solid ${inputBorder}`, background: colors.surface, padding: '0 52px 0 46px', fontSize: 14, fontFamily: '"Noto Sans"', color: dark ? '#fff' : '#1C1917', outline: 'none', boxSizing: 'border-box' as const }}
          />
          <button onClick={onFilterToggle} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', width: 32, height: 32, borderRadius: 8, background: 'rgba(180,140,75,.12)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="material-symbols-rounded" style={{ fontSize: 18, color: goldWarm, lineHeight: 1 }}>tune</span>
          </button>
        </div>
      </div>

      {/* ── Filter chips (mobile horizontal scroll + desktop wrap) ── */}
      <div className="lg:hidden pb-1 -mx-4 px-4 overflow-x-auto no-scrollbar">
        <div style={{ display: 'flex', gap: 8, paddingBottom: 4 }}>
          {FILTER_TABS.map(({ id, label, icon }) => {
            const active = activeFilterTabs.has(id);
            return (
              <button key={id} onClick={() => onFilterTabToggle(id)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' as const, padding: '7px 14px', borderRadius: 99, background: active ? (dark ? '#fff' : '#1C1917') : colors.surface, color: active ? (dark ? '#1C1917' : '#fff') : (dark ? '#fff' : '#1C1917'), border: `1px solid ${active ? 'transparent' : borderColor}`, fontFamily: '"Noto Sans"', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 15, color: active ? (dark ? goldWarm : '#fff') : goldWarm, lineHeight: 1 }}>{icon}</span>
                {label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ShopSearchBar;
