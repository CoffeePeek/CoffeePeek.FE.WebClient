import WobbleRing from '../WobbleRing';
import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import type { Map as LeafletMap } from 'leaflet';
import { DetailedCoffeeShop } from '../../api/coffeeshop';
import { formatDayOfWeek } from '../../utils/shopUtils';
import { useTheme } from '../../contexts/ThemeContext';
import { getThemeClasses } from '../../utils/theme';
import { AppIcon } from '../icons';
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
  const now = new Date();
  const currentDay = now.getDay() === 0 ? 6 : now.getDay() - 1;
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);

  const latitude = shop.location?.latitude;
  const longitude = shop.location?.longitude;

  useEffect(() => {
    if (!latitude || !longitude || !mapRef.current) return;

    const map = createOsmMap(mapRef.current, {
      center: [latitude, longitude],
      zoom: 15,
      dark: true,
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
  }, [latitude, longitude, shop.name]);

  return (
    <div className={`${cardBg} rounded-3xl border ${borderColor} overflow-hidden shadow-sm min-w-0`}>
      {latitude && longitude && (
        <div className="h-52 sm:h-64 w-full max-w-full relative overflow-hidden">
          <div className="absolute inset-0 w-full h-full">
            <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
          </div>
          {!isMapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#2D241F]">
              <WobbleRing size={32} />
            </div>
          )}
        </div>
      )}

      <div className="p-5">
        <div className={`flex items-start gap-3 min-w-0 ${shop.schedules && shop.schedules.length > 0 ? 'mb-6' : ''}`}>
          <div className={`w-12 h-12 rounded-2xl ${themeClasses.primary.bgLight} flex items-center justify-center shrink-0`}>
            <AppIcon name="pin_drop" size={20} className={themeClasses.primary.text} />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className={`font-bold ${textMain} mb-1 break-words`}>
              {shop.location?.address || shop.address || 'Адрес не указан'}
            </h3>
          </div>
        </div>

        {shop.schedules && shop.schedules.length > 0 && (
          <div className={`space-y-4 pt-6 border-t ${borderColor}`}>
            <div className={`flex items-center gap-4 ${textMain} font-bold`}>
              <div className={`w-12 h-12 rounded-2xl ${themeClasses.primary.bgLight} flex items-center justify-center shrink-0`}>
                <AppIcon name="schedule" size={20} className={themeClasses.primary.text} />
              </div>
              <span>Часы работы</span>
            </div>
            <div className="space-y-3 ml-16 text-sm">
              {shop.schedules.map((schedule) => {
                const isToday = schedule.dayOfWeek === currentDay;
                return (
                  <div
                    key={schedule.dayOfWeek}
                    className={`flex justify-between gap-3 min-w-0 ${isToday ? `font-bold ${themeClasses.primary.text}` : textMuted}`}
                  >
                    <span className="min-w-0 truncate">
                      {isToday ? 'Сегодня' : formatDayOfWeek(schedule.dayOfWeek)}
                    </span>
                    <span className="shrink-0">
                      {schedule.openTime} - {schedule.closeTime}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
