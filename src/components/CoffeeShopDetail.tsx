import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { coffeeshopApi, reviewApi } from '../api';
import type { ShopDto, CoffeeShopReviewDto } from '../api/types';
import { ArrowLeft, Star, MapPin, Coffee, Settings, Heart, Share2 } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Separator } from './ui/separator';
import { Alert, AlertDescription } from './ui/alert';
import { useAuth } from '../contexts/AuthContext';
import { mockCoffeeShops, mockReviews } from '../data/mockData';
import { Skeleton } from './ui/skeleton';
import { toast } from 'sonner@2.0.3';
import { copyToClipboard } from '../shared/lib/clipboard';
import { toErrorMessage } from '../shared/lib/errors';

type CoffeeShopDetailProps = {
  shopId: string;
  onBack: () => void;
};

const normalizeMockShop = (id: string): ShopDto | null => {
  const fallback = mockCoffeeShops.find((shop) => shop.id === id);
  if (!fallback) return null;

  return {
    id: fallback.id,
    name: fallback.name,
    description: fallback.description,
    rating: fallback.rating,
    reviewCount: fallback.reviewCount,
    location: {
      address: fallback.location.address,
      latitude: fallback.location.lat,
      longitude: fallback.location.lng,
    },
    isOpen: fallback.isOpen,
    imageUrls: [fallback.image],
    beans: fallback.beans.map((name) => ({ name })),
    roasters: fallback.roasters.map((name) => ({ name })),
    equipments: fallback.equipment.map((name) => ({ name })),
    priceRange: 2,
  };
};

const normalizeMockReviews = (shopId: string): CoffeeShopReviewDto[] =>
  mockReviews
    .filter((review) => review.coffeeShopId === shopId)
    .map((review) => ({
      id: Number(review.id),
      shopId: Number(review.coffeeShopId),
      userId: 0,
      header: review.comment.slice(0, 32) || 'Отзыв',
      comment: review.comment,
      ratingCoffee: review.rating,
      ratingService: review.rating,
      ratingPlace: review.rating,
      createdAt: new Date().toISOString(),
      shopName: '',
    }));

export function CoffeeShopDetail({ shopId, onBack }: CoffeeShopDetailProps) {
  const { user } = useAuth();

  const {
    data: shopResponse,
    isLoading: isShopLoading,
    error: shopError,
    isFetching: isShopFetching,
  } = useQuery({
    queryKey: ['shop', shopId],
    queryFn: () => coffeeshopApi.getCoffeeShop(shopId),
    retry: 2,
  });

  const {
    data: reviewsResponse,
    isLoading: isReviewsLoading,
    error: reviewsError,
  } = useQuery({
    queryKey: ['shop-reviews', shopId],
    queryFn: () => reviewApi.getAllReviews(),
    select: (data) => data.data?.reviews ?? [],
    retry: 1,
  });

  const shop: ShopDto | null = shopResponse?.data?.shop ?? normalizeMockShop(shopId);
  const reviews: CoffeeShopReviewDto[] = useMemo(() => {
    // If API call succeeded (even if empty), use it. Only fallback to mock when API failed entirely.
    if (reviewsResponse !== undefined) {
      return reviewsResponse.filter((r) => r.shopId.toString() === shopId);
    }
    return normalizeMockReviews(shopId);
  }, [reviewsResponse, shopId]);

  const hasError = Boolean(shopError || reviewsError || shopResponse?.isSuccess === false);
  const errorText = toErrorMessage(shopError || reviewsError) || shopResponse?.message || '';

  if (isShopLoading || isReviewsLoading) {
    return (
      <div className="bg-white min-h-screen pb-20">
        <div className="relative">
          <Skeleton className="w-full h-64" />
          <div className="absolute top-4 left-4">
            <Skeleton className="h-10 w-10 rounded-full" />
          </div>
        </div>

        <div className="px-4 py-4 space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>

          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>

          <div className="space-y-3">
            <Skeleton className="h-5 w-1/3" />
            <div className="grid grid-cols-2 gap-2">
              {Array.from({ length: 6 }).map((_, idx) => (
                <Skeleton key={idx} className="h-10 w-full rounded-lg" />
              ))}
            </div>
          </div>

          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="bg-white min-h-screen pb-20">
        <div className="p-4">
          <Button onClick={onBack} variant="ghost" className="mb-4">
            <ArrowLeft className="size-4 mr-2" />
            Назад
          </Button>
          <Alert className="bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30">
            <AlertDescription className="text-sm text-red-700 dark:text-red-400">
              Кофейня не найдена
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen pb-20">
      <div className="relative">
        <img
          src={shop.imageUrls && shop.imageUrls.length > 0 ? shop.imageUrls[0] : 'https://via.placeholder.com/400'}
          alt={shop.name}
          className="w-full h-64 object-cover"
        />
        <button
          onClick={onBack}
          className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg"
        >
          <ArrowLeft className="size-5 text-neutral-900" />
        </button>
        <div className="absolute top-4 right-4 flex gap-2">
          <button className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
            <Heart className="size-5 text-neutral-900" />
          </button>
          <button className="bg-white/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
            <Share2 className="size-5 text-neutral-900" />
          </button>
        </div>
        {isShopFetching && (
          <Badge className="absolute bottom-3 right-4 bg-white text-neutral-700 border-neutral-200">Обновляем</Badge>
        )}
      </div>

      <div className="px-4 py-4">
        {hasError && (
          <Alert className="mb-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30">
            <AlertDescription className="text-sm text-amber-800 dark:text-amber-300 space-y-3">
              <div>
                {shopError instanceof Error
                  ? shopError.message
                  : shopResponse?.message || 'Не удалось обновить данные кофейни.'}
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

        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="text-neutral-900 mb-1">{shop.name}</h1>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star className="size-4 fill-amber-500 text-amber-500" />
                <span className="text-neutral-900">{shop.rating.toFixed(1)}</span>
              </div>
              <span className="text-neutral-500 text-sm">({shop.reviewCount} отзывов)</span>
            </div>
          </div>
          {shop.isOpen && (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Открыто сейчас
            </Badge>
          )}
        </div>

        <div className="flex items-start gap-2 text-neutral-600 mb-4">
          <MapPin className="size-4 mt-0.5 flex-shrink-0" />
          <span className="text-sm">{shop.location.address}</span>
        </div>

        <p className="text-neutral-700 mb-6">{shop.description}</p>

        {(shop.beans && shop.beans.length > 0) || (shop.roasters && shop.roasters.length > 0) ? (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Coffee className="size-5 text-amber-700" />
              <h2 className="text-neutral-900">Зерно и обжарка</h2>
            </div>
            <div className="space-y-2">
              {shop.beans && shop.beans.length > 0 && (
                <div>
                  <span className="text-sm text-neutral-500">Используемое зерно:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {shop.beans.map((bean, index) => (
                      <Badge key={index} variant="secondary">
                        {bean.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              {shop.roasters && shop.roasters.length > 0 && (
                <div>
                  <span className="text-sm text-neutral-500">Обжарщики:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {shop.roasters.map((roaster, index) => (
                      <Badge key={index} variant="outline" className="bg-amber-50 text-amber-800 border-amber-200">
                        {roaster.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {shop.equipments && shop.equipments.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Settings className="size-5 text-amber-700" />
              <h2 className="text-neutral-900">Оборудование</h2>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {shop.equipments.map((equipment, index) => (
                <div key={index} className="px-3 py-2 bg-neutral-50 rounded-lg text-sm text-neutral-700">
                  {equipment.name}
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator className="my-6" />

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-neutral-900">Отзывы</h2>
            <Button size="sm" variant="outline">
              Написать отзыв
            </Button>
          </div>

          <div className="space-y-4">
            {reviews.length === 0 ? (
              <p className="text-sm text-neutral-500">Пока нет отзывов</p>
            ) : (
              reviews.map((review) => {
                const avgRating = (review.ratingCoffee + review.ratingService + review.ratingPlace) / 3;
                const date = new Date(review.createdAt);
                const formattedDate = date.toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                });

                return (
                  <div key={review.id} className="pb-4 border-b border-neutral-100 last:border-0">
                    <div className="flex items-start gap-3">
                      <Avatar className="size-10">
                        <AvatarFallback className="bg-amber-100 text-amber-800">
                          {review.shopName?.[0] || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-neutral-900">{review.header}</span>
                          <span className="text-xs text-neutral-500">{formattedDate}</span>
                        </div>
                        <div className="flex items-center gap-1 mb-2">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`size-3 ${
                                i < Math.round(avgRating)
                                  ? 'fill-amber-500 text-amber-500'
                                  : 'text-neutral-300'
                              }`}
                            />
                          ))}
                          <span className="text-xs text-neutral-500 ml-1">{avgRating.toFixed(1)}</span>
                        </div>
                        <p className="text-sm text-neutral-700">{review.comment}</p>
                        <div className="flex gap-4 mt-2 text-xs text-neutral-500">
                          <span>Кофе: {review.ratingCoffee}/5</span>
                          <span>Сервис: {review.ratingService}/5</span>
                          <span>Место: {review.ratingPlace}/5</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="mt-6">
          <Button className="w-full bg-amber-700 hover:bg-amber-800">
            Добавить чекин в журнал {user?.name ? `как ${user.name}` : ''}
          </Button>
        </div>
      </div>
    </div>
  );
}
