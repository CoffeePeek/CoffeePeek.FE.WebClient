import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import type { Map as LeafletMap, Marker as LeafletMarker } from 'leaflet';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/theme';
import { getCoffeeShopsByMapBounds, getCoffeeShopById, MapShop, DetailedCoffeeShop } from '../api/coffeeshop';
import { getErrorMessage } from '../utils/errorHandler';
import { Star, BookmarkSimple } from '@/components/Icon';
import ShopPhotoPlaceholder from './ShopPhotoPlaceholder';
import Mascot from './Mascot';
import {
  applyOsmMapTheme,
  coffeeCircleIcon,
  createOsmMap,
  getMapBoundsBox,
} from '../map/osmMap';

const MapPage: React.FC = () => {
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const markersRef = useRef<LeafletMarker[]>([]);
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

  const loadCoffeeShops = async (map: LeafletMap) => {
    try {
      const { minLat, minLon, maxLat, maxLon } = getMapBoundsBox(map);
      const response = await getCoffeeShopsByMapBounds(minLat, minLon, maxLat, maxLon);

      let shopsList: MapShop[] = [];
      if (response.data?.shops && Array.isArray(response.data.shops)) {
        shopsList = response.data.shops.map((shop: MapShop & { name?: string }) => ({
          id: shop.id,
          latitude: Number(shop.latitude),
          longitude: Number(shop.longitude),
          title: shop.title || shop.name || 'Кофейня',
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

  useEffect(() => {
    const container = mapRef.current;
    if (!container || mapInstanceRef.current) return;

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

    const paintMarkers = (shopsList: MapShop[]) => {
      const map = mapInstanceRef.current;
      if (!map) return;
      clearMarkers();
      shopsList.forEach((shop) => {
        if (!shop.latitude || !shop.longitude) return;
        const selected = selectedIdRef.current === shop.id;
        const marker = L.marker([shop.latitude, shop.longitude], {
          icon: coffeeCircleIcon(selected),
          title: shop.title,
        });
        marker.on('click', () => {
          selectedIdRef.current = shop.id;
          setSelectedShop(shop);
          void loadShopDetails(shop.id);
          paintMarkers(shopsRef.current);
        });
        marker.addTo(map);
        markersRef.current.push(marker);
      });
    };
    paintMarkersRef.current = paintMarkers;

    const map = createOsmMap(container, {
      zoom: 12,
      dark: theme === 'dark',
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
    map.on('zoomend', updateCoffeeShops);

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

  const formatWorkingHours = (
    schedules?: Array<{ dayOfWeek: number; openTime?: string; closeTime?: string }>,
  ) => {
    if (!schedules || schedules.length === 0) return 'Часы работы не указаны';
    const today = new Date().getDay();
    const todaySchedule = schedules.find((s) => s.dayOfWeek === today);
    if (todaySchedule?.openTime && todaySchedule?.closeTime) {
      return `${todaySchedule.openTime} - ${todaySchedule.closeTime}`;
    }
    return 'Часы работы не указаны';
  };

  return (
    <div className={`min-h-screen ${themeClasses.bg.primary} p-6`}>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className={`text-4xl font-bold ${themeClasses.text.primary} mb-2`}>Карта кофеен</h1>
          <p className={themeClasses.text.secondary}>Найдите кофейни на карте</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div
          className={`relative ${themeClasses.bg.card} border ${themeClasses.border.default} rounded-2xl overflow-hidden`}
          style={{ height: '600px' }}
        >
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="text-[#EAB308] text-xl">Загрузка карты...</div>
            </div>
          )}

          {shopsLoaded && shops.length === 0 && !isLoading && (
            <div
              className="absolute top-4 left-4 right-4 z-[500] px-3.5 py-2.5 rounded-2xl shadow-lg border flex items-center gap-2.5 pointer-events-none"
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
            style={{ width: '100%', height: '100%', minHeight: '600px' }}
            className={isLoading ? 'opacity-0' : 'opacity-100'}
          >
            <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
          </div>

          <button
            type="button"
            onClick={() => {
              const map = mapInstanceRef.current;
              if (!map) return;
              void loadCoffeeShops(map).then((loaded) => paintMarkersRef.current(loaded));
            }}
            className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 z-[500] px-6 py-3 ${themeClasses.bg.card} border ${themeClasses.border.default} rounded-full shadow-lg hover:bg-opacity-90 transition-all`}
          >
            <span className={`${themeClasses.text.primary} font-medium`}>Поиск в этой области</span>
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

                    <button type="button" className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                      <BookmarkSimple
                        size={24}
                        className={`${themeClasses.text.secondary} hover:${themeClasses.text.primary} transition-colors`}
                      />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
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
