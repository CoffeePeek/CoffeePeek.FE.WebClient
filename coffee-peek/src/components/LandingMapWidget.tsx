import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCoffeeShopsByMapBounds, MapShop } from '../api/coffeeshop';
import { AppIcon } from './icons';
import WobbleRing from './WobbleRing';

declare global {
  interface Window {
    ymaps: any;
  }
}

const MINSK_CENTER: [number, number] = [53.9, 27.5667];

const MARKER_SVG = (circleColor: string, borderColor: string, iconColor: string, borderWidth: number) =>
  'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`
    <svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="22" fill="${circleColor}" stroke="${borderColor}" stroke-width="${borderWidth}"/>
      <g transform="translate(12, 12) scale(0.045)">
        <path fill="${iconColor}" d="M378.596,374.959c1.729-2.724,3.363-5.429,4.953-8.222c13.649,12.403,31.767,20.005,51.619,20.005c42.366,0,76.832-34.45,76.832-76.815c0-42.366-34.508-76.824-76.874-76.824c-8.883,0-17.481,1.541-25.394,4.326v-39.62c0-9.364-7.508-17.354-16.872-17.354H48.544c-9.364,0-17.49,7.988-17.49,17.354v69.826c0,38.118,11.063,75.14,31.488,107.324c9.008,14.194,19.96,27.051,32.045,38.355H16.956C7.592,413.314,0,420.905,0,430.27s7.592,16.956,16.956,16.956h30.942c4.867,32.781,32.579,56.519,65.933,56.519h213.642c33.353,0,61.065-23.738,65.933-56.519h31.043c9.364,0,16.956-7.592,16.956-16.956s-7.592-16.956-16.956-16.956h-77.631C358.902,402.01,369.588,389.153,378.596,374.959z M409.653,275.455c7.137-5.295,15.966-8.432,25.515-8.432c23.667-0.001,42.921,19.254,42.921,42.921c0,23.667-19.254,42.921-42.921,42.921c-15.248,0-28.655-7.999-36.271-20.015C405.239,314.417,408.89,295.105,409.653,275.455z M358.666,447.225c-4.258,13.565-16.629,22.608-31.194,22.608H113.831c-14.565,0-26.935-9.043-31.194-22.608H358.666z M289.631,413.314H151.773c-52.73-28.26-86.808-84.98-86.808-145.679v-53.268H375.82v53.268C375.82,328.334,342.361,385.054,289.631,413.314z"/>
        <path fill="${iconColor}" d="M169.907,122.299l-8.316-6.683c-3.207-2.577-5.014-6.414-4.958-10.527c0.055-4.113,1.966-7.9,5.242-10.389c11.481-8.727,18.268-21.999,18.62-36.417s-5.78-28.005-16.822-37.281c-7.17-6.023-17.866-5.092-23.889,2.078c-6.023,7.17-5.092,17.866,2.078,23.89c4.254,3.572,4.791,8.104,4.733,10.488c-0.059,2.383-0.817,6.883-5.239,10.245c-11.642,8.848-18.433,22.308-18.63,36.93c-0.198,14.621,6.226,28.261,17.625,37.42l8.316,6.683c3.132,2.516,6.883,3.739,10.611,3.739c4.961,0,9.878-2.167,13.228-6.335C178.369,138.838,177.207,128.166,169.907,122.299z"/>
        <path fill="${iconColor}" d="M240.322,131.073l-9.754-7.838c-4.468-3.591-6.987-8.938-6.909-14.67c0.077-5.732,2.74-11.009,7.303-14.478c12.753-9.692,20.292-24.435,20.681-40.448c0.39-16.013-6.419-31.107-18.684-41.409c-7.17-6.024-17.867-5.094-23.888,2.077c-6.024,7.17-5.094,17.866,2.076,23.888c4.329,3.636,6.734,8.964,6.595,14.616c-0.138,5.652-2.799,10.856-7.3,14.277c-12.93,9.826-20.474,24.777-20.693,41.018c-0.22,16.24,6.915,31.39,19.575,41.563l9.754,7.838c3.132,2.517,6.883,3.739,10.611,3.739c4.961,0,9.878-2.167,13.228-6.335C248.782,147.611,247.62,136.939,240.322,131.073z"/>
        <path fill="${iconColor}" d="M308.086,122.299l-8.316-6.683c-3.207-2.577-5.014-6.414-4.958-10.527c0.055-4.113,1.966-7.9,5.242-10.389c11.481-8.727,18.268-21.999,18.62-36.417c0.352-14.418-5.78-28.005-16.822-37.281c-7.171-6.023-17.867-5.092-23.889,2.078c-6.023,7.17-5.092,17.866,2.078,23.89c4.254,3.572,4.791,8.104,4.733,10.488c-0.06,2.383-0.817,6.883-5.239,10.245c-11.642,8.848-18.433,22.308-18.63,36.93c-0.198,14.621,6.226,28.261,17.625,37.42l8.316,6.683c3.132,2.516,6.883,3.739,10.611,3.739c4.961,0,9.878-2.167,13.228-6.335C316.548,138.838,315.386,128.166,308.086,122.299z"/>
      </g>
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
            iconLayout: 'default#imageWithContent',
            iconImageHref: MARKER_SVG('#FFFFFF', '#EAB308', '#1A1412', 2),
            iconImageSize: [40, 40],
            iconImageOffset: [-20, -20],
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

  return (
    <div
      className="relative rounded-[28px] border border-[#3D2F28] overflow-hidden"
      style={{
        background: '#2D241F',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 30px 60px -20px rgba(0,0,0,0.6)',
      }}
    >
      <div className="relative h-[360px] bg-[#1A1412]">
        <div ref={mapRef} className="ymap-dark absolute inset-0" />

        {isLoading && (
          <div className="absolute inset-0 z-[3] flex items-center justify-center bg-[#2D241F]">
            <WobbleRing size={40} />
          </div>
        )}

        {error && !isLoading && (
          <div className="absolute inset-0 z-[3] flex items-center justify-center bg-[#2D241F] px-6 text-center">
            <p className="font-body text-sm text-[#A39E93]">{error}</p>
          </div>
        )}

        <div
          className="absolute top-[18px] left-[18px] z-[4] px-4 py-2 rounded-full font-display font-semibold text-[13px] text-white border border-[#3D2F28] pointer-events-none"
          style={{ background: 'rgba(26,20,18,0.75)', backdropFilter: 'blur(12px)' }}
        >
          Карта
        </div>
        <div
          className="absolute top-[18px] right-[18px] z-[4] w-11 h-11 rounded-full flex items-center justify-center pointer-events-none"
          style={{
            background: 'rgba(26,20,18,0.85)',
            border: '1px solid rgba(234,179,8,0.45)',
            boxShadow: '0 4px 12px rgba(234,179,8,0.18)',
          }}
        >
          <AppIcon name="location_on" filled size={22} color="#EAB308" />
        </div>
      </div>

      <div className="relative z-[2] p-[22px] pt-5">
        <h3 className="font-display font-bold text-[24px] tracking-[-0.025em] text-white leading-[1.15]">
          Здесь ваша следующая чашка
        </h3>
        <button
          onClick={() => navigate('/dashboard?page=map')}
          className="mt-4 w-full h-[52px] rounded-[14px] bg-[#1A1412] text-white border border-[#3D2F28] font-display font-semibold text-[15px] inline-flex items-center justify-center gap-[10px] hover:border-[#EAB308]/40 transition-colors"
        >
          Открыть карту <AppIcon name="arrow_forward" size={16} />
        </button>
      </div>
    </div>
  );
};

export default LandingMapWidget;
