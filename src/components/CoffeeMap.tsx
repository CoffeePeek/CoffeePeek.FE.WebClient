import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { coffeeshopApi, internalApi } from '../api';
import type { BrewMethodDto, ShortShopDto } from '../api/types';
import { MapPin, Star, Filter } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Checkbox } from './ui/checkbox';
import { ScrollArea } from './ui/scroll-area';
import { YandexCoffeeMap, type MapBounds } from './maps/YandexCoffeeMap';
import { mockCoffeeShops } from '../data/mockData';

type CoffeeMapProps = {
  onShopSelect: (shopId: string) => void;
};

export function CoffeeMap({ onShopSelect }: CoffeeMapProps) {
  const apiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY as string | undefined;
  const [searchParams, setSearchParams] = useSearchParams();
  const openOnlyParam = searchParams.get('openOnly') === '1';
  const brewMethodIdsParam = useMemo(() => {
    const raw = searchParams.get('brewMethodIds');
    return raw
      ? raw
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
  }, [searchParams]);

  const [bounds, setBounds] = useState<MapBounds | null>(null);

  const { data: brewMethodsResponse } = useQuery({
    queryKey: ['brewMethods'],
    queryFn: () => internalApi.getBrewMethods(),
    staleTime: 10 * 60 * 1000,
  });

  const brewMethods: BrewMethodDto[] = brewMethodsResponse?.data?.brewMethods ?? [];

  const { data: shopsResponse, isFetching, error } = useQuery({
    queryKey: ['map-shops', bounds],
    queryFn: () => {
      if (!bounds) {
        // initial lightweight fallback until the map reports bounds
        return coffeeshopApi.getCoffeeShops({ pageNumber: 1, pageSize: 20 });
      }
      return coffeeshopApi.getCoffeeShopsInBounds(bounds);
    },
    staleTime: 30 * 1000,
    retry: 2,
  });

  const normalizeMockShops = (): ShortShopDto[] =>
    mockCoffeeShops.map((shop) => ({
      id: shop.id,
      name: shop.name,
      imageUrls: [shop.image],
      rating: shop.rating,
      reviewCount: shop.reviewCount,
      location: {
        address: shop.location.address,
        latitude: shop.location.lat,
        longitude: shop.location.lng,
      },
      isOpen: shop.isOpen,
      // map screen doesn't need these precisely; keep minimal valid dto shape
      equipments: shop.equipment.map((name) => ({ name })),
      priceRange: 2,
    }));

  const apiShops = shopsResponse?.data?.content ?? [];
  const shops: ShortShopDto[] = apiShops.length > 0 ? apiShops : normalizeMockShops();

  const filteredShops: ShortShopDto[] = useMemo(() => {
    return shops.filter((shop) => {
      // Be tolerant to API variations: some map endpoints may omit `isOpen`.
      // If it's explicitly false -> filter out; if missing/true -> keep.
      if (openOnlyParam && shop.isOpen === false) return false;

      // Optional client-side brew-method filter only if API provides brewMethods in list/map response.
      if (brewMethodIdsParam.length > 0) {
        const ids: string[] =
          (shop as any)?.brewMethods?.map?.((b: any) => b?.id).filter(Boolean) ??
          [];
        if (ids.length > 0 && !brewMethodIdsParam.some((id) => ids.includes(id))) return false;
      }

      return true;
    });
  }, [brewMethodIdsParam, openOnlyParam, shops]);

  const activeFiltersCount = (openOnlyParam ? 1 : 0) + brewMethodIdsParam.length;

  const toggleBrewMethod = (id: string, checked: boolean) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      const current = new Set(brewMethodIdsParam);
      if (checked) current.add(id);
      else current.delete(id);
      const arr = Array.from(current);
      if (arr.length) next.set('brewMethodIds', arr.join(','));
      else next.delete('brewMethodIds');
      return next;
    });
  };

  const resetFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const defaultCenter: [number, number] = useMemo(() => {
    const firstWithCoords = shops.find(
      (s) => typeof s.location?.latitude === 'number' && typeof s.location?.longitude === 'number'
    );
    if (firstWithCoords?.location?.latitude && firstWithCoords?.location?.longitude) {
      return [firstWithCoords.location.latitude, firstWithCoords.location.longitude];
    }
    // Moscow as safe default
    return [55.751244, 37.618423];
  }, [shops]);

  return (
    <div className="relative">
      <div className="relative">
        <YandexCoffeeMap
          apiKey={apiKey}
          shops={filteredShops}
          defaultCenter={defaultCenter}
          onShopSelect={onShopSelect}
          onBoundsChange={setBounds}
        />

        {/* Filter Button */}
        <Sheet>
          <SheetTrigger asChild>
            <Button
              className="absolute top-4 right-4 bg-white text-neutral-900 shadow-lg hover:bg-neutral-50"
              size="sm"
            >
              <Filter className="size-4 mr-2" />
              Фильтры
              {activeFiltersCount > 0 && (
                <Badge className="ml-2 bg-amber-700 text-white">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[92svh] rounded-t-2xl overflow-hidden">
            <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-neutral-200 dark:bg-neutral-800" />
            <SheetHeader className="pb-2">
              <SheetTitle>Фильтры</SheetTitle>
            </SheetHeader>
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 pb-28 space-y-6">
              <div className="flex items-center justify-between">
                <Label htmlFor="open-only">Только открытые сейчас</Label>
                <Switch
                  id="open-only"
                  checked={openOnlyParam}
                  onCheckedChange={(v) => {
                    setSearchParams((prev) => {
                      const next = new URLSearchParams(prev);
                      if (v) next.set('openOnly', '1');
                      else next.delete('openOnly');
                      return next;
                    });
                  }}
                />
              </div>

              <div>
                <Label className="mb-3 block">Методы заваривания</Label>
                <div className="rounded-md border p-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                    {brewMethods.map((m) => {
                      const id = m.id ?? '';
                      if (!id) return null;
                      const checked = brewMethodIdsParam.includes(id);
                      return (
                        <button
                          key={id}
                          type="button"
                          className="flex items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-neutral-50 dark:hover:bg-neutral-900/40 active:bg-neutral-100 dark:active:bg-neutral-900/60"
                          onClick={() => toggleBrewMethod(id, !checked)}
                        >
                          <Checkbox
                            className="size-5"
                            checked={checked}
                            onClick={(ev) => ev.stopPropagation()}
                            onCheckedChange={(v) => toggleBrewMethod(id, Boolean(v))}
                          />
                          <span className="text-sm leading-5">{m.name}</span>
                        </button>
                      );
                    })}
                    {brewMethods.length === 0 && (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        Нет данных по методам приготовления (endpoint /api/internal/brew-methods).
                      </p>
                    )}
                  </div>
                </div>
              </div>

            </div>

            <div className="sticky bottom-0 border-t bg-background px-4 py-3 pb-[calc(env(safe-area-inset-bottom,0px)+12px)]">
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 h-12" onClick={resetFilters}>
                  Сбросить
                </Button>
                <Button className="flex-1 h-12" onClick={() => { /* UI-only filters; map/list update instantly */ }}>
                  Применить
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Shop List */}
      <div className="p-4">
        <h2 className="text-neutral-900 mb-3">
          Найдено кофеен: {filteredShops.length}
        </h2>

        {error && (
          <div className="mb-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            Не удалось загрузить кофейни для карты. Показываем сохраненные данные.
          </div>
        )}

        <div className="space-y-3">
          {filteredShops.length === 0 ? (
            <div className="bg-white rounded-lg p-4 shadow-sm border border-neutral-200">
              <p className="text-sm text-neutral-600">
                По выбранным фильтрам ничего не найдено.
              </p>
              <div className="mt-3">
                <Button variant="outline" size="sm" onClick={resetFilters}>
                  Сбросить фильтры
                </Button>
              </div>
            </div>
          ) : (
            filteredShops.map((shop) => (
              <div
                key={shop.id}
                onClick={() => onShopSelect(shop.id)}
                className="bg-white rounded-lg p-4 shadow-sm border border-neutral-200 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex gap-3">
                  <img
                    src={shop.imageUrls?.[0] ?? 'https://via.placeholder.com/160'}
                    alt={shop.name}
                    className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="text-neutral-900 truncate">{shop.name}</h3>
                      {shop.isOpen && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 ml-2 flex-shrink-0">
                          Открыто
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex items-center gap-1">
                        <Star className="size-3 fill-amber-500 text-amber-500" />
                        <span className="text-sm text-neutral-900">
                          {(Number(shop.rating) || 0).toFixed(1)}
                        </span>
                      </div>
                      <span className="text-xs text-neutral-500">({Number(shop.reviewCount) || 0})</span>
                      {isFetching && (
                        <Badge variant="outline" className="ml-auto">
                          Обновление…
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-start gap-1">
                      <MapPin className="size-3 text-neutral-500 mt-0.5 flex-shrink-0" />
                      <span className="text-xs text-neutral-600 truncate">
                        {shop.location?.address ?? 'Адрес не указан'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
