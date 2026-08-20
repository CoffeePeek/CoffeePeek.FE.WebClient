import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCoffeeShopById, getCoffeeShopsByMapBounds, MapShop } from '../api/coffeeshop';
import { brand, dark } from '../design-system/tokens';
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
const SEARCH_ROUTE = '/shops';
const GOLD_WARM = '#D4A84B';

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

const LandingMapWidget: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const c = getThemeColors(theme);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const initStartedRef = useRef(false);
  const previewIdRef = useRef<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<PreviewShop | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const goToSearch = () => navigate(SEARCH_ROUTE);
  const goToMap = () => navigate(MAP_ROUTE);

  useEffect(() => {
    const container = mapRef.current;
    if (!container) return;

    let cancelled = false;
    let updateTimeout: ReturnType<typeof setTimeout>;

    const pickPreview = async (shop: MapShop) => {
      if (previewIdRef.current === shop.id) return;
      previewIdRef.current = shop.id;
      setPreview({ id: shop.id, title: shop.title });

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
        addMarkers(map, ymaps, parseShops(response));
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
              controls: [],
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

  const locateUser = () => {
    if (!navigator.geolocation || isLocating) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const map = mapInstanceRef.current;
        if (!map) return;
        map.setCenter([position.coords.latitude, position.coords.longitude], 14, { duration: 400 });
      },
      () => {
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
    );
  };

  const searchInputStyle: React.CSSProperties = {
    width: '100%',
    height: 40,
    borderRadius: 10,
    border: `1px solid ${isDark ? '#3D2F28' : 'rgba(158,123,54,.4)'}`,
    background: isDark ? 'rgba(26,20,18,0.92)' : 'rgba(255,255,255,0.96)',
    padding: '0 14px 0 40px',
    fontSize: 14,
    fontFamily: '"RF Dewi Expanded"',
    color: isDark ? '#fff' : '#1C1917',
    outline: 'none',
    boxSizing: 'border-box',
    boxShadow: '0 8px 24px rgba(0,0,0,0.16)',
    cursor: 'pointer',
  };

  const ratingLabel =
    preview?.rating != null
      ? Number(preview.rating).toFixed(1)
      : null;

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
      <div className="relative h-[380px]" style={{ background: c.background }}>
        <div ref={mapRef} className="absolute inset-0" />

        {isLoading && (
          <div className="absolute inset-0 z-[3] flex items-center justify-center" style={{ background: c.surface }}>
            <WobbleRing size={40} />
          </div>
        )}

        <div className="absolute top-4 left-4 right-4 z-[4] flex items-center gap-2 pointer-events-none">
          <div className="relative flex-1 min-w-0 pointer-events-auto">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
              <AppIcon name="search" size={18} color={GOLD_WARM} />
            </span>
            <input
              readOnly
              placeholder="Кофейня или район…"
              aria-label="Поиск кофеен на карте"
              onFocus={goToSearch}
              onClick={goToSearch}
              style={searchInputStyle}
            />
          </div>
          <button
            type="button"
            onClick={locateUser}
            aria-label="Моё местоположение"
            className="pointer-events-auto w-10 h-10 shrink-0 rounded-[10px] flex items-center justify-center"
            style={{
              background: isDark ? 'rgba(26,20,18,0.92)' : 'rgba(255,255,255,0.96)',
              border: `1px solid ${isDark ? '#3D2F28' : 'rgba(158,123,54,.4)'}`,
              boxShadow: '0 8px 24px rgba(0,0,0,0.16)',
            }}
          >
            {isLocating ? (
              <WobbleRing size={18} />
            ) : (
              <AppIcon name="location_on" filled size={20} color={COLORS.primary} />
            )}
          </button>
        </div>

        {preview && !isLoading && (
          <button
            type="button"
            onClick={goToMap}
            className="absolute left-4 right-16 bottom-4 z-[4] text-left rounded-[14px] px-3.5 py-3 flex items-center gap-3"
            style={{
              background: isDark ? 'rgba(26,20,18,0.94)' : 'rgba(255,255,255,0.96)',
              border: `1px solid ${c.border}`,
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
              <p
                className="truncate font-display font-semibold text-[14px] leading-tight"
                style={{ color: c.textPrimary }}
              >
                {preview.title}
              </p>
              <p className="mt-0.5 font-body text-[12px] inline-flex items-center gap-1" style={{ color: c.textSecondary }}>
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
              top: 64,
              background: isDark ? 'rgba(26,20,18,0.88)' : 'rgba(255,255,255,0.92)',
              border: `1px solid ${c.border}`,
              backdropFilter: 'blur(12px)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            }}
          >
            <p className="font-body text-sm" style={{ color: c.textPrimary }}>{error}</p>
          </div>
        )}
      </div>

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
