import React from 'react';
import { Equipment, CoffeeBean, Roaster, BrewMethod, CoffeeShopFilters } from '../api/coffeeshop';
import { COLORS } from '../constants/colors';

const QUICK_FILTERS = [
  { id: 'all',       label: 'Все',          icon: 'apps'                  },
  { id: 'open',      label: 'Открыто',      icon: 'schedule'              },
  { id: 'specialty', label: 'Спешелти',     icon: 'coffee'                },
  { id: 'roastery',  label: 'Обжарка',      icon: 'local_fire_department' },
  { id: 'wifi',      label: 'Wi-Fi',        icon: 'wifi'                  },
  { id: 'outdoor',   label: 'Терраса',      icon: 'deck'                  },
  { id: 'vegan',     label: 'Веган',        icon: 'eco'                   },
  { id: 'pets',      label: 'Pet-friendly', icon: 'pets'                  },
] as const;

const PRICE_OPTIONS = [
  { value: 'Budget',   label: '$ Бюджетный' },
  { value: 'Moderate', label: '$$ Средний'  },
  { value: 'Premium',  label: '$$$ Премиум' },
];

interface ShopFilterPanelProps {
  activeQuick: string;
  onQuickChange: (id: string) => void;
  showFilters: boolean;
  filters: CoffeeShopFilters;
  equipments: Equipment[];
  coffeeBeans: CoffeeBean[];
  roasters: Roaster[];
  brewMethods: BrewMethod[];
  selectedEquipments: string[];
  selectedBeans: string[];
  selectedRoasters: string[];
  selectedBrewMethods: string[];
  colors: { surface: string; border: string; textPrimary: string; background: string };
  dark: boolean;
  onFilterChange: (key: keyof CoffeeShopFilters, value: string | string[] | undefined) => void;
  onEquipmentChange: (ids: string[]) => void;
  onBeansChange: (ids: string[]) => void;
  onRoastersChange: (ids: string[]) => void;
  onBrewMethodsChange: (ids: string[]) => void;
  onClearAdvanced: () => void;
}

function toggle(arr: string[], id: string): string[] {
  return arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id];
}

const ShopFilterPanel: React.FC<ShopFilterPanelProps> = ({
  activeQuick, onQuickChange,
  showFilters,
  filters, equipments, coffeeBeans, roasters, brewMethods,
  selectedEquipments, selectedBeans, selectedRoasters, selectedBrewMethods,
  colors, dark,
  onFilterChange, onEquipmentChange, onBeansChange, onRoastersChange, onBrewMethodsChange, onClearAdvanced,
}) => {
  const gold = COLORS.primary;
  const goldWarm = '#B48C4B';
  const borderColor = dark ? '#3D2F28' : colors.border;
  const muted = dark ? '#A39E93' : '#78716C';

  // Build active advanced filter chips for the chips row
  const advancedChips: { label: string; onRemove: () => void }[] = [];
  if (filters.priceRange) {
    const pl = PRICE_OPTIONS.find(p => p.value === filters.priceRange)?.label ?? filters.priceRange;
    advancedChips.push({ label: pl, onRemove: () => onFilterChange('priceRange', undefined) });
  }
  selectedEquipments.forEach(id => {
    const eq = equipments.find(e => e.id === id);
    if (eq) advancedChips.push({ label: eq.name, onRemove: () => onEquipmentChange(selectedEquipments.filter(x => x !== id)) });
  });
  selectedBeans.forEach(id => {
    const b = coffeeBeans.find(b => b.id === id);
    if (b) advancedChips.push({ label: b.name, onRemove: () => onBeansChange(selectedBeans.filter(x => x !== id)) });
  });
  selectedRoasters.forEach(id => {
    const r = roasters.find(r => r.id === id);
    if (r) advancedChips.push({ label: r.name, onRemove: () => onRoastersChange(selectedRoasters.filter(x => x !== id)) });
  });
  selectedBrewMethods.forEach(id => {
    const m = brewMethods.find(m => m.id === id);
    if (m) advancedChips.push({ label: m.name, onRemove: () => onBrewMethodsChange(selectedBrewMethods.filter(x => x !== id)) });
  });

  const chipBase: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '6px 12px', borderRadius: 99, whiteSpace: 'nowrap',
    fontFamily: '"Noto Sans",system-ui', fontWeight: 600, fontSize: 12,
    cursor: 'pointer', transition: 'all .15s', border: '1px solid',
  };

  const sectionLabel: React.CSSProperties = {
    fontFamily: '"Noto Sans"', fontSize: 10, fontWeight: 700,
    color: muted, letterSpacing: '.05em', textTransform: 'uppercase',
    marginBottom: 6,
  };

  const multiChip = (active: boolean): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '5px 11px', borderRadius: 99,
    fontFamily: '"Noto Sans",system-ui', fontWeight: 600, fontSize: 12,
    cursor: 'pointer', transition: 'all .15s', border: '1px solid',
    background: active ? `${gold}18` : (dark ? 'rgba(255,255,255,0.04)' : '#fff'),
    color: active ? gold : (dark ? '#E5DDD8' : '#44403C'),
    borderColor: active ? `${gold}60` : borderColor,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">

      {/* ── Quick filter chips row (wraps) ─────────────────────── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, alignItems: 'center', paddingBottom: 4 }}>

        {QUICK_FILTERS.map(({ id, label, icon }) => {
          const active = activeQuick === id;
          return (
            <button key={id} onClick={() => onQuickChange(id)} style={{
              ...chipBase,
              background: active ? (dark ? '#fff' : '#1C1917') : (dark ? 'rgba(255,255,255,0.04)' : '#fff'),
              color: active ? (dark ? '#1C1917' : '#fff') : (dark ? '#fff' : '#1C1917'),
              borderColor: active ? 'transparent' : borderColor,
            }}>
              <span className="material-symbols-rounded" style={{ fontSize: 14, color: active ? (dark ? goldWarm : '#fff') : goldWarm, lineHeight: 1 }}>{icon}</span>
              {label}
            </button>
          );
        })}

        {/* Active advanced filter chips */}
        {advancedChips.map(({ label, onRemove }) => (
          <span key={label} style={{ ...chipBase, background: `${gold}15`, color: gold, borderColor: `${gold}40`, cursor: 'default' }}>
            {label}
            <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0, marginLeft: 2 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 13, color: gold, lineHeight: 1 }}>close</span>
            </button>
          </span>
        ))}

        {advancedChips.length > 0 && (
          <button onClick={onClearAdvanced} style={{ ...chipBase, background: 'transparent', color: muted, borderColor: 'transparent', fontSize: 12 }}>
            Сбросить все
          </button>
        )}
      </div>

      {/* ── Advanced filter panel ──────────────────────────────── */}
      {showFilters && (
        <div style={{ marginTop: 10, padding: '16px 18px', borderRadius: 14, border: `1px solid ${borderColor}`, background: dark ? 'rgba(45,36,31,0.7)' : '#fff', backdropFilter: dark ? 'blur(12px)' : 'none' }}>

          {/* Price range */}
          <div style={{ marginBottom: 16 }}>
            <div style={sectionLabel}>Цена</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {PRICE_OPTIONS.map(({ value, label }) => {
                const active = filters.priceRange === value;
                return (
                  <button key={value} onClick={() => onFilterChange('priceRange', active ? undefined : value)} style={multiChip(active)}>
                    {active && <span className="material-symbols-rounded" style={{ fontSize: 12, lineHeight: 1 }}>check</span>}
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Equipment */}
          {equipments.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={sectionLabel}>Оборудование</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {equipments.map(eq => {
                  const active = selectedEquipments.includes(eq.id);
                  return (
                    <button key={eq.id} onClick={() => onEquipmentChange(toggle(selectedEquipments, eq.id))} style={multiChip(active)}>
                      {active && <span className="material-symbols-rounded" style={{ fontSize: 12, lineHeight: 1 }}>check</span>}
                      {eq.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Coffee beans */}
          {coffeeBeans.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={sectionLabel}>Зёрна</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {coffeeBeans.map(b => {
                  const active = selectedBeans.includes(b.id);
                  return (
                    <button key={b.id} onClick={() => onBeansChange(toggle(selectedBeans, b.id))} style={multiChip(active)}>
                      {active && <span className="material-symbols-rounded" style={{ fontSize: 12, lineHeight: 1 }}>check</span>}
                      {b.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Roasters */}
          {roasters.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={sectionLabel}>Обжарщики</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {roasters.map(r => {
                  const active = selectedRoasters.includes(r.id);
                  return (
                    <button key={r.id} onClick={() => onRoastersChange(toggle(selectedRoasters, r.id))} style={multiChip(active)}>
                      {active && <span className="material-symbols-rounded" style={{ fontSize: 12, lineHeight: 1 }}>check</span>}
                      {r.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Brew methods */}
          {brewMethods.length > 0 && (
            <div style={{ marginBottom: advancedChips.length > 0 ? 12 : 0 }}>
              <div style={sectionLabel}>Заваривание</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {brewMethods.map(m => {
                  const active = selectedBrewMethods.includes(m.id);
                  return (
                    <button key={m.id} onClick={() => onBrewMethodsChange(toggle(selectedBrewMethods, m.id))} style={multiChip(active)}>
                      {active && <span className="material-symbols-rounded" style={{ fontSize: 12, lineHeight: 1 }}>check</span>}
                      {m.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Clear all */}
          {advancedChips.length > 0 && (
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${borderColor}` }}>
              <button onClick={onClearAdvanced} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: `1px solid ${borderColor}`, background: 'transparent', color: muted, fontFamily: '"Noto Sans"', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 14, lineHeight: 1 }}>close</span>
                Сбросить всё
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ShopFilterPanel;
