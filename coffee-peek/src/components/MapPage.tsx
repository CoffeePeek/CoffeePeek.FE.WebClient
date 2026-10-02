import { useSearchParams } from 'react-router-dom';
import { usePublicNavigate } from '../hooks/usePublicNavigate';
import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { distanceKm, formatDistance, nearbyBounds } from '../utils/distance';
import * as maplibregl from 'maplibre-gl';
import type { Map as MapLibreMap, Marker as MapLibreMarker } from 'maplibre-gl';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/theme';
import { getMapShops, getMapZones, getCoffeeShopById, getPhotoUrl } from '../api/coffeeshop';
import type { DetailedCoffeeShop, MapSearchData, MapShop, PhotoUrlsDto } from '../api/coffeeshop';
import { getErrorMessage } from '../utils/errorHandler';
import { ArrowRight, CaretRight, Star, NavigationArrow, MagnifyingGlass, X, Polygon, MapPin, Minus, Plus } from '@/components/Icon';
import Button from './Button';
import ShopPhotoPlaceholder from './ShopPhotoPlaceholder';
import Mascot from './Mascot';
import {
  applyOsmMapTheme,
  coffeeMapPinIcon,
  coffeeZoneLabelIcon,
  createOsmMap,
  ensureMapPinMascots,
  getMapBoundsBox,
  renderMapZones,
} from '../map/osmMap';
import { getCurrentDayOfWeek, toLocalSchedules } from '../utils/shopUtils';
import { getLocationLifetime } from '../utils/geolocation';

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

const MapPage: React.FC<{ embedded?: boolean; autoPreview?: boolean; reduceMotion?: boolean }> = ({ embedded = false, autoPreview = false, reduceMotion = false }) => {
  const openPublic = usePublicNavigate();
  const [searchParams] = useSearchParams();
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<MapLibreMap | null>(null);
  const markersRef = useRef<MapLibreMarker[]>([]);
  const selectedIdRef = useRef<string | null>(null);
  const mapDataRef = useRef<MapSearchData>({ shops: [], clusters: [], zones: [] });
  const paintMapRef = useRef<(data: MapSearchData) => void>(() => undefined);
  const mapRequestRef = useRef<AbortController | null>(null);
  const themeRef = useRef(theme);
  const previewShopsRef = useRef<MapShop[]>([]);
  const [previewPaused, setPreviewPaused] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapData, setMapData] = useState<MapSearchData>({ shops: [], clusters: [], zones: [] });
  const [shopsLoaded, setShopsLoaded] = useState(false);
  const [selectedShop, setSelectedShop] = useState<MapShop | null>(null);
  const [selectedShopDetails, setSelectedShopDetails] = useState<DetailedCoffeeShop | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const userPosRef = useRef<{ lat: number; lon: number } | null>(null);
  const [userPosition, setUserPosition] = useState<{ lat: number; lon: number } | null>(null);
  const nearby = useQuery({
    queryKey: ['map', 'nearby', userPosition],
    queryFn: ({ signal }) => getMapShops(nearbyBounds(userPosition!.lat, userPosition!.lon), signal).then(response => response.data),
    enabled: !!userPosition,
  });
  const nearbyShops = userPosition ? (nearby.data?.shops ?? [])
    .map(shop => ({ shop, distance: distanceKm(userPosition.lat, userPosition.lon, shop.latitude, shop.longitude) }))
    .filter(item => item.distance <= 5).sort((a, b) => a.distance - b.distance) : [];
  const userMarkerRef = useRef<MapLibreMarker | null>(null);
  const locationExpiryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [query, setQuery] = useState('');
  const queryRef = useRef('');
  const [showZones, setShowZones] = useState(() => localStorage.getItem('mapShowZones') !== 'false');
  const showZonesRef = useRef(showZones);

  const loadCoffeeShops = async (map: MapLibreMap) => {
    mapRequestRef.current?.abort();
    const controller = new AbortController();
    mapRequestRef.current = controller;
    try {
      const bounds = getMapBoundsBox(map);
      // Shops and zones come from different server zoom bands, so fetch both to show every pin plus zones at any zoom.
      const [response, zones] = await Promise.all([
        getMapShops(bounds, controller.signal),
        showZonesRef.current ? getMapZones(bounds, controller.signal).catch(() => []) : [],
      ]);
      if (mapRequestRef.current !== controller) return null;
      const nextData: MapSearchData = {
        shops: response.data?.shops ?? [],
        clusters: response.data?.clusters ?? [],
        zones,
        isTruncated: response.data?.isTruncated === true,
      };

      mapDataRef.current = nextData;
      if (!previewShopsRef.current.length) previewShopsRef.current = nextData.shops.slice(0, 3);
      setMapData(nextData);
      setShopsLoaded(true);
      setError(null);
      return nextData;
    } catch (err: unknown) {
      if ((err as { name?: string })?.name === 'AbortError') return null;
      setShopsLoaded(true);
      setError('Ошибка при загрузке кофеен: ' + getErrorMessage(err));
      return null;
    }
  };

  const detailsRequestRef = useRef<string | null>(null);
  const loadShopDetails = async (shopId: string) => {
    // Быстрый клик A→B: ответ A не должен попасть в карточку B.
    detailsRequestRef.current = shopId;
    setSelectedShopDetails(null);
    setIsLoadingDetails(true);
    try {
      const response = await getCoffeeShopById(shopId);
      if (detailsRequestRef.current === shopId && response.success && response.data) {
        setSelectedShopDetails(response.data);
      }
    } catch {
      /* name-only card is enough */
    } finally {
      if (detailsRequestRef.current === shopId) setIsLoadingDetails(false);
    }
  };

  const selectShop = (shop: MapShop, moveToShop = false, showDetails = true) => {
    selectedIdRef.current = shop.id;
    setSelectedShop(showDetails ? shop : null);
    if (showDetails) void loadShopDetails(shop.id);
    else detailsRequestRef.current = null;
    if (moveToShop) {
      queryRef.current = '';
      setQuery('');
      mapInstanceRef.current?.flyTo({ center: [shop.longitude, shop.latitude], zoom: 16, duration: 700 });
    }
    paintMapRef.current(mapDataRef.current);
  };

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setError('Геолокация не поддерживается вашим браузером');
      return;
    }
    if (locationExpiryRef.current) clearTimeout(locationExpiryRef.current);
    userPosRef.current = null;
    setUserPosition(null);
    userMarkerRef.current?.remove();
    userMarkerRef.current = null;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (!mapInstanceRef.current) return;
        const lifetime = getLocationLifetime(pos.timestamp);
        if (lifetime === 0) {
          setError('Получено устаревшее местоположение. Попробуйте ещё раз');
          setIsLocating(false);
          return;
        }
        const { latitude, longitude } = pos.coords;
        userPosRef.current = { lat: latitude, lon: longitude };
        setUserPosition({ lat: latitude, lon: longitude });
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
        locationExpiryRef.current = setTimeout(() => {
          userPosRef.current = null;
          setUserPosition(null);
          userMarkerRef.current?.remove();
          userMarkerRef.current = null;
        }, lifetime);
        setIsLocating(false);
      },
      () => {
        if (!mapInstanceRef.current) return;
        setError('Не удалось определить местоположение');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  useEffect(() => {
    const container = mapRef.current;
    if (!container || mapInstanceRef.current) return;

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

    const paintMap = (data: MapSearchData) => {
      const map = mapInstanceRef.current;
      if (!map) return;
      const version = ++paintVersion;
      clearMarkers();
      const zones = showZonesRef.current ? data.zones ?? [] : [];
      renderMapZones(map, zones, themeRef.current === 'dark');

      zones.forEach((zone) => {
        const marker = new maplibregl.Marker({ element: coffeeZoneLabelIcon(zone), anchor: 'center' })
          .setLngLat([zone.longitude, zone.latitude])
          .addTo(map);
        markersRef.current.push(marker);
      });

      const q = queryRef.current.trim().toLowerCase();
      const visible = q
        ? data.shops.filter((shop) => shop.title.toLowerCase().includes(q))
        : data.shops;
      void ensureMapPinMascots().catch(() => {}).then(() => {
        if (mapInstanceRef.current !== map || version !== paintVersion) return;
        visible.forEach((shop) => {
          const selected = selectedIdRef.current === shop.id;
          const element = coffeeMapPinIcon({ focus: shop.type, selected });
          element.title = shop.title;
          element.style.zIndex = selected ? '1000' : '0';
          element.tabIndex = 0;
          element.setAttribute('role', 'button');
          element.setAttribute('aria-label', shop.title);
          const select = () => selectShop(shop);
          element.addEventListener('click', select);
          element.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              select();
            }
          });
          const marker = new maplibregl.Marker({ element, anchor: 'center' })
            .setLngLat([shop.longitude, shop.latitude])
            .addTo(map);
          markersRef.current.push(marker);
        });
      });
    };
    paintMapRef.current = paintMap;

    const latitude = Number(searchParams.get('lat'));
    const longitude = Number(searchParams.get('lon'));
    const hasCenter = !embedded && searchParams.has('lat') && searchParams.has('lon') && Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180;
    const map = createOsmMap(container, {
      center: hasCenter ? [longitude, latitude] : undefined,
      zoom: hasCenter ? 14 : embedded ? 13 : 12,
      dark: theme === 'dark',
      zoomControl: false,
    });
    mapInstanceRef.current = map;
    setIsLoading(false);
    if (!hasCenter && !embedded) handleLocate();
    const resizeObserver = new ResizeObserver(() => map.resize());
    resizeObserver.observe(container);
    map.on('style.load', () => paintMap(mapDataRef.current));

    const updateCoffeeShops = () => {
      clearTimeout(updateTimeout);
      updateTimeout = setTimeout(() => {
        void loadCoffeeShops(map).then((loaded) => {
          if (!cancelled && loaded) paintMap(loaded);
        });
      }, 300);
    };

    updateTimeout = setTimeout(updateCoffeeShops, 400);
    map.on('moveend', updateCoffeeShops);

    return () => {
      cancelled = true;
      resizeObserver.disconnect();
      clearTimeout(updateTimeout);
      if (locationExpiryRef.current) clearTimeout(locationExpiryRef.current);
      mapRequestRef.current?.abort();
      clearMarkers();
      map.remove();
      mapInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    themeRef.current = theme;
    const map = mapInstanceRef.current;
    if (!map) return;
    applyOsmMapTheme(map, theme === 'dark');
  }, [theme]);

  // Filter the loaded pins by name (client-side) as the user types.
  useEffect(() => {
    queryRef.current = query;
    paintMapRef.current(mapDataRef.current);
  }, [query]);

  useEffect(() => {
    showZonesRef.current = showZones;
    localStorage.setItem('mapShowZones', String(showZones));
    const map = mapInstanceRef.current;
    if (!map) return;
    paintMapRef.current(mapDataRef.current);
    if (showZones && (mapDataRef.current.zones?.length ?? 0) === 0) {
      void loadCoffeeShops(map).then((loaded) => {
        if (loaded) paintMapRef.current(loaded);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showZones]);

  useEffect(() => {
    if (!autoPreview || !shopsLoaded || previewPaused) return;
    let index = 0;
    const showNext = () => {
      const shops = previewShopsRef.current;
      if (!shops.length) return;
      const shop = shops[index++ % shops.length];
      selectShop(shop);
      mapInstanceRef.current?.flyTo({ center: [shop.longitude, shop.latitude], zoom: 15, duration: reduceMotion ? 0 : 720 });
    };
    showNext();
    if (reduceMotion) return;
    const timer = window.setInterval(showNext, 2800);
    return () => window.clearInterval(timer);
  }, [autoPreview, shopsLoaded, previewPaused, reduceMotion]);

  const formatWorkingHours = (
    schedules?: Array<{ dayOfWeek: number | string; openTime?: string; closeTime?: string }>,
  ) => {
    if (!schedules || schedules.length === 0) return 'Часы работы не указаны';
    const today = getCurrentDayOfWeek();
    const todaySchedule = toLocalSchedules(schedules).find((s) => s.dayOfWeek === today);
    if (todaySchedule?.openTime && todaySchedule?.closeTime) {
      return `${todaySchedule.openTime} - ${todaySchedule.closeTime}`;
    }
    return 'Часы работы не указаны';
  };

  const normalizedQuery = query.trim().toLocaleLowerCase('ru-RU');
  const searchResults = normalizedQuery
    ? mapData.shops.filter(shop => shop.title.toLocaleLowerCase('ru-RU').includes(normalizedQuery)).slice(0, 3)
    : [];

  return (
    <div
      className={`relative z-0 isolate overflow-hidden ${themeClasses.bg.primary}`}
      // ponytail: 64px = sticky header height; if the email-unconfirmed banner shows, the map runs that much taller than the viewport
      style={{ height: embedded ? 480 : 'calc(100dvh - 64px)' }}
      onMouseEnter={() => autoPreview && setPreviewPaused(true)}
      onMouseLeave={() => autoPreview && setPreviewPaused(false)}
      onFocusCapture={() => autoPreview && setPreviewPaused(true)}
      onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setPreviewPaused(false); }}
    >
      {!isLoading && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[550] w-[calc(100%-1.5rem)] max-w-xl">
          <div className={`flex items-center gap-3 h-14 px-5 rounded-full border shadow-lg ${themeClasses.bg.card} ${themeClasses.border.default}`}>
            <MagnifyingGlass size={24} weight="regular" className={`h-6 w-6 shrink-0 ${themeClasses.text.secondary}`} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск кофейни…"
              aria-label="Поиск кофейни по названию"
              aria-controls="map-search-results"
              className={`flex-1 min-w-0 bg-transparent outline-none text-base ${themeClasses.text.primary}`}
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} aria-label="Очистить" className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${themeClasses.text.secondary}`}>
                <X size={16} weight="bold" />
              </button>
            )}
          </div>
          {searchResults.length > 0 && (
            <div id="map-search-results" className={`mt-2 overflow-hidden rounded-2xl border shadow-xl ${themeClasses.bg.card} ${themeClasses.border.default}`}>
              {searchResults.map((shop, index) => (
                <button
                  type="button"
                  key={shop.id}
                  onClick={() => selectShop(shop, true)}
                  className={`flex min-h-14 w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-black/5 dark:hover:bg-white/5 ${index ? `border-t ${themeClasses.border.default}` : ''}`}
                >
                  <MapPin size={21} weight="bold" className="shrink-0 text-[#EAB308]" />
                  <span className={`min-w-0 flex-1 truncate font-semibold ${themeClasses.text.primary}`}>{shop.title}</span>
                  <CaretRight size={20} className={`shrink-0 ${themeClasses.text.secondary}`} />
                </button>
              ))}
            </div>
          )}
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

      {shopsLoaded
        && mapData.shops.length === 0
        && mapData.clusters.length === 0
        && (mapData.zones?.length ?? 0) === 0
        && !isLoading && (
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

      {mapData.isTruncated && !isLoading && (
        <div className="absolute top-[68px] left-4 right-4 z-[500] px-3.5 py-2.5 rounded-2xl bg-amber-500/90 text-[#1A1412] text-center text-sm font-medium shadow-lg pointer-events-none">
          Показана часть кофеен — приблизьте карту
        </div>
      )}

      <div
        style={{ width: '100%', height: '100%' }}
        className={isLoading ? 'opacity-0' : 'opacity-100'}
      >
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      </div>

      <div className={`absolute right-4 z-[500] flex flex-col gap-3 ${selectedShop && !embedded ? 'bottom-[280px]' : 'bottom-[156px]'}`}>
        <div className={`mb-3 flex flex-col overflow-hidden rounded-full border shadow-lg ${themeClasses.bg.card} ${themeClasses.border.default}`}>
          <button type="button" onClick={() => mapInstanceRef.current?.zoomIn()} aria-label="Приблизить карту" className={`flex h-14 w-14 items-center justify-center ${themeClasses.text.primary}`}><Plus size={28} className="h-7 w-7 shrink-0" /></button>
          <button type="button" onClick={() => mapInstanceRef.current?.zoomOut()} aria-label="Отдалить карту" className={`flex h-14 w-14 items-center justify-center border-t ${themeClasses.border.default} ${themeClasses.text.primary}`}><Minus size={28} className="h-7 w-7 shrink-0" /></button>
        </div>
        <button type="button" onClick={() => setShowZones(value => !value)} aria-label={showZones ? 'Скрыть кофейные зоны' : 'Показать кофейные зоны'} aria-pressed={showZones} title="Кофейные зоны" className={`flex h-14 w-14 items-center justify-center rounded-full border shadow-lg active:scale-95 ${themeClasses.bg.card} ${themeClasses.border.default} ${showZones ? 'text-[#EAB308]' : themeClasses.text.secondary}`}><Polygon size={28} className="h-7 w-7 shrink-0" weight="regular" /></button>
        <button type="button" onClick={handleLocate} disabled={isLocating} aria-label="Моё местоположение" className={`flex h-14 w-14 items-center justify-center rounded-full border shadow-lg active:scale-95 disabled:opacity-60 ${themeClasses.bg.card} ${themeClasses.border.default} ${themeClasses.text.primary}`}>
          {isLocating ? <span className="h-7 w-7 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <NavigationArrow size={30} className="h-8 w-8 shrink-0" />}
        </button>
      </div>
      {!selectedShop && <section aria-label="Кофейни рядом" className="absolute inset-x-0 bottom-4 z-[500]">
        {userPosition && nearbyShops.length > 0 ? <>
          <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2">{nearbyShops.map(({ shop, distance }) => <button key={shop.id} type="button" onClick={() => selectShop(shop, true, false)} className={`flex w-[min(340px,85vw)] shrink-0 snap-center items-center gap-4 rounded-[28px] border p-4 text-left shadow-lg ${themeClasses.bg.card} ${themeClasses.border.default}`}>
            <span className="h-20 w-20 shrink-0 overflow-hidden rounded-[20px]"><MapShopThumb alt="" /></span><span className="min-w-0"><span className={`block text-sm ${themeClasses.text.secondary}`}>Кофейня рядом</span><span className={`mt-1 block truncate text-lg font-bold ${themeClasses.text.primary}`}>{shop.title}</span><span className={`mt-1 block text-sm ${themeClasses.text.secondary}`}>{formatDistance(distance)}</span></span>
          </button>)}</div>
          {nearby.data?.isTruncated && <p className={`mx-4 w-fit rounded-full px-3 py-1 text-xs ${themeClasses.bg.card} ${themeClasses.text.secondary}`}>Показана часть кофеен в радиусе 5 км</p>}
        </> : <div className={`mx-4 flex max-w-md items-center gap-3 rounded-[28px] border p-4 shadow-lg ${themeClasses.bg.card} ${themeClasses.border.default}`}><Mascot pose="search" size={52} /><div className="min-w-0 flex-1"><p className={`font-semibold ${themeClasses.text.primary}`}>{isLocating ? 'Определяем местоположение…' : !userPosition ? 'Кофейни рядом с вами' : nearby.isLoading ? 'Ищем кофейни в радиусе 5 км…' : nearby.error ? 'Не удалось загрузить кофейни' : 'В радиусе 5 км кофеен нет'}</p>{!isLocating && (!userPosition || nearby.error) && <button type="button" className="mt-1 min-h-8 font-semibold text-[#EAB308]" onClick={() => userPosition ? void nearby.refetch() : handleLocate()}>{userPosition ? 'Повторить' : 'Разрешить местоположение'}</button>}</div></div>}
      </section>}
      {embedded && selectedShop && <button type="button" onClick={() => openPublic('shops', selectedShop.publicAddress ?? selectedShop.id)} className={`absolute bottom-4 left-4 right-4 z-[500] flex items-center gap-3 rounded-[28px] border p-4 text-left shadow-lg ${themeClasses.bg.card} ${themeClasses.border.default}`}>
        <span className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl"><MapShopThumb alt="" src={selectedShopDetails?.photos?.[0] ? getPhotoUrl(selectedShopDetails.photos[0], 'thumbnail') : undefined} /></span>
        <span className="min-w-0 flex-1"><span className={`block truncate font-bold ${themeClasses.text.primary}`}>{selectedShop.title}</span><span className={`mt-1 flex items-center gap-1 text-sm ${themeClasses.text.secondary}`}><Star size={16} weight="fill" color="#EAB308" />{selectedShopDetails?.rating?.toFixed(1) ?? 'Кофейня на карте'}</span></span><CaretRight size={24} className={themeClasses.text.secondary} />
      </button>}
      {!embedded && selectedShop && (
        <div
          className={`absolute bottom-4 left-4 right-4 z-[500] ${themeClasses.bg.card} border ${themeClasses.border.default} rounded-[28px] shadow-2xl max-w-md mx-auto`}
        >
          <button type="button" aria-label="Закрыть карточку кофейни" onClick={() => { selectedIdRef.current = null; detailsRequestRef.current = null; setSelectedShop(null); paintMapRef.current(mapDataRef.current); }} className={`absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full ${themeClasses.bg.card} ${themeClasses.text.secondary}`}><X size={20} /></button>
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
                          ? selectedShopDetails.photos.map((p: { fullUrl?: string | null; urls?: PhotoUrlsDto | null } | string) =>
                            typeof p === 'string' ? p : getPhotoUrl(p, 'thumbnail'),
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
                  className={`flex-1 min-h-11 inline-flex items-center justify-center gap-2 rounded-full border font-semibold active:scale-[0.98] transition-all ${themeClasses.border.default} ${themeClasses.text.primary}`}
                >
                  <NavigationArrow size={18} weight="bold" />
                  Маршрут
                </button>
                <Button
                  type="button"
                  onClick={() => openPublic('shops', selectedShop.publicAddress)}
                  className="flex-1 min-h-11 !rounded-full"
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
  if (!src || failed) return <ShopPhotoPlaceholder fontSize={10} />;
  return (
    <img src={src} alt={alt} className="w-full h-full object-cover" onError={() => setFailed(true)} />
  );
};

export default MapPage;
