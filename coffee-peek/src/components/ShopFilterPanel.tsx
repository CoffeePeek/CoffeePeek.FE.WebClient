import React from 'react';
import MaterialSelect from './MaterialSelect';
import { Equipment, CoffeeBean, Roaster, BrewMethod, CoffeeShopFilters, formatEquipmentName, getEquipmentCategoryLabel } from '../api/coffeeshop';
import { COLORS } from '../constants/colors';

const QUICK_FILTERS = [
  { id: 'all',      label: 'Все',          icon: 'apps'                 },
  { id: 'open',     label: 'Открыто',      icon: 'schedule'             },
  { id: 'specialty',label: 'Спешелти',     icon: 'coffee'               },
  { id: 'roastery', label: 'Обжарка',      icon: 'local_fire_department'},
  { id: 'wifi',     label: 'Wi-Fi',        icon: 'wifi'                 },
  { id: 'outdoor',  label: 'Терраса',      icon: 'deck'                 },
  { id: 'vegan',    label: 'Веган',        icon: 'eco'                  },
  { id: 'pets',     label: 'Pet-friendly', icon: 'pets'                 },
] as const;

interface ShopFilterPanelProps {
  filters: CoffeeShopFilters;
  equipments: Equipment[];
  coffeeBeans: CoffeeBean[];
  roasters: Roaster[];
  brewMethods: BrewMethod[];
  selectedEquipment: string;
  selectedBeans: string;
  selectedRoasters: string;
  selectedBrewMethods: string;
  colors: { surface: string; border: string; textPrimary: string; background: string };
  dark: boolean;
  shopsCount: number;
  onFilterChange: (key: keyof CoffeeShopFilters, value: string | string[] | undefined) => void;
  onEquipmentChange: (v: string) => void;
  onBeansChange: (v: string) => void;
  onRoastersChange: (v: string) => void;
  onBrewMethodsChange: (v: string) => void;
  onClearFilters: () => void;
}

const ShopFilterPanel: React.FC<ShopFilterPanelProps> = ({
  filters, equipments, coffeeBeans, roasters, brewMethods,
  selectedEquipment, selectedBeans, selectedRoasters, selectedBrewMethods,
  colors, dark, shopsCount,
  onFilterChange, onEquipmentChange, onBeansChange, onRoastersChange, onBrewMethodsChange, onClearFilters,
}) => {
  const gold = COLORS.primary;
  const goldWarm = '#B48C4B';
  const borderColor = dark ? '#3D2F28' : colors.border;
  const chipActiveBg = dark ? '#fff' : '#1C1917';
  const chipActiveColor = dark ? '#1A1412' : '#fff';
  const chipInactiveBg = dark ? 'rgba(255,255,255,0.04)' : '#fff';
  const chipInactiveColor = dark ? '#fff' : '#1C1917';

  // Quick filter active state based on current filters
  const getActiveQuick = () => {
    if (filters.priceRange === 'specialty' as unknown) return 'specialty';
    return 'all';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
      {/* ── Desktop filter bar ─────────────────────────────── */}
      <div className="hidden lg:flex items-center justify-between gap-4 flex-wrap">
        {/* Quick filter chips */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' as const }}>
          {QUICK_FILTERS.map(({ id, label, icon }) => {
            const active = id === 'all' && !filters.priceRange && !selectedEquipment && !selectedBeans;
            return (
              <button key={id}
                onClick={() => {
                  if (id === 'all') onClearFilters();
                }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 99,
                  background: active ? chipActiveBg : chipInactiveBg,
                  color: active ? chipActiveColor : chipInactiveColor,
                  border: `1px solid ${active ? gold : borderColor}`,
                  fontFamily: '"Noto Sans",system-ui', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all .15s',
                }}>
                <span className="material-symbols-rounded" style={{ fontSize: 16, color: active ? gold : goldWarm, lineHeight: 1 }}>{icon}</span>
                {label}
              </button>
            );
          })}
        </div>

        {/* Right: count + sort + view toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontFamily: '"Noto Sans"', fontSize: 13, color: dark ? '#A39E93' : '#78716C' }}>
            {shopsCount} кофеен ·
          </span>
          <span style={{ fontFamily: '"Noto Sans"', fontSize: 13, color: dark ? '#A39E93' : '#78716C' }}>Сортировка</span>
          <select style={{ padding: '8px 12px', borderRadius: 10, border: `1px solid ${borderColor}`, background: dark ? 'rgba(255,255,255,0.04)' : '#fff', fontFamily: '"Noto Sans"', fontSize: 13, color: dark ? '#fff' : '#1C1917', cursor: 'pointer', outline: 'none' }}>
            <option style={{ background: dark ? '#2D241F' : '#fff' }}>Рекомендуем</option>
            <option style={{ background: dark ? '#2D241F' : '#fff' }}>По расстоянию</option>
            <option style={{ background: dark ? '#2D241F' : '#fff' }}>По рейтингу</option>
            <option style={{ background: dark ? '#2D241F' : '#fff' }}>Новые</option>
          </select>
          <div style={{ display: 'flex', borderRadius: 10, border: `1px solid ${borderColor}`, overflow: 'hidden' }}>
            <button style={{ padding: '8px 12px', background: dark ? 'rgba(255,255,255,0.04)' : '#F5F5F4', color: dark ? '#fff' : '#1C1917', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
              <span className="material-symbols-rounded" style={{ fontSize: 18, color: gold, lineHeight: 1 }}>grid_view</span>
            </button>
            <button style={{ padding: '8px 12px', background: 'transparent', color: dark ? '#A39E93' : '#78716C', border: 'none', cursor: 'pointer', borderLeft: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center' }}>
              <span className="material-symbols-rounded" style={{ fontSize: 18, lineHeight: 1 }}>map</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Advanced filters (shown when panel open) ─────────── */}
      <div className="mt-4 rounded-2xl p-6 border" style={{ background: colors.surface, borderColor }}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <MaterialSelect label="Ценовой диапазон" value={filters.priceRange || ''} onChange={(v) => onFilterChange('priceRange', v || undefined)}
            options={[{ value: '', label: 'Любой' }, { value: 'Budget', label: '$ Бюджетный' }, { value: 'Moderate', label: '$$ Средний' }, { value: 'Premium', label: '$$$ Премиум' }]}
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>} />
          <MaterialSelect label="Оборудование" value={selectedEquipment} onChange={onEquipmentChange}
            options={[{ value: '', label: 'Любое' }, ...equipments.map(e => ({ value: e.id, label: `${formatEquipmentName(e)} — ${getEquipmentCategoryLabel(e.category)}` }))]}
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>} />
          <MaterialSelect label="Зёрна" value={selectedBeans} onChange={onBeansChange}
            options={[{ value: '', label: 'Любые' }, ...coffeeBeans.map(b => ({ value: b.id, label: b.name }))]}
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>} />
          <MaterialSelect label="Обжарщики" value={selectedRoasters} onChange={onRoastersChange}
            options={[{ value: '', label: 'Любые' }, ...roasters.map(r => ({ value: r.id, label: r.name }))]}
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"/></svg>} />
          <MaterialSelect label="Методы заваривания" value={selectedBrewMethods} onChange={onBrewMethodsChange}
            options={[{ value: '', label: 'Любые' }, ...brewMethods.map(m => ({ value: m.id, label: m.name }))]}
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>} />
          <div className="flex items-end">
            <button onClick={onClearFilters} className="w-full py-3 px-6 rounded-xl font-medium transition-all flex items-center justify-center gap-2" style={{ background: colors.background, color: colors.textPrimary, border: `1px solid ${borderColor}` }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              Сбросить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopFilterPanel;
