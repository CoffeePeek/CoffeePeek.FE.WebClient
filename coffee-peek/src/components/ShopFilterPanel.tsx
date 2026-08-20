import React, { useState } from 'react';
import { City, Equipment, CoffeeBean, Roaster, BrewMethod, CoffeeShopFilters, ShopTagDto } from '../api/coffeeshop';
import { COLORS } from '../constants/colors';
import type { IconProps } from '@phosphor-icons/react';
import {
  GridFour, Clock, Sparkle, CheckCircle, Heart,
  MapPin, CaretDown, Check, X,
} from '@/components/Icon';
import { BeanPriceMarks } from './icons';
import { PRICE_FILTER_OPTIONS } from '../utils/priceRange';

const LIST_PREVIEW = 6;

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

const FOCUS_OPTIONS = [
  { value: 'specialty', label: 'Specialty' },
  { value: 'coffee_bar', label: 'Кофейня' },
  { value: 'cafe', label: 'Кафе' },
];

export interface AppliedFilters {
  priceRange?: string;
  coffeeFocus?: string;
  equipments: string[];
  beans: string[];
  roasters: string[];
  brewMethods: string[];
}

interface ShopFilterPanelProps {
  mode: 'chips' | 'quick' | 'sidebar';
  activeQuick: string[];
  onQuickChange: (id: string) => void;
  shopTags: ShopTagDto[];
  selectedTagIds: string[];
  onTagToggle: (tagId: string) => void;
  filters: CoffeeShopFilters;
  selectedEquipments: string[];
  selectedBeans: string[];
  selectedRoasters: string[];
  selectedBrewMethods: string[];
  equipments: Equipment[];
  coffeeBeans: CoffeeBean[];
  roasters: Roaster[];
  brewMethods: BrewMethod[];
  cities: City[];
  selectedCity: string;
  onCityChange: (cityId: string) => void;
  showCityDropdown: boolean;
  onCityDropdownToggle: () => void;
  colors: { surface: string; border: string; textPrimary: string; background: string };
  dark: boolean;
  onApplyFilters: (applied: AppliedFilters) => void;
  resultCount?: number;
  onClose?: () => void;
}

function toggle(arr: string[], id: string): string[] {
  return arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id];
}

const FilterAccordion: React.FC<{
  title: string;
  count?: number;
  defaultOpen?: boolean;
  muted: string;
  textPrimary: string;
  borderColor: string;
  children: React.ReactNode;
}> = ({ title, count = 0, defaultOpen = false, muted, textPrimary, borderColor, children }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
          padding: '12px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{
          fontFamily: '"RF Dewi Expanded"', fontSize: 13, fontWeight: 700,
          color: textPrimary, letterSpacing: '-0.01em',
        }}>
          {title}
          {count > 0 && (
            <span style={{ marginLeft: 6, color: COLORS.primary, fontWeight: 700 }}>{count}</span>
          )}
        </span>
        <CaretDown
          size={14}
          color={muted}
          style={{ transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none', flexShrink: 0 }}
        />
      </button>
      {open && <div style={{ paddingBottom: 14 }}>{children}</div>}
    </div>
  );
};

const CheckMark: React.FC<{ checked: boolean; gold: string; borderColor: string }> = ({ checked, gold, borderColor }) => (
  <span style={{
    width: 16, height: 16, borderRadius: 4, flexShrink: 0,
    border: `1.5px solid ${checked ? gold : borderColor}`,
    background: checked ? gold : 'transparent',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  }}>
    {checked ? <Check size={11} color="#1A1412" weight="bold" /> : null}
  </span>
);

const OptionRow: React.FC<{
  label: React.ReactNode;
  checked: boolean;
  onClick: () => void;
  gold: string;
  borderColor: string;
  textPrimary: string;
  icon?: React.ReactNode;
}> = ({ label, checked, onClick, gold, borderColor, textPrimary, icon }) => (
  <button
    type="button"
    onClick={onClick}
    style={{
      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
      padding: '6px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
    }}
  >
    <CheckMark checked={checked} gold={gold} borderColor={borderColor} />
    {icon}
    <span style={{
      fontFamily: '"RF Dewi Expanded"', fontSize: 13, fontWeight: checked ? 700 : 500,
      color: checked ? gold : textPrimary, minWidth: 0,
    }}>
      {label}
    </span>
  </button>
);

const ExpandableOptions: React.FC<{
  items: { id: string; name: string }[];
  selected: string[];
  onToggle: (id: string) => void;
  gold: string;
  borderColor: string;
  textPrimary: string;
}> = ({ items, selected, onToggle, gold, borderColor, textPrimary }) => {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : items.slice(0, LIST_PREVIEW);

  return (
    <div>
      {visible.map((item) => (
        <OptionRow
          key={item.id}
          label={item.name}
          checked={selected.includes(item.id)}
          onClick={() => onToggle(item.id)}
          gold={gold}
          borderColor={borderColor}
          textPrimary={textPrimary}
        />
      ))}
      {items.length > LIST_PREVIEW && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          style={{
            marginTop: 6, background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            fontFamily: '"RF Dewi Expanded"', fontSize: 12, fontWeight: 600, color: COLORS.primary,
          }}
        >
          {expanded ? 'Свернуть' : `Все ${items.length} вариантов`}
        </button>
      )}
    </div>
  );
};

const AppliedChip: React.FC<{ label: React.ReactNode; gold: string; onRemove: () => void }> = ({ label, gold, onRemove }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '5px 8px 5px 12px', borderRadius: 99, whiteSpace: 'nowrap',
    background: `${gold}15`, color: gold, border: `1px solid ${gold}40`,
    fontFamily: '"RF Dewi Expanded"', fontWeight: 600, fontSize: 12,
  }}>
    {label}
    <button type="button" onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 2 }}>
      <X size={13} color={gold} />
    </button>
  </span>
);

const ShopFilterPanel: React.FC<ShopFilterPanelProps> = ({
  mode,
  activeQuick, onQuickChange,
  shopTags, selectedTagIds, onTagToggle,
  filters, selectedEquipments, selectedBeans, selectedRoasters, selectedBrewMethods,
  equipments, coffeeBeans, roasters, brewMethods,
  cities, selectedCity, onCityChange, showCityDropdown, onCityDropdownToggle,
  colors, dark,
  onApplyFilters,
  resultCount,
  onClose,
}) => {
  const gold = COLORS.primary;
  const goldWarm = '#D4A84B';
  const currentCityName = cities.find(c => c.id === selectedCity)?.name || 'Город';
  const borderColor = dark ? '#3D2F28' : colors.border;
  const muted = dark ? '#A39E93' : '#78716C';
  const textPrimary = dark ? '#fff' : '#1C1917';

  const applied: AppliedFilters = {
    priceRange: filters.priceRange,
    coffeeFocus: filters.coffeeFocus,
    equipments: selectedEquipments,
    beans: selectedBeans,
    roasters: selectedRoasters,
    brewMethods: selectedBrewMethods,
  };

  const patch = (next: Partial<AppliedFilters>) => onApplyFilters({ ...applied, ...next });

  const hasApplied = selectedEquipments.length > 0 || selectedBeans.length > 0 ||
    selectedRoasters.length > 0 || selectedBrewMethods.length > 0 || !!filters.priceRange || !!filters.coffeeFocus;

  const chipBase: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '6px 12px', borderRadius: 99, whiteSpace: 'nowrap',
    fontFamily: '"RF Dewi Expanded"', fontWeight: 600, fontSize: 12,
    cursor: 'pointer', transition: 'all .15s', border: '1px solid',
  };

  const quickChipStyle = (active: boolean): React.CSSProperties => ({
    ...chipBase,
    background: active ? (dark ? '#fff' : '#1C1917') : (dark ? 'rgba(255,255,255,0.04)' : '#fff'),
    color: active ? (dark ? '#1C1917' : '#fff') : (dark ? '#fff' : '#1C1917'),
    borderColor: active ? 'transparent' : borderColor,
  });

  const current = {
    priceRange: filters.priceRange,
    coffeeFocus: filters.coffeeFocus,
    equipments: selectedEquipments,
    beans: selectedBeans,
    roasters: selectedRoasters,
    brewMethods: selectedBrewMethods,
  };

  const cityAndStatusChips = (
    <>
      <div style={{ position: 'relative' }}>
        <button type="button" onClick={onCityDropdownToggle} style={{
          ...chipBase,
          background: dark ? 'rgba(255,255,255,0.04)' : '#fff',
          color: textPrimary,
          borderColor,
        }}>
          <MapPin size={14} color={goldWarm} />
          {currentCityName}
          <CaretDown size={13} color={muted} style={{ transition: 'transform .2s', transform: showCityDropdown ? 'rotate(180deg)' : 'none' }} />
        </button>
        {showCityDropdown && (
          <>
            <div className="fixed inset-0 z-10" onClick={onCityDropdownToggle} />
            <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, borderRadius: 12, border: `1px solid ${borderColor}`, boxShadow: '0 8px 24px rgba(0,0,0,0.2)', zIndex: 20, minWidth: 160, maxHeight: 280, overflowY: 'auto' as const, background: dark ? '#2D241F' : '#fff' }}>
              {cities.map(city => (
                <button key={city.id} type="button" onClick={() => { onCityChange(city.id); onCityDropdownToggle(); }}
                  style={{ width: '100%', padding: '8px 12px', textAlign: 'left', background: selectedCity === city.id ? `${gold}15` : 'transparent', color: selectedCity === city.id ? gold : textPrimary, border: 'none', cursor: 'pointer', fontFamily: '"RF Dewi Expanded"', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
                  {selectedCity === city.id && <CheckCircle size={14} color={gold} />}
                  <span style={{ marginLeft: selectedCity === city.id ? 0 : 22 }}>{city.name}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div style={{ width: 1, height: 20, background: borderColor, flexShrink: 0 }} />

      {FIXED_QUICK_FILTERS.map(({ id, label, Icon }) => {
        const active = activeQuick.includes(id);
        return (
          <button
            key={id}
            type="button"
            onClick={() => onQuickChange(id)}
            style={quickChipStyle(active)}
          >
            <Icon size={14} color={active ? (dark ? goldWarm : '#fff') : goldWarm} />
            {label}
          </button>
        );
      })}
    </>
  );

  if (mode === 'quick') {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, alignItems: 'center', justifyContent: 'center', paddingBottom: 16 }}>
        {cityAndStatusChips}
      </div>
    );
  }

  if (mode === 'chips') {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, alignItems: 'center', paddingBottom: 10 }}>
        {cityAndStatusChips}

        {shopTags.map(tag => {
          const active = selectedTagIds.includes(tag.id);
          return (
            <button key={tag.id} type="button" onClick={() => onTagToggle(tag.id)} style={quickChipStyle(active)}>
              {tag.name}
            </button>
          );
        })}

        {current.priceRange && (
          <AppliedChip
            label={
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <BeanPriceMarks
                  count={PRICE_OPTIONS.find(p => p.value === current.priceRange)?.tiers ?? 1}
                  size={11}
                  color={gold}
                />
                {PRICE_OPTIONS.find(p => p.value === current.priceRange)?.label ?? current.priceRange}
              </span>
            }
            gold={gold}
            onRemove={() => patch({ priceRange: undefined })}
          />
        )}
        {current.coffeeFocus && (
          <AppliedChip
            label={FOCUS_OPTIONS.find(p => p.value === current.coffeeFocus)?.label ?? current.coffeeFocus}
            gold={gold}
            onRemove={() => patch({ coffeeFocus: undefined })}
          />
        )}
        {current.equipments.map(id => {
          const eq = equipments.find(e => e.id === id);
          return eq ? <AppliedChip key={id} label={eq.name} gold={gold} onRemove={() => patch({ equipments: current.equipments.filter(x => x !== id) })} /> : null;
        })}
        {current.beans.map(id => {
          const b = coffeeBeans.find(item => item.id === id);
          return b ? <AppliedChip key={id} label={b.name} gold={gold} onRemove={() => patch({ beans: current.beans.filter(x => x !== id) })} /> : null;
        })}
        {current.roasters.map(id => {
          const r = roasters.find(item => item.id === id);
          return r ? <AppliedChip key={id} label={r.name} gold={gold} onRemove={() => patch({ roasters: current.roasters.filter(x => x !== id) })} /> : null;
        })}
        {current.brewMethods.map(id => {
          const m = brewMethods.find(item => item.id === id);
          return m ? <AppliedChip key={id} label={m.name} gold={gold} onRemove={() => patch({ brewMethods: current.brewMethods.filter(x => x !== id) })} /> : null;
        })}
        {hasApplied && (
          <button
            type="button"
            onClick={() => onApplyFilters({ priceRange: undefined, coffeeFocus: undefined, equipments: [], beans: [], roasters: [], brewMethods: [] })}
            style={{ ...chipBase, background: 'transparent', color: muted, borderColor: 'transparent', fontSize: 11 }}
          >
            Сбросить всё
          </button>
        )}
      </div>
    );
  }

  const accordionProps = { muted, textPrimary, borderColor };

  return (
    <div>
      {onClose && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, paddingBottom: 10, borderBottom: `1px solid ${borderColor}` }}>
          <span style={{ fontFamily: '"RF Dewi Expanded"', fontWeight: 700, fontSize: 16, color: textPrimary }}>Фильтры</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть фильтры"
            style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${borderColor}`, background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={16} color={textPrimary} />
          </button>
        </div>
      )}

      {shopTags.length > 0 && (
        <FilterAccordion title="Особенности" count={selectedTagIds.length} defaultOpen={selectedTagIds.length > 0} {...accordionProps}>
          {shopTags.map((tag) => (
            <OptionRow
              key={tag.id}
              label={tag.name}
              checked={selectedTagIds.includes(tag.id)}
              onClick={() => onTagToggle(tag.id)}
              gold={gold}
              borderColor={borderColor}
              textPrimary={textPrimary}
            />
          ))}
        </FilterAccordion>
      )}

      <FilterAccordion title="Тип" count={filters.coffeeFocus ? 1 : 0} defaultOpen={!!filters.coffeeFocus} {...accordionProps}>
        {FOCUS_OPTIONS.map(({ value, label }) => (
          <OptionRow
            key={value}
            label={label}
            checked={filters.coffeeFocus === value}
            onClick={() => patch({ coffeeFocus: filters.coffeeFocus === value ? undefined : value })}
            gold={gold}
            borderColor={borderColor}
            textPrimary={textPrimary}
          />
        ))}
      </FilterAccordion>

      <FilterAccordion title="Цена" count={filters.priceRange ? 1 : 0} defaultOpen={!!filters.priceRange} {...accordionProps}>
        {PRICE_OPTIONS.map(({ value, label, tiers }) => (
          <OptionRow
            key={value}
            label={
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <BeanPriceMarks count={tiers} size={12} color={filters.priceRange === value ? gold : COLORS.primary} />
                {label}
              </span>
            }
            checked={filters.priceRange === value}
            onClick={() => patch({ priceRange: filters.priceRange === value ? undefined : value })}
            gold={gold}
            borderColor={borderColor}
            textPrimary={textPrimary}
          />
        ))}
      </FilterAccordion>

      {equipments.length > 0 && (
        <FilterAccordion title="Оборудование" count={selectedEquipments.length} defaultOpen={selectedEquipments.length > 0} {...accordionProps}>
          <ExpandableOptions
            items={equipments}
            selected={selectedEquipments}
            onToggle={(id) => patch({ equipments: toggle(selectedEquipments, id) })}
            gold={gold}
            borderColor={borderColor}
            textPrimary={textPrimary}
          />
        </FilterAccordion>
      )}

      {coffeeBeans.length > 0 && (
        <FilterAccordion title="Зёрна" count={selectedBeans.length} defaultOpen={selectedBeans.length > 0} {...accordionProps}>
          <ExpandableOptions
            items={coffeeBeans}
            selected={selectedBeans}
            onToggle={(id) => patch({ beans: toggle(selectedBeans, id) })}
            gold={gold}
            borderColor={borderColor}
            textPrimary={textPrimary}
          />
        </FilterAccordion>
      )}

      {roasters.length > 0 && (
        <FilterAccordion title="Обжарщики" count={selectedRoasters.length} defaultOpen={selectedRoasters.length > 0} {...accordionProps}>
          <ExpandableOptions
            items={roasters}
            selected={selectedRoasters}
            onToggle={(id) => patch({ roasters: toggle(selectedRoasters, id) })}
            gold={gold}
            borderColor={borderColor}
            textPrimary={textPrimary}
          />
        </FilterAccordion>
      )}

      {brewMethods.length > 0 && (
        <FilterAccordion title="Заваривание" count={selectedBrewMethods.length} defaultOpen={selectedBrewMethods.length > 0} {...accordionProps}>
          <ExpandableOptions
            items={brewMethods}
            selected={selectedBrewMethods}
            onToggle={(id) => patch({ brewMethods: toggle(selectedBrewMethods, id) })}
            gold={gold}
            borderColor={borderColor}
            textPrimary={textPrimary}
          />
        </FilterAccordion>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '16px 0 4px' }}>
        {hasApplied && (
          <button
            type="button"
            onClick={() => onApplyFilters({ priceRange: undefined, coffeeFocus: undefined, equipments: [], beans: [], roasters: [], brewMethods: [] })}
            style={{
              width: '100%', height: 40, borderRadius: 10, border: `1px solid ${borderColor}`,
              background: 'transparent', color: muted, cursor: 'pointer',
              fontFamily: '"RF Dewi Expanded"', fontWeight: 600, fontSize: 13,
            }}
          >
            Сбросить фильтры
          </button>
        )}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={{
              width: '100%', height: 44, borderRadius: 10, border: 'none',
              background: gold, color: '#1A1412', cursor: 'pointer',
              fontFamily: '"RF Dewi Expanded"', fontWeight: 700, fontSize: 14,
            }}
          >
            {typeof resultCount === 'number' ? `Найдено ${resultCount}` : 'Готово'}
          </button>
        )}
      </div>
    </div>
  );
};

export default ShopFilterPanel;
