import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import type { Map as LeafletMap, Marker as LeafletMarker } from 'leaflet';
import { getCoffeeShopById, getCoffeeShopsByMapBounds, MapShop } from '../api/coffeeshop';
import { COLORS, getThemeColors } from '../constants/colors';
import { useTheme } from '../contexts/ThemeContext';
import { AppIcon, StarIcon } from './icons';
import WobbleRing from './WobbleRing';
import {
  MINSK_CENTER,
  coffeeClusterIcon,
  coffeeMapPinIcon,
  createOsmMap,
  ensureMapPinMascots,
  getMapBoundsBox,
  groupShopsForMap,
  zoomToClusterShops,
} from '../map/osmMap';

const MAP_ROUTE = '/dashboard?page=map';

type PreviewShop = {
  id: string;
  title: string;
  rating?: number;
  reviewCount?: number;
};

function parseShops(response: Awaited<ReturnType<typeof getCoffeeShopsByMapBounds>>): MapShop[] {
  const shops = response.data?.shops;
  if (!Array.isArray(shops)) return [];
  return shops.map((shop: MapShop & { name?: string; Type?: unknown }) => ({
    id: shop.id,
    latitude: Number(shop.latitude),
    longitude: Number(shop.longitude),
    title: shop.title || shop.name || 'Кофейня',
    type: shop.type ?? shop.Type,
  }));
}

const LandingMapWidget: React.FC<{ embed?: boolean }> = ({ embed = false }) => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const c = getThemeColors(theme);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<LeafletMarker[]>([]);
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
    let updateTimeout: ReturnType<typeof setTimeout> | undefined;

    const clearMarkers = () => {
      const map = mapInstanceRef.current;
      markersRef.current.forEach((marker) => {
        try {
          map?.removeLayer(marker);
        } catch {
          /* ignore */
        }
      });
      markersRef.current = [];
    };

    const pickPreview = async (shop: MapShop, paint: (list: MapShop[]) => void) => {
      const already = previewIdRef.current === shop.id;
      previewIdRef.current = shop.id;
      setPreview({ id: shop.id, title: shop.title });
      paint(shopsRef.current);
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

    const addMarkers = (map: LeafletMap, shopsList: MapShop[]) => {
      void ensureMapPinMascots().then(() => {
        if (mapInstanceRef.current !== map) return;
        clearMarkers();
        const targets = groupShopsForMap(shopsList, map);

        targets.forEach((target) => {
          if (target.type === 'cluster') {
            const marker = L.marker([target.lat, target.lng], {
              icon: coffeeClusterIcon(target.shops.length),
              keyboard: false,
              zIndexOffset: 400,
            });
            marker.on('click', () => {
              zoomToClusterShops(map, target.shops);
            });
            marker.addTo(map);
            markersRef.current.push(marker);
            return;
          }

          const shop = target.shop;
          const selected = previewIdRef.current === shop.id;
          const marker = L.marker([shop.latitude, shop.longitude], {
            icon: coffeeMapPinIcon({ focus: shop.type, selected }),
            title: shop.title,
            keyboard: false,
            zIndexOffset: selected ? 1000 : 0,
          });
          marker.on('click', () => {
            void pickPreview(shop, (list) => addMarkers(map, list));
          });
          marker.addTo(map);
          markersRef.current.push(marker);
        });

        if (shopsList.length > 0 && !previewIdRef.current) {
          void pickPreview(shopsList[0], (list) => addMarkers(map, list));
        }
      });
    };

    const loadShops = async (map: LeafletMap) => {
      try {
        const { minLat, minLon, maxLat, maxLon } = getMapBoundsBox(map);
        const response = await getCoffeeShopsByMapBounds(minLat, minLon, maxLat, maxLon);
        if (cancelled) return;
        shopsRef.current = parseShops(response);
        addMarkers(map, shopsRef.current);
        setError(null);
      } catch {
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
          dark: false,
        });
        mapInstanceRef.current = map;
        setIsLoading(false);

        const scheduleUpdate = () => {
          clearTimeout(updateTimeout);
          updateTimeout = setTimeout(() => void loadShops(map), 300);
        };

        scheduleUpdate();
        map.on('moveend', scheduleUpdate);
        map.on('zoomend', () => {
          addMarkers(map, shopsRef.current);
          scheduleUpdate();
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
        initMap();
        mapInstanceRef.current?.invalidateSize();
      }
    });
    observer.observe(container);
    initMap();

    return () => {
      cancelled = true;
      clearTimeout(updateTimeout);
      observer.disconnect();
      clearMarkers();
      mapInstanceRef.current?.remove();
      mapInstanceRef.current = null;
      initStartedRef.current = false;
      previewIdRef.current = null;
    };
  }, []);

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
