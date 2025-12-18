import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reviewApi } from '../api';
import { useAuth } from '../contexts/AuthContext';
import { toErrorMessage } from '../shared/lib/errors';
import { Star, MapPin, ArrowLeft, MessageSquare } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';

type UserReviewsProps = {
  onBack: () => void;
};

export function UserReviews({ onBack }: UserReviewsProps) {
  const { user } = useAuth();

  const initials = useMemo(() => {
    const name = user?.name?.trim();
    if (name) {
      const parts = name.split(/\s+/).filter(Boolean);
      return parts.slice(0, 2).map((n) => n[0]?.toUpperCase()).join('') || 'U';
    }
    const email = user?.email?.trim();
    if (email) return email[0]?.toUpperCase() || 'U';
    return 'U';
  }, [user?.email, user?.name]);

  const {
    data: reviewsResponse,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ['my-reviews'],
    queryFn: () => reviewApi.getAllReviews(),
    staleTime: 60 * 1000,
    retry: 1,
  });

  const reviews = reviewsResponse?.data?.reviews ?? [];

  return (
    <div className="p-4">
      {/* Header with Back Button */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-full transition-colors"
        >
          <ArrowLeft className="size-5 text-neutral-700 dark:text-neutral-300" />
        </button>
        <div className="flex-1">
          <h1 className="text-neutral-900 dark:text-neutral-50">Мои отзывы</h1>
          <p className="text-neutral-600 dark:text-neutral-400 text-sm">
            Ваши оценки и комментарии о кофейнях
          </p>
        </div>
        {isFetching && (
          <span className="text-xs text-neutral-500 dark:text-neutral-400">Обновление…</span>
        )}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-300 flex items-center justify-between gap-3">
          <span>{toErrorMessage(error) || 'Не удалось загрузить отзывы'}</span>
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            Повторить
          </Button>
        </div>
      )}

      <div className="space-y-4">
        {isLoading ? (
          <>
            {Array.from({ length: 3 }).map((_, idx) => (
              <Card key={idx} className="dark:bg-neutral-900 dark:border-neutral-800">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="size-10 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-3 w-40" />
                    </div>
                  </div>
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-12 w-full" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="size-12 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
            <p className="text-neutral-600 dark:text-neutral-300">Пока нет отзывов</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Оставьте отзыв о кофейне — он появится здесь.
            </p>
            <div className="mt-4">
              <Button variant="outline" onClick={() => refetch()}>
                Обновить
              </Button>
            </div>
          </div>
        ) : (
          reviews.map((review) => {
            const avg = (review.ratingCoffee + review.ratingService + review.ratingPlace) / 3;
            const stars = Math.round(avg);
            const dateText = (() => {
              const d = new Date(review.createdAt);
              if (Number.isNaN(d.getTime())) return '';
              return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' });
            })();

            return (
              <Card key={review.id} className="dark:bg-neutral-900 dark:border-neutral-800">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <Avatar className="size-10">
                      <AvatarFallback className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-neutral-900 dark:text-neutral-50">Вы</span>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">{dateText}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`size-3 ${
                                i < stars
                                  ? 'fill-amber-500 text-amber-500'
                                  : 'text-neutral-300 dark:text-neutral-600'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-neutral-500 dark:text-neutral-400">
                          {avg.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-2">
                    <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                      <MapPin className="size-4" />
                      <span className="truncate">{review.shopName || `Кофейня #${review.shopId}`}</span>
                    </div>
                  </div>

                  {review.header && (
                    <p className="text-neutral-900 dark:text-neutral-50 mb-1">{review.header}</p>
                  )}
                  <p className="text-neutral-700 dark:text-neutral-300 whitespace-pre-line">{review.comment}</p>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
