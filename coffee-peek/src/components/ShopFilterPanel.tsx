import React, { useState, useEffect } from 'react';
import { City, Equipment, CoffeeBean, Roaster, BrewMethod, CoffeeShopFilters, ShopTagDto } from '../api/coffeeshop';
import { COLORS } from '../constants/colors';
import type { IconProps } from '@phosphor-icons/react';
import {
  GridFour, Clock, Sparkle, CheckCircle, Heart,
  MapPin, CaretDown, Check, X,
} from '@/components/Icon';
import { BeanPriceMarks } from './icons';
import { PRICE_FILTER_OPTIONS } from '../utils/priceRange';

const FIXED_QUICK_FILTERS: { id: string; label: string; Icon: React.ComponentType<IconProps> }[] = [
  { id: 'all',      label: 'Все',        Icon: GridFour     },
  { id: 'open',     label: 'Открыто',    Icon: Clock        },
  { id: 'new',      label: 'Новые',      Icon: Sparkle      },
  { id: 'visited',  label: 'Уже был',    Icon: CheckCircle },
  { id: 'favorite', label: 'Избранное',  Icon: Heart        },
];

const PRICE_OPTIONS = PRICE_FILTER_OPTIONS.map((o) => ({
  value: o.value,
  label: o.label,
  tiers: o.tiers,
}));

export interface AppliedFilters {
  priceRange?: string;
  equipments: string[];
  beans: string[];
  roasters: string[];
  brewMethods: string[];
}

interface ShopFilterPanelProps {
  // Quick filter chips
  activeQuick: string[];
  onQuickChange: (id: string) => void;
  // Shop tags (multi-select)
  shopTags: ShopTagDto[];
  selectedTagIds: string[];
  onTagToggle: (tagId: string) => void;
  isAuthenticated: boolean;
  // Panel toggle
  showFilters: boolean;
  // Currently applied values (for active chips + draft init)
  filters: CoffeeShopFilters;
  selectedEquipments: string[];
  selectedBeans: string[];
  selectedRoasters: string[];
  selectedBrewMethods: string[];
  // Data lists
  equipments: Equipment[];
  coffeeBeans: CoffeeBean[];
  roasters: Roaster[];
  brewMethods: BrewMethod[];
  // City
  cities: City[];
  selectedCity: string;
  onCityChange: (cityId: string) => void;
  showCityDropdown: boolean;
  onCityDropdownToggle: () => void;
  // Theme
  colors: { surface: string; border: string; textPrimary: string; background: string };
  dark: boolean;
  // Callbacks
  onApplyFilters: (applied: AppliedFilters) => void;
}

function toggle(arr: string[], id: string): string[] {
  return arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id];
}

const ShopFilterPanel: React.FC<ShopFilterPanelProps> = ({
  activeQuick, onQuickChange,
  shopTags, selectedTagIds, onTagToggle, isAuthenticated,
  showFilters,
  filters, selectedEquipments, selectedBeans, selectedRoasters, selectedBrewMethods,
  equipments, coffeeBeans, roasters, brewMethods,
  cities, selectedCity, onCityChange, showCityDropdown, onCityDropdownToggle,
  colors, dark,
  onApplyFilters,
}) => {
  const gold = COLORS.primary;
  const goldWarm = '#D4A84B';
  const currentCityName = cities.find(c => c.id === selectedCity)?.name || 'Город';
  const borderColor = dark ? '#3D2F28' : colors.border;
  const muted = dark ? '#A39E93' : '#78716C';
  const surface = dark ? '#2D241F' : '#fff';

  // ── Draft state (local — only committed on "Применить") ──────────
  const [draft, setDraft] = useState<AppliedFilters>({
    priceRange: undefined,
    equipments: [],
    beans: [],
    roasters: [],
    brewMethods: [],
  });

  // Sync draft from applied state when panel opens
  useEffect(() => {
    if (showFilters) {
      setDraft({
        priceRange: filters.priceRange,
        equipments: selectedEquipments,
        beans: selectedBeans,
        roasters: selectedRoasters,
        brewMethods: selectedBrewMethods,
      });
    }
  }, [showFilters]); // eslint-disable-line react-hooks/exhaustive-deps

  const draftCount =
    draft.equipments.length + draft.beans.length +
    draft.roasters.length + draft.brewMethods.length +
    (draft.priceRange ? 1 : 0);

  // Applied count (for active chips row)
  const appliedEquipments = selectedEquipments;
  const appliedBeans = selectedBeans;
  const appliedRoasters = selectedRoasters;
  const appliedBrewMethods = selectedBrewMethods;
  const appliedPrice = filters.priceRange;

  const hasApplied = appliedEquipments.length > 0 || appliedBeans.length > 0 ||
    appliedRoasters.length > 0 || appliedBrewMethods.length > 0 || !!appliedPrice;

  // ── Helpers ───────────────────────────────────────────────────────
  const chipBase: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '6px 12px', borderRadius: 99, whiteSpace: 'nowrap',
    fontFamily: '"RF Dewi Expanded"', fontWeight: 600, fontSize: 12,
    cursor: 'pointer', transition: 'all .15s', border: '1px solid',
  };

  const sectionLabel: React.CSSProperties = {
    fontFamily: '"RF Dewi Expanded"', fontSize: 10, fontWeight: 700,
    color: muted, letterSpacing: '.06em', textTransform: 'uppercase',
    marginBottom: 8,
  };

  const draftChip = (active: boolean): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '6px 12px', borderRadius: 99, cursor: 'pointer',
    fontFamily: '"RF Dewi Expanded"', fontWeight: 600, fontSize: 13,
    transition: 'all .15s', border: '1px solid',
    background: active ? `${gold}18` : (dark ? 'rgba(255,255,255,0.05)' : colors.background),
    color: active ? gold : (dark ? '#E5DDD8' : '#44403C'),
    borderColor: active ? `${gold}55` : borderColor,
  });

  const quickChipStyle = (active: boolean): React.CSSProperties => ({
    ...chipBase,
    background: active ? (dark ? '#fff' : '#1C1917') : (dark ? 'rgba(255,255,255,0.04)' : '#fff'),
    color: active ? (dark ? '#1C1917' : '#fff') : (dark ? '#fff' : '#1C1917'),
    borderColor: active ? 'transparent' : borderColor,
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-2">

      {/* ── Quick filter chips + applied chips ────────────────── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, alignItems: 'center', justifyContent: 'center', paddingBottom: 6 }}>

        {/* City selector chip */}
        <div style={{ position: 'relative' }}>
          <button onClick={onCityDropdownToggle} style={{
            ...chipBase,
            background: dark ? 'rgba(255,255,255,0.04)' : '#fff',
            color: dark ? '#fff' : '#1C1917',
            borderColor,
          }}>
            <MapPin size={14} color={goldWarm} />
            {currentCityName}
            <CaretDown size={13} color={muted} style={{ transition: 'transform .2s', transform: showCityDropdown ? 'rotate(180deg)' : 'none' }} />
          </button>
          {showCityDropdown && (
            <>
              <div className="fixed inset-0 z-10" onClick={onCityDropdownToggle} />
              <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)', borderRadius: 12, border: `1px solid ${borderColor}`, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', zIndex: 20, minWidth: 160, maxHeight: 280, overflowY: 'auto' as const, background: dark ? '#2D241F' : '#fff' }}>
                {cities.map(city => (
                  <button key={city.id} onClick={() => { onCityChange(city.id); onCityDropdownToggle(); }}
                    style={{ width: '100%', padding: '8px 12px', textAlign: 'left', background: selectedCity === city.id ? `${gold}15` : 'transparent', color: selectedCity === city.id ? gold : (dark ? '#fff' : '#1C1917'), border: 'none', cursor: 'pointer', fontFamily: '"RF Dewi Expanded"', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {selectedCity === city.id && <CheckCircle size={14} color={gold} />}
                    <span style={{ marginLeft: selectedCity === city.id ? 0 : 22 }}>{city.name}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 20, background: borderColor, flexShrink: 0 }} />

        {FIXED_QUICK_FILTERS.map(({ id, label, Icon }) => {
          const active = activeQuick.includes(id);
          const needsAuth = id === 'visited' && !isAuthenticated;
          return (
            <button
              key={id}
              onClick={() => onQuickChange(id)}
              style={{ ...quickChipStyle(active), opacity: needsAuth ? 0.75 : 1 }}
              title={needsAuth ? 'Требуется вход' : undefined}
            >
              <Icon size={14} color={active ? (dark ? goldWarm : '#fff') : goldWarm} />
              {label}
            </button>
          );
        })}

        {/* Dynamic shop tags */}
        {shopTags.map(tag => {
          const active = selectedTagIds.includes(tag.id);
          return (
            <button key={tag.id} onClick={() => onTagToggle(tag.id)} style={quickChipStyle(active)}>
              {tag.name}
            </button>
          );
        })}

        {/* Applied filter chips with individual X */}
        {appliedPrice && (
          <AppliedChip
            label={
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <BeanPriceMarks
                  count={PRICE_OPTIONS.find(p => p.value === appliedPrice)?.tiers ?? 1}
                  size={11}
                  color={gold}
                />
                {PRICE_OPTIONS.find(p => p.value === appliedPrice)?.label ?? appliedPrice}
              </span>
            }
            gold={gold}
            onRemove={() => onApplyFilters({ priceRange: undefined, equipments: appliedEquipments, beans: appliedBeans, roasters: appliedRoasters, brewMethods: appliedBrewMethods })} />
        )}
        {appliedEquipments.map(id => {
          const eq = equipments.find(e => e.id === id);
          return eq ? <AppliedChip key={id} label={eq.name} gold={gold}
            onRemove={() => onApplyFilters({ priceRange: appliedPrice, equipments: appliedEquipments.filter(x => x !== id), beans: appliedBeans, roasters: appliedRoasters, brewMethods: appliedBrewMethods })} /> : null;
        })}
        {appliedBeans.map(id => {
          const b = coffeeBeans.find(b => b.id === id);
          return b ? <AppliedChip key={id} label={b.name} gold={gold}
            onRemove={() => onApplyFilters({ priceRange: appliedPrice, equipments: appliedEquipments, beans: appliedBeans.filter(x => x !== id), roasters: appliedRoasters, brewMethods: appliedBrewMethods })} /> : null;
        })}
        {appliedRoasters.map(id => {
          const r = roasters.find(r => r.id === id);
          return r ? <AppliedChip key={id} label={r.name} gold={gold}
            onRemove={() => onApplyFilters({ priceRange: appliedPrice, equipments: appliedEquipments, beans: appliedBeans, roasters: appliedRoasters.filter(x => x !== id), brewMethods: appliedBrewMethods })} /> : null;
        })}
        {appliedBrewMethods.map(id => {
          const m = brewMethods.find(m => m.id === id);
          return m ? <AppliedChip key={id} label={m.name} gold={gold}
            onRemove={() => onApplyFilters({ priceRange: appliedPrice, equipments: appliedEquipments, beans: appliedBeans, roasters: appliedRoasters, brewMethods: appliedBrewMethods.filter(x => x !== id) })} /> : null;
        })}
        {hasApplied && (
          <button onClick={() => onApplyFilters({ priceRange: undefined, equipments: [], beans: [], roasters: [], brewMethods: [] })}
            style={{ ...chipBase, background: 'transparent', color: muted, borderColor: 'transparent', fontSize: 11 }}>
            Сбросить всё
          </button>
        )}
      </div>

      {/* ── Slide-down filter panel ───────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateRows: showFilters ? '1fr' : '0fr',
        transition: 'grid-template-rows 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        <div style={{ overflow: 'hidden' }}>
          <div style={{
            padding: '20px 20px 0',
            marginBottom: 16,
            borderRadius: 16,
            border: `1px solid ${borderColor}`,
            background: dark ? 'rgba(45,36,31,0.75)' : surface,
            backdropFilter: dark ? 'blur(12px)' : 'none',
          }}>

            {/* Price */}
            <div style={{ marginBottom: 20 }}>
              <div style={sectionLabel}>Цена</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {PRICE_OPTIONS.map(({ value, label, tiers }) => {
                  const active = draft.priceRange === value;
                  return (
                    <button key={value}
                      onClick={() => setDraft(d => ({ ...d, priceRange: active ? undefined : value }))}
                      style={draftChip(active)}>
                      {active && <Check size={13} />}
                      <BeanPriceMarks count={tiers} size={12} color={active ? gold : COLORS.primary} />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Equipment */}
            {equipments.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={sectionLabel}>Оборудование</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {equipments.map(eq => {
                    const active = draft.equipments.includes(eq.id);
                    return (
                      <button key={eq.id}
                        onClick={() => setDraft(d => ({ ...d, equipments: toggle(d.equipments, eq.id) }))}
                        style={draftChip(active)}>
                        {active && <Check size={13} />}
                        {eq.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Beans */}
            {coffeeBeans.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={sectionLabel}>Зёрна</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {coffeeBeans.map(b => {
                    const active = draft.beans.includes(b.id);
                    return (
                      <button key={b.id}
                        onClick={() => setDraft(d => ({ ...d, beans: toggle(d.beans, b.id) }))}
                        style={draftChip(active)}>
                        {active && <Check size={13} />}
                        {b.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Roasters */}
            {roasters.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={sectionLabel}>Обжарщики</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {roasters.map(r => {
                    const active = draft.roasters.includes(r.id);
                    return (
                      <button key={r.id}
                        onClick={() => setDraft(d => ({ ...d, roasters: toggle(d.roasters, r.id) }))}
                        style={draftChip(active)}>
                        {active && <Check size={13} />}
                        {r.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Brew methods */}
            {brewMethods.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={sectionLabel}>Заваривание</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {brewMethods.map(m => {
                    const active = draft.brewMethods.includes(m.id);
                    return (
                      <button key={m.id}
                        onClick={() => setDraft(d => ({ ...d, brewMethods: toggle(d.brewMethods, m.id) }))}
                        style={draftChip(active)}>
                        {active && <Check size={13} />}
                        {m.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 20, borderTop: `1px solid ${borderColor}`, paddingTop: 16 }}>
              <button
                onClick={() => onApplyFilters(draft)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 22px', borderRadius: 10, border: 'none', background: gold, color: '#1A1412', fontFamily: '"RF Dewi Expanded"', fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'opacity .15s' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                <Check size={16} />
                Применить{draftCount > 0 && ` (${draftCount})`}
              </button>

              {draftCount > 0 && (
                <button
                  onClick={() => setDraft({ priceRange: undefined, equipments: [], beans: [], roasters: [], brewMethods: [] })}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '10px 16px', borderRadius: 10, border: `1px solid ${borderColor}`, background: 'transparent', color: muted, fontFamily: '"RF Dewi Expanded"', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}
                >
                  <X size={15} />
                  Сбросить
                </button>
              )}

              <span style={{ fontFamily: '"RF Dewi Expanded"', fontSize: 12, color: muted, marginLeft: 'auto' }}>
                {draftCount > 0 ? `${draftCount} ${draftCount === 1 ? 'фильтр' : draftCount < 5 ? 'фильтра' : 'фильтров'} выбрано` : 'Фильтры не выбраны'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Active chip (applied, with X) ────────────────────────────────────
const AppliedChip: React.FC<{ label: React.ReactNode; gold: string; onRemove: () => void }> = ({ label, gold, onRemove }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '5px 8px 5px 12px', borderRadius: 99, whiteSpace: 'nowrap',
    background: `${gold}15`, color: gold, border: `1px solid ${gold}40`,
    fontFamily: '"RF Dewi Expanded"', fontWeight: 600, fontSize: 12,
  }}>
    {label}
    <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 2 }}>
      <X size={13} color={gold} />
    </button>
  </span>
);

export default ShopFilterPanel;
