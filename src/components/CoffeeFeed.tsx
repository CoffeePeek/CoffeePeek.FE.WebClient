import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { coffeeshopApi, internalApi } from '../api';
import type { BrewMethodDto, CityDto, EquipmentDto, RoasterDto, ShopDto, ShortShopDto } from '../api/types';
import { Heart, MapPin, Search, SlidersHorizontal, Star, X } from 'lucide-react';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';
import { mockCoffeeShops } from '../data/mockData';
import { copyToClipboard } from '../shared/lib/clipboard';
import { toast } from 'sonner@2.0.3';
import { Input } from './ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { ScrollArea } from './ui/scroll-area';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useSearchParams } from 'react-router-dom';
import { useFavorites } from '../contexts/FavoritesContext';

type CoffeeFeedProps = {
  onShopSelect: (shopId: string) => void;
};

const normalizePriceRange = (value: string): number => Math.min(value.length || 1, 4);

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
    equipments: shop.equipment.map((name) => ({ name })),
    priceRange: normalizePriceRange(shop.priceRange),
  }));

const parseCsv = (value: string | null): string[] =>
  value
    ? value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

const toCsv = (arr: string[]): string => arr.join(',');

export function CoffeeFeed({ onShopSelect }: CoffeeFeedProps) {
  const fallbackShops = useMemo(() => normalizeMockShops(), []);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const { isFavorite, toggleFavorite, isPending } = useFavorites();

  const [searchParams, setSearchParams] = useSearchParams();
  const qParam = searchParams.get('q') ?? '';
  const cityIdParam = searchParams.get('cityId') ?? '';
  const equipmentIdsParam = parseCsv(searchParams.get('equipmentIds'));
  const roasterIdsParam = parseCsv(searchParams.get('roasterIds'));
  const brewMethodIdsParam = parseCsv(searchParams.get('brewMethodIds'));

  const [qDraft, setQDraft] = useState(qParam);
  useEffect(() => setQDraft(qParam), [qParam]);
  useEffect(() => {
    const t = setTimeout(() => {
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (qDraft.trim()) next.set('q', qDraft.trim());
        else next.delete('q');
        return next;
      });
    }, 300);
    return () => clearTimeout(t);
  }, [qDraft, setSearchParams]);

  const { data: citiesResponse } = useQuery({
    queryKey: ['cities'],
    queryFn: () => internalApi.getCities(),
    staleTime: 10 * 60 * 1000,
  });

  const { data: equipmentsResponse } = useQuery({
    queryKey: ['equipments'],
    queryFn: () => internalApi.getEquipments(),
    staleTime: 10 * 60 * 1000,
  });

  const { data: roastersResponse } = useQuery({
    queryKey: ['roasters'],
    queryFn: () => internalApi.getRoasters(),
    staleTime: 10 * 60 * 1000,
  });

  const { data: brewMethodsResponse } = useQuery({
    queryKey: ['brewMethods'],
    queryFn: () => internalApi.getBrewMethods(),
    staleTime: 10 * 60 * 1000,
  });

  const cities: CityDto[] = citiesResponse?.data?.cities ?? [];
  const equipments: EquipmentDto[] = equipmentsResponse?.data?.equipments ?? [];
  const roasters: RoasterDto[] = roastersResponse?.data?.roasters ?? [];
  const brewMethods: BrewMethodDto[] = brewMethodsResponse?.data?.brewMethods ?? [];

  const hasServerFilters = Boolean(qParam.trim() || cityIdParam || equipmentIdsParam.length > 0);

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ['coffee-shops', { q: qParam, cityId: cityIdParam, equipmentIds: equipmentIdsParam }],
    queryFn: () => {
      if (hasServerFilters) {
        return coffeeshopApi.searchCoffeeShops({
          q: qParam.trim() || undefined,
          cityId: cityIdParam || undefined,
          equipments: equipmentIdsParam.length > 0 ? equipmentIdsParam : undefined,
          pageNumber: 1,
          pageSize: 20,
        });
      }
      return coffeeshopApi.getCoffeeShops({
        cityId: cityIdParam || undefined,
        pageNumber: 1,
        pageSize: 20,
      });
    },
    staleTime: 120 * 1000,
    retry: 2,
  });

  const apiShops = data?.data?.content ?? [];
  const shops = apiShops.length > 0 ? apiShops : fallbackShops;
  const hasApiError = Boolean(error) || data?.isSuccess === false;
  const errorText =
    error instanceof Error
      ? error.message
      : data?.message || 'Не удалось обновить список. Показываем сохраненные данные.';

  const filteredShops: ShortShopDto[] = useMemo(() => {
    return shops.filter((shop) => {
      if (equipmentIdsParam.length > 0) {
        const equipmentIds = (shop.equipments ?? []).map((r) => r.id).filter(Boolean);
        if (!equipmentIdsParam.every((id) => equipmentIds.includes(id))) return false;
      }

      if (roasterIdsParam.length > 0) {
        const roasterIds = (shop.roasters ?? []).map((r) => r.id).filter(Boolean);
        if (!roasterIdsParam.every((id) => roasterIds.includes(id))) return false;
      }

      if (brewMethodIdsParam.length > 0) {
        const brewIds = (shop as any).brewMethods
          ? (shop as any).brewMethods.map((b: any) => b.id).filter(Boolean)
          : [];
        if (!brewMethodIdsParam.every((id) => brewIds.includes(id))) return false;
      }

      return true;
    });
  }, [brewMethodIdsParam, equipmentIdsParam, roasterIdsParam, shops]);

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="mb-6">
          <h1 className="text-neutral-900 dark:text-neutral-50 mb-1">Спешелти кофейни</h1>
          <p className="text-neutral-600 dark:text-neutral-400 text-sm">
            Откройте лучшие места для кофе рядом
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Card key={idx} className="overflow-hidden dark:bg-neutral-900 dark:border-neutral-800">
              <Skeleton className="w-full aspect-square" />
              <CardContent className="p-3 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const activeFiltersCount =
    (qParam.trim() ? 1 : 0) +
    (cityIdParam ? 1 : 0) +
    equipmentIdsParam.length +
    roasterIdsParam.length +
    brewMethodIdsParam.length;

  return (
    <div className="p-4">
      <div className="mb-6 space-y-2">
        <div>
          <h1 className="text-neutral-900 dark:text-neutral-50 mb-1">Спешелти кофейни</h1>
          <p className="text-neutral-600 dark:text-neutral-400 text-sm">
            Откройте лучшие места для кофе рядом
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-neutral-400" />
            <Input
              value={qDraft}
              onChange={(e) => setQDraft(e.target.value)}
              placeholder="Поиск по названию…"
              className="pl-9"
            />
            {qDraft && (
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                onClick={() => setQDraft('')}
                aria-label="Очистить поиск"
              >
                <X className="size-4" />
              </button>
            )}
          </div>

          <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="gap-2">
                <SlidersHorizontal className="size-4" />
                Фильтры
                {activeFiltersCount > 0 && <Badge className="ml-1">{activeFiltersCount}</Badge>}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[92svh] rounded-t-2xl overflow-hidden">
              <div className="mx-auto mt-2 h-1.5 w-12 rounded-full bg-neutral-200 dark:bg-neutral-800" />
              <SheetHeader className="pb-2">
                <SheetTitle>Фильтры</SheetTitle>
              </SheetHeader>

              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 pb-28 space-y-6">
                <div className="space-y-2">
                  <Label>Город</Label>
                  <Select
                    value={cityIdParam || 'all'}
                    onValueChange={(value) => {
                      setSearchParams((prev) => {
                        const next = new URLSearchParams(prev);
                        if (value === 'all') next.delete('cityId');
                        else next.set('cityId', value);
                        return next;
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите город" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все города</SelectItem>
                      {cities.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Оборудование</Label>
                  <div className="rounded-md border p-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                      {equipments.map((e) => {
                        const checked = equipmentIdsParam.includes(e.id ?? '');
                        const id = e.id ?? '';
                        if (!id) return null;
                        return (
                          <button
                            key={id}
                            type="button"
                            className="flex items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-neutral-50 dark:hover:bg-neutral-900/40 active:bg-neutral-100 dark:active:bg-neutral-900/60"
                            onClick={() => {
                              setSearchParams((prev) => {
                                const next = new URLSearchParams(prev);
                                const current = new Set(parseCsv(next.get('equipmentIds')));
                                if (!checked) current.add(id);
                                else current.delete(id);
                                const arr = Array.from(current);
                                if (arr.length) next.set('equipmentIds', toCsv(arr));
                                else next.delete('equipmentIds');
                                return next;
                              });
                            }}
                          >
                            <Checkbox
                              className="size-5"
                              checked={checked}
                              onClick={(ev) => ev.stopPropagation()}
                              onCheckedChange={(v) => {
                                setSearchParams((prev) => {
                                  const next = new URLSearchParams(prev);
                                  const current = new Set(parseCsv(next.get('equipmentIds')));
                                  if (v) current.add(id);
                                  else current.delete(id);
                                  const arr = Array.from(current);
                                  if (arr.length) next.set('equipmentIds', toCsv(arr));
                                  else next.delete('equipmentIds');
                                  return next;
                                });
                              }}
                            />
                            <span className="text-sm leading-5">{e.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Обжарщик</Label>
                  <div className="rounded-md border p-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                      {roasters.map((r) => {
                        const checked = roasterIdsParam.includes(r.id ?? '');
                        const id = r.id ?? '';
                        if (!id) return null;
                        return (
                          <button
                            key={id}
                            type="button"
                            className="flex items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-neutral-50 dark:hover:bg-neutral-900/40 active:bg-neutral-100 dark:active:bg-neutral-900/60"
                            onClick={() => {
                              setSearchParams((prev) => {
                                const next = new URLSearchParams(prev);
                                const current = new Set(parseCsv(next.get('roasterIds')));
                                if (!checked) current.add(id);
                                else current.delete(id);
                                const arr = Array.from(current);
                                if (arr.length) next.set('roasterIds', toCsv(arr));
                                else next.delete('roasterIds');
                                return next;
                              });
                            }}
                          >
                            <Checkbox
                              className="size-5"
                              checked={checked}
                              onClick={(ev) => ev.stopPropagation()}
                              onCheckedChange={(v) => {
                                setSearchParams((prev) => {
                                  const next = new URLSearchParams(prev);
                                  const current = new Set(parseCsv(next.get('roasterIds')));
                                  if (v) current.add(id);
                                  else current.delete(id);
                                  const arr = Array.from(current);
                                  if (arr.length) next.set('roasterIds', toCsv(arr));
                                  else next.delete('roasterIds');
                                  return next;
                                });
                              }}
                            />
                            <span className="text-sm leading-5">{r.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Способ приготовления</Label>
                  <div className="rounded-md border p-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                      {brewMethods.map((b) => {
                        const checked = brewMethodIdsParam.includes(b.id ?? '');
                        const id = b.id ?? '';
                        if (!id) return null;
                        return (
                          <button
                            key={id}
                            type="button"
                            className="flex items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-neutral-50 dark:hover:bg-neutral-900/40 active:bg-neutral-100 dark:active:bg-neutral-900/60"
                            onClick={() => {
                              setSearchParams((prev) => {
                                const next = new URLSearchParams(prev);
                                const current = new Set(parseCsv(next.get('brewMethodIds')));
                                if (!checked) current.add(id);
                                else current.delete(id);
                                const arr = Array.from(current);
                                if (arr.length) next.set('brewMethodIds', toCsv(arr));
                                else next.delete('brewMethodIds');
                                return next;
                              });
                            }}
                          >
                            <Checkbox
                              className="size-5"
                              checked={checked}
                              onClick={(ev) => ev.stopPropagation()}
                              onCheckedChange={(v) => {
                                setSearchParams((prev) => {
                                  const next = new URLSearchParams(prev);
                                  const current = new Set(parseCsv(next.get('brewMethodIds')));
                                  if (v) current.add(id);
                                  else current.delete(id);
                                  const arr = Array.from(current);
                                  if (arr.length) next.set('brewMethodIds', toCsv(arr));
                                  else next.delete('brewMethodIds');
                                  return next;
                                });
                              }}
                            />
                            <span className="text-sm leading-5">{b.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 border-t bg-background px-4 py-3 pb-[calc(env(safe-area-inset-bottom,0px)+12px)]">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 h-12"
                    onClick={() => {
                      setQDraft('');
                      setSearchParams(new URLSearchParams());
                      setIsFiltersOpen(false);
                    }}
                  >
                    Сбросить
                  </Button>
                  <Button
                    className="flex-1 h-12"
                    onClick={() => {
                      refetch();
                      setIsFiltersOpen(false);
                    }}
                  >
                    Применить
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {hasApiError && (
          <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30">
            <AlertDescription className="text-sm text-amber-800 dark:text-amber-300 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <span>{errorText}</span>
                <Button size="sm" variant="outline" onClick={() => refetch()}>
                  Обновить
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    try {
                      await copyToClipboard(errorText);
                      toast.success('Текст ошибки скопирован');
                    } catch {
                      toast.error('Не удалось скопировать');
                    }
                  }}
                >
                  Скопировать ошибку
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredShops.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-neutral-500 dark:text-neutral-400">
              Кофейни не найдены по заданным фильтрам.
            </p>
            <div className="mt-4">
              <Button variant="outline" onClick={() => setSearchParams(new URLSearchParams())}>
                Сбросить фильтры
              </Button>
            </div>
          </div>
        ) : (
          filteredShops.map((shop) => (
            <Card
              key={shop.id}
              className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow dark:bg-neutral-900 dark:border-neutral-800"
              onClick={() => onShopSelect(shop.id)}
            >
              <div className="relative w-full aspect-square bg-neutral-100">
                <img
                  src={
                    shop.imageUrls && shop.imageUrls.length > 0
                      ? shop.imageUrls[0]
                      : 'https://via.placeholder.com/400'
                  }
                  alt={shop.name}
                  className="w-full h-full object-cover"
                />
                <button
                  className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full p-1.5 shadow-md hover:bg-white transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(shop.id);
                  }}
                  disabled={isPending(shop.id)}
                  aria-label={isFavorite(shop.id) ? 'Убрать из избранного' : 'Добавить в избранное'}
                >
                  <Heart
                    className={`size-4 ${
                      isFavorite(shop.id)
                        ? 'fill-amber-600 text-amber-600'
                        : 'text-neutral-700'
                    }`}
                  />
                </button>
                {shop.isOpen && (
                  <Badge className="absolute top-2 left-2 bg-green-600 hover:bg-green-600 text-white border-0">
                    Открыто
                  </Badge>
                )}
                {isFetching && (
                  <Badge className="absolute bottom-2 right-2 bg-white text-neutral-700 border-neutral-200">
                    Обновление...
                  </Badge>
                )}
              </div>

              <CardContent className="p-3">
                <h3 className="text-neutral-900 dark:text-neutral-50 mb-1 truncate">{shop.name}</h3>

                <div className="flex items-center gap-1 mb-2">
                  <Star className="size-3 fill-amber-500 text-amber-500" />
                  <span className="text-sm text-neutral-900 dark:text-neutral-50">
                    {shop.rating?.toFixed ? shop.rating.toFixed(1) : shop.rating}
                  </span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">({shop.reviewCount})</span>
                </div>

                <div className="flex items-start gap-1 mb-3">
                  <MapPin className="size-3 text-neutral-500 dark:text-neutral-400 mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2">
                    {shop.location.address}
                  </span>
                </div>

                {shop.equipments && shop.equipments.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {shop.equipments.slice(0, 2).map((equipment, index) => (
                      <Badge key={index} variant="secondary" className="text-xs px-1.5 py-0">
                        {equipment.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}