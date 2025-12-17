import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { coffeeshopApi } from '../api';
import type { ShortShopDto } from '../api/types';
import { Heart, MapPin, Star } from 'lucide-react';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { mockCoffeeShops } from '../data/mockData';

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

export function CoffeeFeed({ onShopSelect }: CoffeeFeedProps) {
  const fallbackShops = useMemo(() => normalizeMockShops(), []);

  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ['coffee-shops'],
    queryFn: () =>
      coffeeshopApi.getCoffeeShops({
        pageNumber: 1,
        pageSize: 20,
      }),
    staleTime: 120 * 1000,
    retry: 2,
  });

  const apiShops = data?.data?.content ?? [];
  const shops = apiShops.length > 0 ? apiShops : fallbackShops;
  const hasApiError = Boolean(error) || data?.isSuccess === false;

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="mb-6">
          <h1 className="text-neutral-900 dark:text-neutral-50 mb-1">Спешелти кофейни</h1>
          <p className="text-neutral-600 dark:text-neutral-400 text-sm">
            Откройте лучшие места для кофе рядом
          </p>
        </div>
        <div className="text-center py-12">
          <p className="text-neutral-500 dark:text-neutral-400">Синхронизируем данные...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-6 space-y-2">
        <div>
          <h1 className="text-neutral-900 dark:text-neutral-50 mb-1">Спешелти кофейни</h1>
          <p className="text-neutral-600 dark:text-neutral-400 text-sm">
            Откройте лучшие места для кофе рядом
          </p>
        </div>

        {hasApiError && (
          <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30">
            <AlertDescription className="flex items-center justify-between gap-3 text-sm text-amber-800 dark:text-amber-300">
              <span>
                {error instanceof Error
                  ? error.message
                  : data?.message || 'Не удалось обновить список. Показываем сохраненные данные.'}
              </span>
              <Button size="sm" variant="outline" onClick={() => refetch()}>
                Обновить
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {shops.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-neutral-500 dark:text-neutral-400">
              Кофейни не найдены. Попробуйте обновить позже.
            </p>
          </div>
        ) : (
          shops.map((shop) => (
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
                  }}
                >
                  <Heart className="size-4 text-neutral-700" />
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