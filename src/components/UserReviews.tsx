import { mockReviews } from '../data/mockData';
import { Star, MapPin, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';

type UserReviewsProps = {
  onBack: () => void;
};

export function UserReviews({ onBack }: UserReviewsProps) {
  const userReviews = mockReviews.filter(r => r.userName === 'Алексей Петров');

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
      </div>

      <div className="space-y-4">
        {userReviews.map((review) => (
          <Card key={review.id} className="dark:bg-neutral-900 dark:border-neutral-800">
            <CardContent className="p-4">
              <div className="flex items-start gap-3 mb-3">
                <Avatar className="size-10">
                  <AvatarFallback className="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-400">
                    АП
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-neutral-900 dark:text-neutral-50">Вы</span>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400">{review.date}</span>
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`size-3 ${
                          i < review.rating
                            ? 'fill-amber-500 text-amber-500'
                            : 'text-neutral-300 dark:text-neutral-600'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <div className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                  <MapPin className="size-4" />
                  <span>Кофейня ID: {review.coffeeShopId}</span>
                </div>
              </div>

              <p className="text-neutral-700 dark:text-neutral-300">{review.comment}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
