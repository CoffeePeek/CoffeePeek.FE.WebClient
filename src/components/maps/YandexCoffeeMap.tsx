import React, { useMemo, useRef } from 'react';
import { Map, Placemark, YMaps } from '@pbe/react-yandex-maps';
import type { ShortShopDto } from '../../api/types';

export type MapBounds = {
  minLat: number;
  minLon: number;
  maxLat: number;
  maxLon: number;
};

type YandexCoffeeMapProps = {
  className?: string;
  apiKey?: string;
  shops: ShortShopDto[];
  defaultCenter: [number, number];
  defaultZoom?: number;
  onShopSelect: (shopId: string) => void;
  onBoundsChange?: (bounds: MapBounds) => void;
};

const toBounds = (bounds: number[][]): MapBounds | null => {
  // Yandex: [[southWestLat, southWestLon], [northEastLat, northEastLon]]
  if (!Array.isArray(bounds) || bounds.length !== 2) return null;
  const sw = bounds[0];
  const ne = bounds[1];
  if (!Array.isArray(sw) || !Array.isArray(ne) || sw.length !== 2 || ne.length !== 2) return null;
  const minLat = Number(sw[0]);
  const minLon = Number(sw[1]);
  const maxLat = Number(ne[0]);
  const maxLon = Number(ne[1]);
  if ([minLat, minLon, maxLat, maxLon].some((v) => Number.isNaN(v))) return null;
  return { minLat, minLon, maxLat, maxLon };
};

export function YandexCoffeeMap({
  className,
  apiKey,
  shops,
  defaultCenter,
  defaultZoom = 12,
  onShopSelect,
  onBoundsChange,
}: YandexCoffeeMapProps) {
  const hasKey = Boolean(apiKey?.trim());
  const boundsDebounceRef = useRef<number | undefined>(undefined);

  const points = useMemo(() => {
    return shops
      .map((s) => {
        // Be tolerant to different backend field names for coordinates.
        const loc: any = s.location as any;
        const lat = loc?.latitude ?? loc?.lat ?? null;
        const lon = loc?.longitude ?? loc?.lon ?? loc?.lng ?? null;
        if (typeof lat !== 'number' || typeof lon !== 'number') return null;
        return { id: s.id, name: s.name, coords: [lat, lon] as [number, number] };
      })
      .filter(Boolean) as Array<{ id: string; name: string; coords: [number, number] }>;
  }, [shops]);

  if (!hasKey) {
    return (
      <div className={className}>
        <div className="h-[50vh] rounded-lg border bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-6 text-center">
          <div className="space-y-2">
            <p className="text-sm text-neutral-700 dark:text-neutral-200">
              Карта недоступна: не задан <code>VITE_YANDEX_MAPS_API_KEY</code>
            </p>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Добавьте ключ в <code>.env</code> и перезапустите dev-сервер.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <YMaps query={{ apikey: apiKey, lang: 'ru_RU' }}>
        <Map
          width="100%"
          height="50vh"
          defaultState={{ center: defaultCenter, zoom: defaultZoom }}
          options={{ suppressMapOpenBlock: true }}
          onBoundsChange={(e: any) => {
            if (!onBoundsChange) return;
            const nextBounds = toBounds(e?.get?.('newBounds'));
            if (!nextBounds) return;
            // Debounce bounds updates to avoid spamming the backend while panning/zooming.
            if (boundsDebounceRef.current) window.clearTimeout(boundsDebounceRef.current);
            boundsDebounceRef.current = window.setTimeout(() => onBoundsChange(nextBounds), 350);
          }}
        >
          {points.map((p) => (
            <Placemark
              key={p.id}
              geometry={p.coords}
              properties={{ hintContent: p.name }}
              options={{ preset: 'islands#coffeeShopIcon' }}
              onClick={() => onShopSelect(p.id)}
            />
          ))}
        </Map>
      </YMaps>
    </div>
  );
}









