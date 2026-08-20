import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCoffeeShopsByMapBounds, MapShop } from '../api/coffeeshop';
import { brand, dark } from '../design-system/tokens';
import { getThemeColors } from '../constants/colors';
import { useTheme } from '../contexts/ThemeContext';
import { AppIcon } from './icons';
import WobbleRing from './WobbleRing';

declare global {
  interface Window {
    ymaps: any;
  }
}

const MINSK_CENTER: [number, number] = [53.9, 27.5667];

const PIN_W = 22;
const PIN_H = 28;

const MARKER_HREF =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(`
    <svg xmlns="http://www.w3.org/2000/svg" width="${PIN_W}" height="${PIN_H}" viewBox="0 0 22 28">
      <path fill="${dark.background}" opacity="0.4" d="M11 2.4c-4.5 0-8.1 3.6-8.1 8.1 0 6 8.1 16 8.1 16s8.1-10 8.1-16c0-4.5-3.6-8.1-8.1-8.1z" transform="translate(0 1)"/>
      <path fill="${brand.primary}" stroke="${dark.background}" stroke-width="1.15" stroke-linejoin="round" d="M11 1.35c-4.85 0-8.8 3.95-8.8 8.8 0 6.55 8.8 17.1 8.8 17.1s8.8-10.55 8.8-17.1c0-4.85-3.95-8.8-8.8-8.8z"/>
      <path fill="${dark.background}" d="M7.15 7.05h6.1c.36 0 .65.29.65.65v3.1a3.05 3.05 0 0 1-6.1 0v-3.1c0-.36.29-.65.65-.65z"/>
      <path fill="none" stroke="${dark.background}" stroke-width="1.15" stroke-linecap="round" d="M13.85 8.15h.8a1.4 1.4 0 1 1 0 2.8h-.8"/>
    </svg>
  `);

function loadYandexMaps(): Promise<void> {
  if (window.ymaps) return Promise.resolve();

  const existing = document.querySelector('script[src*="api-maps.yandex.ru"]');
  if (existing) {
    return new Promise((resolve, reject) => {
      if (window.ymaps) {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Не удалось загрузить Яндекс.Карты')), { once: true });
    });
  }

  return new Promise((resolve, reject) => {
    const apiKey = (import.meta.env as any).VITE_YANDEX_MAP_API_KEY || '';
    const script = document.createElement('script');
    script.src = `https://enterprise.api-maps.yandex.ru/2.1/?${apiKey ? `apikey=${apiKey}&` : ''}lang=ru_RU`;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Не удалось загрузить Яндекс.Карты'));
    document.head.appendChild(script);
  });
}

function parseShops(response: Awaited<ReturnType<typeof getCoffeeShopsByMapBounds>>): MapShop[] {
  const shops = response.data?.shops;
  if (!Array.isArray(shops)) return [];
  return shops.map((shop: any) => ({
    id: shop.id,
    latitude: Number(shop.latitude),
    longitude: Number(shop.longitude),
    title: shop.title || shop.name || 'Кофейня',
  }));
}

const LandingMapWidget: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const c = getThemeColors(theme);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const initStartedRef = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const container = mapRef.current;
    if (!container) return;

    let cancelled = false;
    let updateTimeout: ReturnType<typeof setTimeout>;

    const addMarkers = (map: any, ymaps: any, shopsList: MapShop[]) => {
      markersRef.current.forEach((marker) => map.geoObjects.remove(marker));
      markersRef.current = [];

      shopsList.forEach((shop) => {
        if (!shop.latitude || !shop.longitude) return;

        const marker = new ymaps.Placemark(
          [shop.latitude, shop.longitude],
          { hintContent: shop.title },
          {
            iconLayout: 'default#image',
            iconImageHref: MARKER_HREF,
            iconImageSize: [PIN_W, PIN_H],
            iconImageOffset: [-PIN_W / 2, -PIN_H],
          },
        );

        map.geoObjects.add(marker);
        markersRef.current.push(marker);
      });
    };

    const loadShops = async (map: any, ymaps: any) => {
      try {
        const bounds = map.getBounds();
        if (!bounds || bounds.length < 2) return;

        const minLat = Math.min(bounds[0][0], bounds[1][0]);
        const minLon = Math.min(bounds[0][1], bounds[1][1]);
        const maxLat = Math.max(bounds[0][0], bounds[1][0]);
        const maxLon = Math.max(bounds[0][1], bounds[1][1]);

        const response = await getCoffeeShopsByMapBounds(minLat, minLon, maxLat, maxLon);
        if (cancelled) return;
        addMarkers(map, ymaps, parseShops(response));
      } catch {
        if (!cancelled) setError('Не удалось загрузить кофейни');
      }
    };

    const initMap = async () => {
      if (initStartedRef.current || cancelled || container.clientWidth < 100) return;
      initStartedRef.current = true;

      try {
        await loadYandexMaps();
        if (cancelled || !window.ymaps) return;

        window.ymaps.ready(() => {
          if (cancelled || !mapRef.current) return;

          const map = new window.ymaps.Map(
            mapRef.current,
            {
              center: MINSK_CENTER,
              zoom: 13,
              controls: [],
              behaviors: ['drag', 'multiTouch', 'scrollZoom'],
            },
            {
              suppressMapOpenBlock: true,
              yandexMapDisablePoiInteractivity: true,
            },
          );

          map.container.fitToViewport();

          map.options.set('theme', theme === 'dark' ? 'dark' : 'light');

          mapInstanceRef.current = map;
          setIsLoading(false);

          const scheduleUpdate = () => {
            clearTimeout(updateTimeout);
            updateTimeout = setTimeout(() => loadShops(map, window.ymaps), 300);
          };

          scheduleUpdate();
          map.events.add('boundschange', scheduleUpdate);
        });
      } catch {
        if (!cancelled) {
          setError('Не удалось загрузить карту');
          setIsLoading(false);
        }
      }
    };

    const observer = new ResizeObserver(() => {
      if (container.clientWidth >= 100) {
        void initMap();
        mapInstanceRef.current?.container.fitToViewport();
      }
    });
    observer.observe(container);
    void initMap();

    return () => {
      cancelled = true;
      clearTimeout(updateTimeout);
      observer.disconnect();
      if (mapInstanceRef.current) {
        mapInstanceRef.current.destroy();
        mapInstanceRef.current = null;
      }
      markersRef.current = [];
      initStartedRef.current = false;
    };
  }, []);

  useEffect(() => {
    mapInstanceRef.current?.options.set('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  return (
    <div
      className="relative rounded-[28px] overflow-hidden border"
      style={{
        background: c.surface,
        borderColor: c.border,
        boxShadow: isDark
          ? 'inset 0 1px 0 rgba(255,255,255,0.04), 0 30px 60px -20px rgba(0,0,0,0.6)'
          : 'inset 0 1px 0 rgba(255,255,255,0.9), 0 30px 60px -20px rgba(0,0,0,0.12)',
      }}
    >
      <div className="relative h-[360px]" style={{ background: c.background }}>
        <div ref={mapRef} className={`${isDark ? 'ymap-dark' : ''} absolute inset-0`} />

        {isLoading && (
          <div className="absolute inset-0 z-[3] flex items-center justify-center" style={{ background: c.surface }}>
            <WobbleRing size={40} />
          </div>
        )}

        {error && !isLoading && (
          <div className="absolute inset-0 z-[3] flex items-center justify-center px-6 text-center" style={{ background: c.surface }}>
            <p className="font-body text-sm" style={{ color: c.textSecondary }}>{error}</p>
          </div>
        )}

        <div
          className="absolute top-[18px] left-[18px] z-[4] px-4 py-2 rounded-full font-display font-semibold text-[13px] border pointer-events-none"
          style={{ background: isDark ? 'rgba(26,20,18,0.75)' : 'rgba(255,255,255,0.85)', borderColor: c.border, color: c.textPrimary, backdropFilter: 'blur(12px)' }}
        >
          Карта
        </div>
        <div
          className="absolute top-[18px] right-[18px] z-[4] w-11 h-11 rounded-full flex items-center justify-center pointer-events-none"
          style={{
            background: isDark ? 'rgba(26,20,18,0.85)' : 'rgba(255,255,255,0.9)',
            border: '1px solid rgba(234,179,8,0.45)',
            boxShadow: '0 4px 12px rgba(234,179,8,0.18)',
          }}
        >
          <AppIcon name="location_on" filled size={22} color="#EAB308" />
        </div>
      </div>

      <div className="relative z-[2] p-[22px] pt-5">
        <h3 className="font-display font-bold text-[24px] tracking-[-0.025em] leading-[1.15]" style={{ color: c.textPrimary }}>
          Здесь ваша следующая чашка
        </h3>
        <button
          onClick={() => navigate('/dashboard?page=map')}
          className="mt-4 w-full h-[52px] rounded-[14px] font-display font-semibold text-[15px] inline-flex items-center justify-center gap-[10px] hover:border-[#EAB308]/40 transition-colors"
          style={{ background: c.background, color: c.textPrimary, border: `1px solid ${c.border}` }}
        >
          Открыть карту <AppIcon name="arrow_forward" size={16} />
        </button>
      </div>
    </div>
  );
};

export default LandingMapWidget;
