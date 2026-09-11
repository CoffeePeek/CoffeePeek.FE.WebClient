import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as maplibregl from 'maplibre-gl';
import type { Map as MapLibreMap, Marker as MapLibreMarker } from 'maplibre-gl';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/theme';
import { getCoffeeShopsByMapBounds, getCoffeeShopById } from '../api/coffeeshop';
import type { DetailedCoffeeShop, MapShop } from '../api/coffeeshop';
import { getErrorMessage } from '../utils/errorHandler';
import { ArrowRight, Star, Plus, Minus, Crosshair, NavigationArrow, MagnifyingGlass, X } from '@/components/Icon';
import Button from './Button';
import ShopPhotoPlaceholder from './ShopPhotoPlaceholder';
import Mascot from './Mascot';
import {
  applyOsmMapTheme,
  coffeeClusterIcon,
  coffeeMapPinIcon,
  createOsmMap,
  ensureMapPinMascots,
  getMapBoundsBox,
  groupShopsForMap,
  zoomToClusterShops,
} from '../map/osmMap';
import { getCurrentDayOfWeek, normalizeDayOfWeek } from '../utils/shopUtils';

/** Opens a driving route to the shop in Yandex Maps (tries the mobile app first, falls back to the web map). */
function openYandexRoute(from: { lat: number; lon: number } | null, toLat: number, toLon: number): void {
  const dest = `${toLat},${toLon}`;
  const rtext = from ? `${from.lat},${from.lon}~${dest}` : `~${dest}`;
  const webUrl = `https://yandex.ru/maps/?rtext=${rtext}&rtt=auto`;
  const isMobile = /android|iphone|ipad|ipod/i.test(navigator.userAgent);
  if (isMobile) {
    // ponytail: best-effort deep link; if the Yandex app isn't installed the timeout falls back to the web map
    window.location.href = `yandexmaps://maps.yandex.ru/?rtext=${rtext}&rtt=auto`;
    window.setTimeout(() => {
      if (!document.hidden) window.location.href = webUrl;
    }, 1200);
  } else {
    window.open(webUrl, '_blank', 'noopener,noreferrer');
  }
}

const MapPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<MapLibreMarker[]>([]);
  const selectedIdRef = useRef<string | null>(null);
  const shopsRef = useRef<MapShop[]>([]);
  const paintMarkersRef = useRef<(shopsList: MapShop[]) => void>(() => undefined);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shops, setShops] = useState<MapShop[]>([]);
  const [shopsLoaded, setShopsLoaded] = useState(false);
  const [selectedShop, setSelectedShop] = useState<MapShop | null>(null);
  const [selectedShopDetails, setSelectedShopDetails] = useState<DetailedCoffeeShop | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const userPosRef = useRef<{ lat: number; lon: number } | null>(null);
  const userMarkerRef = useRef<MapLibreMarker | null>(null);
  const [query, setQuery] = useState('');
  const queryRef = useRef('');

  const loadCoffeeShops = async (map: MapLibreMap) => {
    try {
      const { minLat, minLon, maxLat, maxLon } = getMapBoundsBox(map);
      const response = await getCoffeeShopsByMapBounds(minLat, minLon, maxLat, maxLon);

      let shopsList: MapShop[] = [];
      if (response.data?.shops && Array.isArray(response.data.shops)) {
        shopsList = response.data.shops.map((shop: MapShop & { name?: string; Type?: unknown }) => ({
          id: shop.id,
          latitude: Number(shop.latitude),
          longitude: Number(shop.longitude),
          title: shop.title || shop.name || 'Кофейня',
          type: typeof shop.type === 'string' ? shop.type : typeof shop.Type === 'string' ? shop.Type : undefined,
        }));
      }

      shopsRef.current = shopsList;
      setShops(shopsList);
      setShopsLoaded(true);
      setError(null);
      return shopsList;
    } catch (err: unknown) {
      setShopsLoaded(true);
      setError('Ошибка при загрузке кофеен: ' + getErrorMessage(err));
      return [];
    }
  };

  const loadShopDetails = async (shopId: string) => {
    setIsLoadingDetails(true);
    try {
      const response = await getCoffeeShopById(shopId);
      if (response.success && response.data) {
        setSelectedShopDetails(response.data);
      }
    } catch {
      /* name-only card is enough */
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setError('Геолокация не поддерживается вашим браузером');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        userPosRef.current = { lat: latitude, lon: longitude };
        const map = mapInstanceRef.current;
        if (map) {
          map.flyTo({ center: [longitude, latitude], zoom: Math.max(map.getZoom(), 15), duration: 700 });
          if (userMarkerRef.current) {
            userMarkerRef.current.setLngLat([longitude, latitude]);
          } else {
            const el = document.createElement('div');
            el.style.cssText = 'width:18px;height:18px;border-radius:50%;background:#2F80ED;border:3px solid #fff;box-shadow:0 0 0 4px rgba(47,128,237,0.25);';
            userMarkerRef.current = new maplibregl.Marker({ element: el }).setLngLat([longitude, latitude]).addTo(map);
          }
        }
        setIsLocating(false);
      },
      () => {
        setError('Не удалось определить местоположение');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  useEffect(() => {
    const container = mapRef.current;
    if (!container || mapInstanceRef.current) return;

    let cancelled = false;
    let updateTimeout: ReturnType<typeof setTimeout> | undefined;

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

    const paintMarkers = (shopsList: MapShop[]) => {
      const map = mapInstanceRef.current;
      if (!map) return;
      const q = queryRef.current.trim().toLowerCase();
      const visible = q ? shopsList.filter((s) => (s.title ?? '').toLowerCase().includes(q)) : shopsList;
      void ensureMapPinMascots().then(() => {
        if (mapInstanceRef.current !== map) return;
        clearMarkers();
        const targets = groupShopsForMap(visible, map);

        targets.forEach((target) => {
          if (target.type === 'cluster') {
            const element = coffeeClusterIcon(target.shops.length);
            element.addEventListener('click', () => {
              zoomToClusterShops(map, target.shops);
            });
            const marker = new maplibregl.Marker({ element, anchor: 'center' })
              .setLngLat([target.lng, target.lat])
              .addTo(map);
            markersRef.current.push(marker);
            return;
          }

          const shop = target.shop;
          const selected = selectedIdRef.current === shop.id;
          const element = coffeeMapPinIcon({ focus: shop.type, selected });
          element.title = shop.title;
          element.style.zIndex = selected ? '1000' : '0';
          element.addEventListener('click', () => {
            selectedIdRef.current = shop.id;
            setSelectedShop(shop);
            void loadShopDetails(shop.id);
            paintMarkers(shopsRef.current);
          });
          const marker = new maplibregl.Marker({ element, anchor: 'center' })
            .setLngLat([shop.longitude, shop.latitude])
            .addTo(map);
          markersRef.current.push(marker);
        });
      });
    };
    paintMarkersRef.current = paintMarkers;

    const map = createOsmMap(container, {
      zoom: 12,
      dark: theme === 'dark',
      zoomControl: false,
    });
    mapInstanceRef.current = map;
    setIsLoading(false);

    const updateCoffeeShops = () => {
      clearTimeout(updateTimeout);
      updateTimeout = setTimeout(() => {
        void loadCoffeeShops(map).then((loaded) => {
          if (!cancelled) paintMarkers(loaded);
        });
      }, 300);
    };

    updateTimeout = setTimeout(updateCoffeeShops, 400);
    map.on('moveend', updateCoffeeShops);
    map.on('zoomend', () => {
      paintMarkers(shopsRef.current);
      updateCoffeeShops();
    });

    return () => {
      cancelled = true;
      clearTimeout(updateTimeout);
      clearMarkers();
      map.remove();
      mapInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    applyOsmMapTheme(map, theme === 'dark');
  }, [theme]);

  // Filter the loaded pins by name (client-side) as the user types.
  useEffect(() => {
    queryRef.current = query;
    paintMarkersRef.current(shopsRef.current);
  }, [query]);

  const formatWorkingHours = (
    schedules?: Array<{ dayOfWeek: number | string; openTime?: string; closeTime?: string }>,
  ) => {
    if (!schedules || schedules.length === 0) return 'Часы работы не указаны';
    const today = getCurrentDayOfWeek();
    const todaySchedule = schedules.find((s) => normalizeDayOfWeek(s.dayOfWeek) === today);
    if (todaySchedule?.openTime && todaySchedule?.closeTime) {
      return `${todaySchedule.openTime} - ${todaySchedule.closeTime}`;
    }
    return 'Часы работы не указаны';
  };

  return (
    <div
      className={`relative z-0 isolate overflow-hidden ${themeClasses.bg.primary}`}
      // ponytail: 64px = sticky header height; if the email-unconfirmed banner shows, the map runs that much taller than the viewport
      style={{ height: 'calc(100dvh - 64px)' }}
    >
          {!isLoading && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[550] w-[calc(100%-1.5rem)] max-w-md">
              <div className={`flex items-center gap-2 h-11 px-3 rounded-xl border shadow-lg ${themeClasses.bg.card} ${themeClasses.border.default}`}>
                <MagnifyingGlass size={18} weight="bold" className={themeClasses.text.secondary} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Поиск по названию"
                  className={`flex-1 min-w-0 bg-transparent outline-none text-sm ${themeClasses.text.primary}`}
                />
                {query && (
                  <button type="button" onClick={() => setQuery('')} aria-label="Очистить" className={`shrink-0 ${themeClasses.text.secondary}`}>
                    <X size={16} weight="bold" />
                  </button>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="absolute top-[68px] left-1/2 -translate-x-1/2 z-[600] max-w-[92%] px-4 py-2.5 rounded-2xl bg-red-500/10 border border-red-500/30 shadow-lg backdrop-blur-md">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="text-[#EAB308] text-xl">Загрузка карты...</div>
            </div>
          )}

          {shopsLoaded && shops.length === 0 && !isLoading && (
            <div
              className="absolute top-[68px] left-4 right-4 z-[500] px-3.5 py-2.5 rounded-2xl shadow-lg border flex items-center gap-2.5 pointer-events-none"
              style={{
                backgroundColor: theme === 'dark' ? 'rgba(45,36,31,0.94)' : 'rgba(255,255,255,0.96)',
                borderColor: theme === 'dark' ? '#3D2F28' : '#E7E5E4',
                backdropFilter: 'blur(12px)',
              }}
            >
              <Mascot pose="search" size={40} className="shrink-0" />
              <span
                className="min-w-0 flex-1 text-[13px] sm:text-sm font-medium leading-snug"
                style={{ color: theme === 'dark' ? '#fff' : '#1C1917' }}
              >
                Кофейни в этой области не найдены
              </span>
            </div>
          )}

          <div
            style={{ width: '100%', height: '100%' }}
            className={isLoading ? 'opacity-0' : 'opacity-100'}
          >
            <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
          </div>

          {/* App-style map controls: locate + zoom */}
          <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 z-[500] flex flex-col gap-2">
            <button
              type="button"
              onClick={handleLocate}
              disabled={isLocating}
              aria-label="Моё местоположение"
              className={`w-11 h-11 flex items-center justify-center rounded-xl border shadow-lg active:scale-95 transition-all disabled:opacity-60 ${themeClasses.bg.card} ${themeClasses.border.default} ${themeClasses.text.primary}`}
            >
              {isLocating
                ? <span className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                : <Crosshair size={20} weight="bold" />}
            </button>
            <div className={`flex flex-col rounded-xl border overflow-hidden shadow-lg ${themeClasses.bg.card} ${themeClasses.border.default}`}>
              <button
                type="button"
                onClick={() => mapInstanceRef.current?.zoomIn()}
                aria-label="Приблизить"
                className={`w-11 h-11 flex items-center justify-center active:scale-95 transition-all ${themeClasses.text.primary}`}
              >
                <Plus size={20} weight="bold" />
              </button>
              <button
                type="button"
                onClick={() => mapInstanceRef.current?.zoomOut()}
                aria-label="Отдалить"
                className={`w-11 h-11 flex items-center justify-center border-t active:scale-95 transition-all ${themeClasses.border.default} ${themeClasses.text.primary}`}
              >
                <Minus size={20} weight="bold" />
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const map = mapInstanceRef.current;
              if (!map) return;
              void loadCoffeeShops(map).then((loaded) => paintMarkersRef.current(loaded));
            }}
            className={`absolute bottom-4 left-1/2 -translate-x-1/2 z-[500] w-[calc(100%-2rem)] max-w-xs sm:w-auto sm:min-w-[280px] min-h-12 px-8 py-3 ${themeClasses.bg.card} border ${themeClasses.border.default} rounded-full shadow-lg hover:bg-opacity-90 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EAB308]/50 focus-visible:ring-offset-2`}
          >
            <span className={`${themeClasses.text.primary} font-medium whitespace-nowrap`}>Поиск в этой области</span>
          </button>

          {selectedShop && (
            <div
              className={`absolute bottom-4 left-4 right-4 z-[500] ${themeClasses.bg.card} border ${themeClasses.border.default} rounded-2xl shadow-2xl max-w-md mx-auto`}
            >
              {isLoadingDetails ? (
                <div className="p-4 flex items-center justify-center">
                  <div className="text-[#EAB308]">Загрузка...</div>
                </div>
              ) : (
                <div className="p-4">
                  <div className="flex gap-4">
                    <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                      <MapShopThumb
                        alt={selectedShop.title}
                        src={(() => {
                          const imageUrls =
                            selectedShopDetails?.photos &&
                            Array.isArray(selectedShopDetails.photos) &&
                            selectedShopDetails.photos.length > 0
                              ? selectedShopDetails.photos.map((p: { fullUrl?: string } | string) =>
                                  typeof p === 'string' ? p : p.fullUrl || '',
                                )
                              : selectedShopDetails?.imageUrls && selectedShopDetails.imageUrls.length > 0
                                ? selectedShopDetails.imageUrls
                                : [];
                          return imageUrls.length > 0 ? imageUrls[0] : undefined;
                        })()}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Star size={16} weight="fill" color="#EAB308" />
                        <span className={`${themeClasses.text.secondary} text-sm`}>
                          {selectedShopDetails?.reviewCount
                            ? `${selectedShopDetails.reviewCount} отзывов`
                            : 'Нет отзывов'}
                        </span>
                      </div>
                      <h3 className={`${themeClasses.text.primary} font-bold text-lg mb-1 truncate`}>
                        {selectedShop.title}
                      </h3>
                      <p className={`${themeClasses.text.secondary} text-sm`}>
                        {formatWorkingHours(selectedShopDetails?.schedules)}
                      </p>
                    </div>

                  </div>

                  <div className="flex gap-2 mt-4">
                    <button
                      type="button"
                      onClick={() => openYandexRoute(userPosRef.current, selectedShop.latitude, selectedShop.longitude)}
                      aria-label={`Маршрут до ${selectedShop.title}`}
                      className={`flex-1 min-h-11 inline-flex items-center justify-center gap-2 rounded-xl border font-semibold active:scale-[0.98] transition-all ${themeClasses.border.default} ${themeClasses.text.primary}`}
                    >
                      <NavigationArrow size={18} weight="bold" />
                      Маршрут
                    </button>
                    <Button
                      type="button"
                      onClick={() => navigate(`/shops/${selectedShop.id}`)}
                      className="flex-1 min-h-11"
                      aria-label={`Открыть ${selectedShop.title}`}
                    >
                      Открыть
                      <ArrowRight size={18} aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
  );
};

const MapShopThumb: React.FC<{ src?: string; alt: string }> = ({ src, alt }) => {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <ShopPhotoPlaceholder fontSize={7} />;
  return (
    <img src={src} alt={alt} className="w-full h-full object-cover" onError={() => setFailed(true)} />
  );
};

export default MapPage;
