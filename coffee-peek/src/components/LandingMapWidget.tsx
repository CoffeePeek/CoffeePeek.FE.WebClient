import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCoffeeShopById, getCoffeeShopsByMapBounds, MapShop } from '../api/coffeeshop';
import { COLORS, getThemeColors } from '../constants/colors';
import { useTheme } from '../contexts/ThemeContext';
import { AppIcon, StarIcon } from './icons';
import WobbleRing from './WobbleRing';

declare global {
  interface Window {
    ymaps: any;
  }
}

const MINSK_CENTER: [number, number] = [53.9, 27.5667];
const MAP_ROUTE = '/dashboard?page=map';

function circleMarkerHref(selected: boolean) {
  const fill = selected ? '#1A1412' : '#FFFFFF';
  const stroke = selected ? '#EAB308' : '#1A1412';
  const icon = selected ? '#FFFFFF' : '#1A1412';
  return (
    'data:image/svg+xml;charset=utf-8,' +
    encodeURIComponent(`
      <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">
        <circle cx="22" cy="22" r="20" fill="${fill}" stroke="${stroke}" stroke-width="${selected ? 3 : 1.5}"/>
        <path fill="${icon}" d="M15 16h10.5a1.2 1.2 0 0 1 1.2 1.2v6.2a6.45 6.45 0 0 1-12.9 0v-6.2A1.2 1.2 0 0 1 15 16zm12.4 2.2h1.5a2.6 2.6 0 1 1 0 5.2h-1.5"/>
      </svg>
    `)
  );
}

type PreviewShop = {
  id: string;
  title: string;
  rating?: number;
  reviewCount?: number;
};

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

const LandingMapWidget: React.FC<{ embed?: boolean }> = ({ embed = false }) => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const c = getThemeColors(theme);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const shopsRef = useRef<MapShop[]>([]);
  const initStartedRef = useRef(false);
  const previewIdRef = useRef<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewShop | null>(null);

  const goToMap = () => navigate(MAP_ROUTE);

  useEffect(() => {
    const container = mapRef.current;
    if (!container) return;

    let cancelled = false;
    let updateTimeout: ReturnType<typeof setTimeout>;

    const pickPreview = async (shop: MapShop) => {
      const already = previewIdRef.current === shop.id;
      previewIdRef.current = shop.id;
      setPreview({ id: shop.id, title: shop.title });
      if (mapInstanceRef.current && window.ymaps) {
        addMarkers(mapInstanceRef.current, window.ymaps, shopsRef.current);
      }
      if (already) return;

      try {
        const response = await getCoffeeShopById(shop.id);
        if (cancelled || previewIdRef.current !== shop.id) return;
        const details = response.data;
        setPreview({
          id: shop.id,
          title: details?.name || shop.title,
          rating: details?.rating,
          reviewCount: details?.reviewCount,
        });
      } catch {
        /* name-only card is enough */
      }
    };

    const addMarkers = (map: any, ymaps: any, shopsList: MapShop[]) => {
      markersRef.current.forEach((marker) => map.geoObjects.remove(marker));
      markersRef.current = [];

      shopsList.forEach((shop) => {
        if (!shop.latitude || !shop.longitude) return;

        const selected = previewIdRef.current === shop.id;
        const marker = new ymaps.Placemark(
          [shop.latitude, shop.longitude],
          { hintContent: shop.title },
          {
            iconLayout: 'default#image',
            iconImageHref: circleMarkerHref(selected),
            iconImageSize: [44, 44],
            iconImageOffset: [-22, -22],
          },
        );

        marker.events.add('click', () => {
          void pickPreview(shop);
        });

        map.geoObjects.add(marker);
        markersRef.current.push(marker);
      });

      if (shopsList.length > 0 && !previewIdRef.current) {
        void pickPreview(shopsList[0]);
      }
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
        shopsRef.current = parseShops(response);
        addMarkers(map, ymaps, shopsRef.current);
        setError(null);
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
              controls: ['zoomControl'],
              behaviors: ['drag', 'multiTouch', 'scrollZoom'],
            },
            {
              suppressMapOpenBlock: true,
              yandexMapDisablePoiInteractivity: true,
            },
          );

          map.container.fitToViewport();
          map.options.set('theme', 'light');

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
      previewIdRef.current = null;
    };
  }, []);

  const ratingLabel =
    preview?.rating != null
      ? Number(preview.rating).toFixed(1)
      : null;

  const mapStage = (
      <div className={embed ? 'relative h-full min-h-[280px] lg:min-h-[400px]' : 'relative h-[380px]'} style={{ background: '#E8EDF2' }}>
        <div ref={mapRef} className="absolute inset-0" />

        {isLoading && (
          <div className="absolute inset-0 z-[3] flex items-center justify-center" style={{ background: c.surface }}>
            <WobbleRing size={40} />
          </div>
        )}

        {preview && !isLoading && (
          <button
            type="button"
            onClick={goToMap}
            className="absolute left-4 right-4 bottom-4 z-[4] text-left rounded-[14px] px-3.5 py-3 flex items-center gap-3"
            style={{
              background: 'rgba(255,255,255,0.96)',
              border: '1px solid #E7E5E4',
              boxShadow: '0 10px 28px rgba(0,0,0,0.18)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <div
              className="w-9 h-9 rounded-[10px] shrink-0 flex items-center justify-center"
              style={{ background: 'rgba(234,179,8,0.16)' }}
            >
              <AppIcon name="local_cafe" filled size={18} color={COLORS.primary} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display font-semibold text-[14px] leading-tight text-[#1C1917]">
                {preview.title}
              </p>
              <p className="mt-0.5 font-body text-[12px] inline-flex items-center gap-1 text-[#78716C]">
                {ratingLabel ? (
                  <>
                    <StarIcon filled size={12} className="text-[#EAB308]" />
                    {ratingLabel}
                    {preview.reviewCount != null && preview.reviewCount > 0
                      ? ` · ${preview.reviewCount} отзывов`
                      : ''}
                  </>
                ) : (
                  'На карте рядом'
                )}
              </p>
            </div>
          </button>
        )}

        {error && !isLoading && (
          <div
            className="absolute left-4 right-4 z-[5] rounded-xl px-4 py-2 text-center pointer-events-none"
            style={{
              top: 16,
              background: 'rgba(255,255,255,0.92)',
              border: `1px solid ${c.border}`,
              backdropFilter: 'blur(12px)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            }}
          >
            <p className="font-body text-sm text-[#1C1917]">{error}</p>
          </div>
        )}
      </div>
  );

  if (embed) {
    return <div className="h-full">{mapStage}</div>;
  }

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
      {mapStage}

      <div className="relative z-[2] p-[22px] pt-5">
        <h3 className="font-display font-bold text-[24px] tracking-[-0.025em] leading-[1.15]" style={{ color: c.textPrimary }}>
          Здесь ваша следующая чашка
        </h3>
        <button
          onClick={goToMap}
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
