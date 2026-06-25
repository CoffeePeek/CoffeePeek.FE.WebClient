import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getCoffeeShopsByMapBounds,
  getBrowseCoffeeShopById,
  MapShop,
  BrowseCoffeeShopDetails,
} from '../api/coffeeShops';
import { Button } from '../components/ui/Button';

declare global {
  interface Window {
    ymaps: any;
  }
}

export const BrowseMapPage: React.FC = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shops, setShops] = useState<MapShop[]>([]);
  const [shopsLoaded, setShopsLoaded] = useState(false);
  const markersRef = useRef<any[]>([]);
  const [selectedShop, setSelectedShop] = useState<MapShop | null>(null);
  const [selectedDetails, setSelectedDetails] = useState<BrowseCoffeeShopDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const loadCoffeeShops = async (bounds?: number[][]) => {
    try {
      let minLat: number | undefined;
      let minLon: number | undefined;
      let maxLat: number | undefined;
      let maxLon: number | undefined;

      if (bounds && bounds.length >= 2) {
        minLat = Math.min(bounds[0][0], bounds[1][0]);
        minLon = Math.min(bounds[0][1], bounds[1][1]);
        maxLat = Math.max(bounds[0][0], bounds[1][0]);
        maxLon = Math.max(bounds[0][1], bounds[1][1]);
      }

      const response = await getCoffeeShopsByMapBounds(minLat, minLon, maxLat, maxLon);
      const shopsList = response.data?.shops ?? [];
      setShops(shopsList);
      setShopsLoaded(true);
      return shopsList;
    } catch {
      setShopsLoaded(true);
      setError('Не удалось загрузить кофейни на карте');
      return [];
    }
  };

  const loadShopDetails = async (shopId: string) => {
    setIsLoadingDetails(true);
    try {
      const response = await getBrowseCoffeeShopById(shopId);
      if (response.data) setSelectedDetails(response.data);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const clearMarkers = () => {
    markersRef.current.forEach((marker) => {
      try {
        mapInstance?.geoObjects.remove(marker);
      } catch {
        /* ignore */
      }
    });
    markersRef.current = [];
  };

  const addMarkers = (map: any, ymaps: any, shopsList: MapShop[]) => {
    clearMarkers();
    shopsList.forEach((shop) => {
      if (!shop.latitude || !shop.longitude) return;

      const marker = new ymaps.Placemark(
        [shop.latitude, shop.longitude],
        { hintContent: shop.title },
        {
          preset: selectedShop?.id === shop.id ? 'islands#goldCoffeeIcon' : 'islands#darkBlueCoffeeIcon',
        }
      );

      marker.events.add('click', () => {
        setSelectedShop(shop);
        loadShopDetails(shop.id);
      });

      map.geoObjects.add(marker);
      markersRef.current.push(marker);
    });
  };

  const initMap = () => {
    if (!mapRef.current || !window.ymaps) return;

    window.ymaps.ready(() => {
      const map = new window.ymaps.Map(mapRef.current, {
        center: [53.9, 27.5667],
        zoom: 12,
        controls: ['zoomControl', 'fullscreenControl', 'geolocationControl'],
      });

      map.options.set('theme', 'dark');
      setMapInstance(map);
      setIsLoading(false);

      const updateShops = () => {
        const bounds = map.getBounds();
        if (!bounds || bounds.length < 2) return;

        const boundsArray = [
          [bounds[0][0], bounds[0][1]],
          [bounds[1][0], bounds[1][1]],
        ];

        loadCoffeeShops(boundsArray).then((loaded) => {
          if (loaded.length > 0) addMarkers(map, window.ymaps, loaded);
        });
      };

      setTimeout(updateShops, 500);
      map.events.add('boundschange', () => {
        setTimeout(updateShops, 300);
      });
    });
  };

  useEffect(() => {
    if (window.ymaps) {
      initMap();
      return;
    }

    const apiKey = import.meta.env.VITE_YANDEX_MAP_API_KEY ?? '';
    const script = document.createElement('script');
    script.src = `https://enterprise.api-maps.yandex.ru/2.1/?${apiKey ? `apikey=${apiKey}&` : ''}lang=ru_RU`;
    script.async = true;
    script.onload = () => initMap();
    script.onerror = () => {
      setError('Не удалось загрузить Яндекс.Карты');
      setIsLoading(false);
    };
    document.head.appendChild(script);

    return () => {
      if (mapInstance) mapInstance.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (mapInstance && shops.length > 0 && window.ymaps) {
      addMarkers(mapInstance, window.ymaps, shops);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shops, mapInstance, selectedShop?.id]);

  return (
    <div className="page-container max-w-6xl">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="page-header-title">Карта кофеен</h2>
          <p className="text-sm text-text-muted dark:text-stone-400 font-body mt-0.5">
            Просмотр кофеен на карте — без редактирования
          </p>
        </div>
        <Link to="/coffee-shops">
          <Button variant="secondary" size="sm">Список кофеен</Button>
        </Link>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div
        className="relative bg-surface-dark border border-border-dark rounded-xl overflow-hidden"
        style={{ height: 'min(70vh, 600px)' }}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="text-primary text-sm">Загрузка карты...</div>
          </div>
        )}

        {shopsLoaded && shops.length === 0 && !isLoading && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded-full bg-[#2D241F]/90 border border-border-dark text-stone-300 text-sm">
            Кофейни в этой области не найдены
          </div>
        )}

        <div ref={mapRef} className="w-full h-full min-h-[400px]" />

        {selectedShop && (
          <div className="absolute bottom-4 left-4 right-4 z-20 max-w-md mx-auto bg-surface-dark border border-border-dark rounded-xl shadow-2xl p-4">
            {isLoadingDetails ? (
              <p className="text-primary text-sm text-center">Загрузка...</p>
            ) : (
              <div className="flex gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold truncate">{selectedShop.title}</h3>
                  {selectedDetails?.address && (
                    <p className="text-stone-400 text-xs mt-1 truncate">{selectedDetails.address}</p>
                  )}
                  {selectedDetails?.rating != null && (
                    <p className="text-stone-400 text-xs mt-1">
                      ⭐ {selectedDetails.rating.toFixed(1)}
                      {selectedDetails.reviewCount != null && ` · ${selectedDetails.reviewCount} отзывов`}
                    </p>
                  )}
                </div>
                <Link to={`/coffee-shops/${selectedShop.id}`}>
                  <Button variant="primary" size="sm">Открыть</Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
