import React, { useEffect, useRef, useState } from 'react';
import { DetailedCoffeeShop } from '../../api/coffeeshop';
import { formatDayOfWeek } from '../../utils/shopUtils';
import { useTheme } from '../../contexts/ThemeContext';
import { getThemeClasses } from '../../utils/theme';
import { COLORS } from '../../constants/colors';

interface ShopSidebarProps {
  shop: DetailedCoffeeShop;
  textMain: string;
  textMuted: string;
  cardBg: string;
  borderColor: string;
}

declare global {
  interface Window {
    ymaps: any;
  }
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
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const isInitializedRef = useRef(false);

  const latitude = shop.location?.latitude;
  const longitude = shop.location?.longitude;

  useEffect(() => {
    if (!latitude || !longitude || !mapRef.current || isInitializedRef.current) return;

    const initializeMap = () => {
      if (isInitializedRef.current) return;
      initMap();
    };

    // Проверяем, загружен ли Yandex Maps
    if (window.ymaps) {
      initializeMap();
    } else {
      // Проверяем, не загружается ли уже скрипт
      const existingScript = document.querySelector(`script[src*="api-maps.yandex.ru"]`);
      if (existingScript) {
        // Если скрипт уже есть, ждем его загрузки
        if (window.ymaps) {
          window.ymaps.ready(initializeMap);
        } else {
          existingScript.addEventListener('load', () => {
            window.ymaps.ready(initializeMap);
          });
        }
        return;
      }

      // Загружаем Yandex Maps API
      const version = '2.1';
      const lang = 'ru_RU';
      const apiKey = (import.meta.env as any).VITE_YANDEX_MAP_API_KEY || '';
      
      const script = document.createElement('script');
      script.src = `https://enterprise.api-maps.yandex.ru/${version}/?${apiKey ? `apikey=${apiKey}&` : ''}lang=${lang}`;
      script.async = true;
      
      script.onload = () => {
        window.ymaps.ready(initializeMap);
      };

      document.head.appendChild(script);
    }

    return () => {
      if (mapInstance) {
        mapInstance.destroy();
        setMapInstance(null);
        isInitializedRef.current = false;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude]);

  const initMap = () => {
    if (!mapRef.current || !window.ymaps || !latitude || !longitude || isInitializedRef.current) return;

    window.ymaps.ready(() => {
      if (isInitializedRef.current) return;
      
      const map = new window.ymaps.Map(mapRef.current, {
        center: [latitude, longitude],
        zoom: 15,
        controls: [],
      });

      // Устанавливаем темную тему
      map.options.set('theme', 'dark');

      // Используем тот же значок, что и в MapPage
      const iconColor = COLORS.dark.background;
      const circleColor = COLORS.primary;
      const mapBorderColor = COLORS.primary;
      const themeClasses = getThemeClasses(theme);
      const borderColor = COLORS.primary;
      const borderWidth = 2;

      const marker = new window.ymaps.Placemark(
        [latitude, longitude],
        {
          hintContent: shop.name,
        },
        {
          iconLayout: 'default#imageWithContent',
          iconImageHref: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
            <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
              <circle cx="24" cy="24" r="22" fill="${circleColor}" stroke="${mapBorderColor}" stroke-width="${borderWidth}"/>
              <g transform="translate(12, 12) scale(0.045)">
                <path fill="${iconColor}" d="M378.596,374.959c1.729-2.724,3.363-5.429,4.953-8.222c13.649,12.403,31.767,20.005,51.619,20.005c42.366,0,76.832-34.45,76.832-76.815c0-42.366-34.508-76.824-76.874-76.824c-8.883,0-17.481,1.541-25.394,4.326v-39.62c0-9.364-7.508-17.354-16.872-17.354H48.544c-9.364,0-17.49,7.988-17.49,17.354v69.826c0,38.118,11.063,75.14,31.488,107.324c9.008,14.194,19.96,27.051,32.045,38.355H16.956C7.592,413.314,0,420.905,0,430.27s7.592,16.956,16.956,16.956h30.942c4.867,32.781,32.579,56.519,65.933,56.519h213.642c33.353,0,61.065-23.738,65.933-56.519h31.043c9.364,0,16.956-7.592,16.956-16.956s-7.592-16.956-16.956-16.956h-77.631C358.902,402.01,369.588,389.153,378.596,374.959z M409.653,275.455c7.137-5.295,15.966-8.432,25.515-8.432c23.667-0.001,42.921,19.254,42.921,42.921c0,23.667-19.254,42.921-42.921,42.921c-15.248,0-28.655-7.999-36.271-20.015C405.239,314.417,408.89,295.105,409.653,275.455z M358.666,447.225c-4.258,13.565-16.629,22.608-31.194,22.608H113.831c-14.565,0-26.935-9.043-31.194-22.608H358.666z M289.631,413.314H151.773c-52.73-28.26-86.808-84.98-86.808-145.679v-53.268H375.82v53.268C375.82,328.334,342.361,385.054,289.631,413.314z"/>
                <path fill="${iconColor}" d="M169.907,122.299l-8.316-6.683c-3.207-2.577-5.014-6.414-4.958-10.527c0.055-4.113,1.966-7.9,5.242-10.389c11.481-8.727,18.268-21.999,18.62-36.417s-5.78-28.005-16.822-37.281c-7.17-6.023-17.866-5.092-23.889,2.078c-6.023,7.17-5.092,17.866,2.078,23.89c4.254,3.572,4.791,8.104,4.733,10.488c-0.059,2.383-0.817,6.883-5.239,10.245c-11.642,8.848-18.433,22.308-18.63,36.93c-0.198,14.621,6.226,28.261,17.625,37.42l8.316,6.683c3.132,2.516,6.883,3.739,10.611,3.739c4.961,0,9.878-2.167,13.228-6.335C178.369,138.838,177.207,128.166,169.907,122.299z"/>
                <path fill="${iconColor}" d="M240.322,131.073l-9.754-7.838c-4.468-3.591-6.987-8.938-6.909-14.67c0.077-5.732,2.74-11.009,7.303-14.478c12.753-9.692,20.292-24.435,20.681-40.448c0.39-16.013-6.419-31.107-18.684-41.409c-7.17-6.024-17.867-5.094-23.888,2.077c-6.024,7.17-5.094,17.866,2.076,23.888c4.329,3.636,6.734,8.964,6.595,14.616c-0.138,5.652-2.799,10.856-7.3,14.277c-12.93,9.826-20.474,24.777-20.693,41.018c-0.22,16.24,6.915,31.39,19.575,41.563l9.754,7.838c3.132,2.517,6.883,3.739,10.611,3.739c4.961,0,9.878-2.167,13.228-6.335C248.782,147.611,247.62,136.939,240.322,131.073z"/>
                <path fill="${iconColor}" d="M308.086,122.299l-8.316-6.683c-3.207-2.577-5.014-6.414-4.958-10.527c0.055-4.113,1.966-7.9,5.242-10.389c11.481-8.727,18.268-21.999,18.62-36.417c0.352-14.418-5.78-28.005-16.822-37.281c-7.171-6.023-17.867-5.092-23.889,2.078c-6.023,7.17-5.092,17.866,2.078,23.89c4.254,3.572,4.791,8.104,4.733,10.488c-0.06,2.383-0.817,6.883-5.239,10.245c-11.642,8.848-18.433,22.308-18.63,36.93c-0.198,14.621,6.226,28.261,17.625,37.42l8.316,6.683c3.132,2.516,6.883,3.739,10.611,3.739c4.961,0,9.878-2.167,13.228-6.335C316.548,138.838,315.386,128.166,308.086,122.299z"/>
              </g>
            </svg>
          `),
          iconImageSize: [48, 48],
          iconImageOffset: [-24, -24],
        }
      );

      map.geoObjects.add(marker);
      setMapInstance(map);
      setIsMapLoaded(true);
      isInitializedRef.current = true;
    });
  };

  return (
    <div className={`${cardBg} rounded-3xl border ${borderColor} overflow-hidden shadow-sm`}>
      {/* Карта */}
      {latitude && longitude && (
        <div className="h-64 w-full relative">
          <div ref={mapRef} className="w-full h-full" />
          {!isMapLoaded && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#2D241F]">
              <div className={`w-8 h-8 border-4 ${themeClasses.primary.border} border-t-transparent rounded-full animate-spin`} />
            </div>
          )}
        </div>
      )}

      <div className="p-8">
        <div className="flex items-start gap-4 mb-8">
          <div className={`w-12 h-12 rounded-2xl ${themeClasses.primary.bgLight} flex items-center justify-center shrink-0`}>
            <span className={`material-symbols-outlined ${themeClasses.primary.text}`}>pin_drop</span>
          </div>
          <div>
            <h3 className={`font-bold ${textMain} mb-1`}>{shop.location?.address || shop.address || 'Адрес не указан'}</h3>
            {latitude && longitude && (
              <p className={`${textMuted} text-sm`}>
                {latitude.toFixed(6)}, {longitude.toFixed(6)}
              </p>
            )}
          </div>
        </div>

        {shop.schedules && shop.schedules.length > 0 && (
          <div className={`space-y-4 pt-6 border-t ${borderColor}`}>
            <div className={`flex items-center gap-4 ${textMain} font-bold`}>
              <div className={`w-12 h-12 rounded-2xl ${themeClasses.primary.bgLight} flex items-center justify-center shrink-0`}>
                <span className={`material-symbols-outlined ${themeClasses.primary.text}`}>schedule</span>
              </div>
              <span>Часы работы</span>
            </div>
            <div className="space-y-3 ml-16 text-sm">
              {shop.schedules.map((schedule) => {
                const isToday = schedule.dayOfWeek === currentDay;
                
                return (
                  <div 
                    key={schedule.dayOfWeek} 
                    className={`flex justify-between ${isToday ? `font-bold ${themeClasses.primary.text}` : textMuted}`}
                  >
                    <span>{isToday ? 'Сегодня' : formatDayOfWeek(schedule.dayOfWeek)}</span>
                    <span>{schedule.openTime} - {schedule.closeTime}</span>
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

