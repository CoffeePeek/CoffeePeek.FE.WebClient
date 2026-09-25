import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as maplibregl from 'maplibre-gl';
import type { Map as MapLibreMap, Marker as MapLibreMarker } from 'maplibre-gl';
import { getCoffeeShopById, getMapShops, getMapZones } from '../api/coffeeshop';
import type { MapSearchData, MapShop } from '../api/coffeeshop';
import { COLORS, getThemeColors } from '../constants/colors';
import { useTheme } from '../contexts/ThemeContext';
import { AppIcon, StarIcon } from './icons';
import WobbleRing from './WobbleRing';
import {
  MINSK_CENTER,
  coffeeMapPinIcon,
  coffeeZoneLabelIcon,
  createOsmMap,
  ensureMapPinMascots,
  getMapBoundsBox,
  renderMapZones,
} from '../map/osmMap';

const MAP_ROUTE = '/dashboard?page=map';

type PreviewShop = {
  id: string;
  title: string;
  rating?: number;
  reviewCount?: number;
};

const LandingMapWidget: React.FC<{ embed?: boolean }> = ({ embed = false }) => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const c = getThemeColors(theme);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<MapLibreMarker[]>([]);
  const mapDataRef = useRef<MapSearchData>({ shops: [], zones: [] });
  const mapRequestRef = useRef<AbortController | null>(null);
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
    let updateTimeout: ReturnType<typeof setTimeout> | undefined;
    let paintVersion = 0;

    const clearMarkers = () => {
      markersRef.current.forEach((marker) => {
        try {
          marker.remove();
        } catch {
          /* ignore */
        }
      });
      markersRef.current = [];
    };

    const pickPreview = async (shop: MapShop, paint: (data: MapSearchData) => void) => {
      const already = previewIdRef.current === shop.id;
      previewIdRef.current = shop.id;
      setPreview({ id: shop.id, title: shop.title });
      paint(mapDataRef.current);
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

    const addMarkers = (map: MapLibreMap, data: MapSearchData) => {
      const version = ++paintVersion;
      clearMarkers();
      renderMapZones(map, data.zones ?? [], isDark);
      (data.zones ?? []).forEach((zone) => {
        const marker = new maplibregl.Marker({ element: coffeeZoneLabelIcon(zone), anchor: 'center' })
          .setLngLat([zone.longitude, zone.latitude])
          .addTo(map);
        markersRef.current.push(marker);
      });

      void ensureMapPinMascots().catch(() => {}).then(() => {
        if (mapInstanceRef.current !== map || version !== paintVersion) return;
        data.shops.forEach((shop) => {
          const selected = previewIdRef.current === shop.id;
          const element = coffeeMapPinIcon({ focus: shop.type, selected });
          element.title = shop.title;
          element.style.zIndex = selected ? '1000' : '0';
          element.addEventListener('click', () => {
            void pickPreview(shop, (list) => addMarkers(map, list));
          });
          const marker = new maplibregl.Marker({ element, anchor: 'center' })
            .setLngLat([shop.longitude, shop.latitude])
            .addTo(map);
          markersRef.current.push(marker);
        });

        if (data.shops.length > 0 && !previewIdRef.current) {
          void pickPreview(data.shops[0], (nextData) => addMarkers(map, nextData));
        }
      });
    };

    const loadShops = async (map: MapLibreMap) => {
      mapRequestRef.current?.abort();
      const controller = new AbortController();
      mapRequestRef.current = controller;
      try {
        const bounds = getMapBoundsBox(map);
        const [response, zones] = await Promise.all([
          getMapShops(bounds, controller.signal),
          getMapZones(bounds, controller.signal).catch(() => []),
        ]);
        if (cancelled || mapRequestRef.current !== controller) return;
        if (!response.data.shops.some((shop) => shop.id === previewIdRef.current)) {
          previewIdRef.current = null;
          setPreview(null);
        }
        const data = { ...response.data, zones };
        mapDataRef.current = data;
        addMarkers(map, data);
        setError(response.data.isTruncated ? 'Приблизьте карту, чтобы увидеть все кофейни' : null);
      } catch (err: unknown) {
        if ((err as { name?: string })?.name === 'AbortError') return;
        if (!cancelled) setError('Не удалось загрузить кофейни');
      }
    };

    const initMap = () => {
      if (initStartedRef.current || cancelled || container.clientWidth < 100) return;
      initStartedRef.current = true;

      try {
        const map = createOsmMap(container, {
          center: MINSK_CENTER,
          zoom: 13,
          dark: isDark,
        });
        mapInstanceRef.current = map;
        setIsLoading(false);
        map.on('style.load', () => addMarkers(map, mapDataRef.current));

        const scheduleUpdate = () => {
          clearTimeout(updateTimeout);
          updateTimeout = setTimeout(() => void loadShops(map), 300);
        };

        scheduleUpdate();
        map.on('moveend', scheduleUpdate);
      } catch {
        if (!cancelled) {
          setError('Не удалось загрузить карту');
          setIsLoading(false);
        }
      }
    };

    const observer = new ResizeObserver(() => {
      if (container.clientWidth >= 100) {
        initMap();
        mapInstanceRef.current?.resize();
      }
    });
    observer.observe(container);
    initMap();

    return () => {
      cancelled = true;
      clearTimeout(updateTimeout);
      mapRequestRef.current?.abort();
      observer.disconnect();
      clearMarkers();
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
      initStartedRef.current = false;
      previewIdRef.current = null;
    };
  }, [isDark]);

  const ratingLabel = preview?.rating != null ? Number(preview.rating).toFixed(1) : null;

  const mapStage = (
    <div
      className={embed ? 'relative h-full min-h-[280px] lg:min-h-[400px]' : 'relative h-[380px]'}
      style={{ background: '#E8EDF2' }}
    >
      <div className="absolute inset-0 z-0">
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      </div>

      {isLoading && (
        <div className="absolute inset-0 z-[3] flex items-center justify-center" style={{ background: c.surface }}>
          <WobbleRing size={40} />
        </div>
      )}

      {preview && !isLoading && (
        <button
          type="button"
          onClick={goToMap}
          className="absolute left-4 right-4 bottom-4 z-[500] text-left rounded-[14px] px-3.5 py-3 flex items-center gap-3"
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
            <p className="truncate font-extended font-semibold text-[14px] leading-tight text-[#1C1917]">
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
          className="absolute left-4 right-4 z-[500] rounded-xl px-4 py-2 text-center pointer-events-none"
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
        <h3
          className="font-extended font-bold text-[24px] tracking-[-0.025em] leading-[1.15]"
          style={{ color: c.textPrimary }}
        >
          Здесь ваша следующая чашка
        </h3>
        <button
          onClick={goToMap}
          className="mt-4 w-full h-[52px] rounded-[14px] font-extended font-semibold text-[15px] inline-flex items-center justify-center gap-[10px] hover:border-[#EAB308]/40 transition-colors"
          style={{ background: c.background, color: c.textPrimary, border: `1px solid ${c.border}` }}
        >
          Открыть карту <AppIcon name="arrow_forward" size={16} />
        </button>
      </div>
    </div>
  );
};

export default LandingMapWidget;
