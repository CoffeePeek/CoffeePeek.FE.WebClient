import WobbleRing from '../WobbleRing';
import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import type { Map as LeafletMap } from 'leaflet';
import { DetailedCoffeeShop } from '../../api/coffeeshop';
import { formatDayOfWeekShort, getCurrentDayOfWeek } from '../../utils/shopUtils';
import { useTheme } from '../../contexts/ThemeContext';
import { getThemeClasses } from '../../utils/theme';
import { AppIcon } from '../icons';
import { CaretDown } from '@/components/Icon';
import { coffeeDetailIcon, createOsmMap } from '../../map/osmMap';

interface ShopSidebarProps {
  shop: DetailedCoffeeShop;
  textMain: string;
  textMuted: string;
  cardBg: string;
  borderColor: string;
}

export const ShopSidebar: React.FC<ShopSidebarProps> = ({
  shop,
  textMain,
  textMuted,
  cardBg,
  borderColor,
}) => {
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  const currentDay = getCurrentDayOfWeek();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [hoursOpen, setHoursOpen] = useState(false);

  const latitude = shop.location?.latitude;
  const longitude = shop.location?.longitude;
  const isDark = theme === 'dark';

  useEffect(() => {
    if (!latitude || !longitude || !mapRef.current) return;

    const map = createOsmMap(mapRef.current, {
      center: [latitude, longitude],
      zoom: 15,
      dark: isDark,
      interactive: false,
      zoomControl: false,
    });
    mapInstanceRef.current = map;

    L.marker([latitude, longitude], {
      icon: coffeeDetailIcon(),
      title: shop.name,
      interactive: false,
    }).addTo(map);

    setIsMapLoaded(true);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      setIsMapLoaded(false);
    };
  }, [latitude, longitude, shop.name, isDark]);

  return (
    <div className={`${cardBg} rounded-3xl border ${borderColor} overflow-hidden shadow-sm min-w-0`}>
      {latitude && longitude && (
        <div className="h-52 sm:h-64 w-full max-w-full relative overflow-hidden">
          <div className="absolute inset-0 w-full h-full">
            <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
          </div>
          {!isMapLoaded && (
            <div className={`absolute inset-0 flex items-center justify-center ${isDark ? 'bg-[#2D241F]' : 'bg-[#F5F5F4]'}`}>
              <WobbleRing size={32} />
            </div>
          )}
        </div>
      )}

      <div className="p-5">
        <div className={`flex items-center gap-3 min-w-0 ${shop.schedules && shop.schedules.length > 0 ? 'mb-6' : ''}`}>
          <div className={`w-12 h-12 rounded-2xl ${themeClasses.primary.bgLight} flex items-center justify-center shrink-0`}>
            <AppIcon name="pin_drop" size={20} className={themeClasses.primary.text} />
          </div>
          <h3 className={`font-bold ${textMain} break-words min-w-0 flex-1`}>
            {shop.location?.address || shop.address || 'Адрес не указан'}
          </h3>
        </div>

        {shop.schedules && shop.schedules.length > 0 && (
          <div className={`flex items-start gap-3 pt-6 border-t ${borderColor}`}>
            <div className={`w-12 h-12 rounded-2xl ${themeClasses.primary.bgLight} flex items-center justify-center shrink-0`}>
              <AppIcon name="schedule" size={20} className={themeClasses.primary.text} />
            </div>
            <div className="min-w-0 flex-1">
              <button
                type="button"
                className={`flex w-full items-center justify-between gap-2 min-h-12 ${textMain} font-bold lg:pointer-events-none`}
                onClick={() => setHoursOpen((open) => !open)}
                aria-expanded={hoursOpen}
              >
                <span>Часы работы</span>
                <CaretDown
                  size={16}
                  className={`lg:hidden shrink-0 transition-transform ${hoursOpen ? 'rotate-180' : ''}`}
                />
              </button>
              <div className={`${hoursOpen ? 'block' : 'hidden'} lg:block space-y-2.5 text-sm mt-2.5`}>
                {[...shop.schedules]
                  .sort((a, b) => Number(a.dayOfWeek) - Number(b.dayOfWeek))
                  .map((schedule) => {
                  const dayLabel = formatDayOfWeekShort(schedule.dayOfWeek);
                  const isToday = Number(schedule.dayOfWeek) === currentDay;
                  return (
                    <div
                      key={String(schedule.dayOfWeek)}
                      className={`flex items-center gap-3 ${isToday ? `font-bold ${themeClasses.primary.text}` : textMuted}`}
                    >
                      <span className="w-7 shrink-0 tabular-nums">
                        {dayLabel || '—'}
                      </span>
                      <span>
                        {schedule.openTime && schedule.closeTime
                          ? `${schedule.openTime} - ${schedule.closeTime}`
                          : 'Закрыто'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
