import React from 'react';
import { Review } from '../../api/coffeeshop';
import { PublicUserProfile } from '../../api/user';
import { ReviewCardSkeleton } from '../skeletons';
import { useTheme } from '../../contexts/ThemeContext';
import { getThemeClasses } from '../../utils/theme';

interface ReviewsSectionProps {
  reviews: Review[];
  usersCache: Map<string, PublicUserProfile>;
  isLoading: boolean;
  myReviewId: string | null;
  isCheckingMyReview: boolean;
  onWriteOrEditReview: () => void;
  onUserSelect?: (userId: string) => void;
  user: any;
  textMain: string;
  textMuted: string;
  cardBg: string;
  borderColor: string;
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({
  reviews,
  usersCache,
  isLoading,
  myReviewId,
  isCheckingMyReview,
  onWriteOrEditReview,
  onUserSelect,
  user,
  textMain,
  textMuted,
  cardBg,
  borderColor,
}) => {
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  const handleNavigateToUserProfile = (userId: string) => {
    if (onUserSelect) {
      onUserSelect(userId);
    }
  };

  return (
    <div className="pt-8 border-t border-[#E8E4E1]">
      <div className="flex items-center justify-between mb-8">
        <h2 className={`text-2xl font-display font-bold ${textMain} flex items-center gap-3`}>
          <span className={`w-1.5 h-8 ${themeClasses.primary.bg} rounded-full`} />
          Отзывы клиентов
        </h2>
        {user && (
          <button
            onClick={onWriteOrEditReview}
            disabled={isCheckingMyReview}
            className={`${themeClasses.primary.bgLight} ${themeClasses.primary.text} font-bold px-6 py-2.5 rounded-xl ${themeClasses.primary.bg.replace('bg-', 'hover:bg-')} ${themeClasses.text.inverse.replace('text-', 'hover:text-')} transition-all disabled:opacity-60 disabled:cursor-not-allowed`}
          >
            {myReviewId ? 'Изменить отзыв' : 'Написать отзыв'}
          </button>
        )}
      </div>

      {isLoading ? (
        <ReviewCardSkeleton count={3} />
      ) : reviews.length > 0 ? (
        <div className="space-y-6">
          {reviews.map((review) => {
            const userProfile = usersCache.get(review.userId);
            const displayName = userProfile?.userName || 'Анонимный пользователь';
            const avatarUrl = userProfile?.avatarUrl;
            const reviewDate = new Date(review.createdAt);
            const formattedDate = reviewDate.toLocaleDateString('ru-RU', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
            const avgReviewRating = (review.ratingCoffee + review.ratingService + review.ratingPlace) / 3;

            return (
              <div key={review.id} className={`${cardBg} p-8 rounded-3xl border ${borderColor} hover:shadow-lg transition-all`}>
                <div className="flex justify-between items-start mb-4">
                  <button
                    onClick={() => handleNavigateToUserProfile(review.userId)}
                    className="flex items-center gap-4 hover:opacity-80 transition-opacity"
                  >
                    <div className={`w-12 h-12 rounded-full border-2 ${themeClasses.primary.borderLighter} overflow-hidden`}>
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                      ) : (
                        <div className={`w-full h-full ${cardBg} flex items-center justify-center font-bold ${textMain}`}>
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="text-left">
                      <h4 className={`font-bold ${textMain}`}>{displayName}</h4>
                      <p className={`text-xs ${textMuted} font-medium uppercase tracking-widest`}>
                        {formattedDate}
                      </p>
                    </div>
                  </button>
                  <div className="flex items-center gap-2">
                    <div className={`flex ${themeClasses.primary.text}`}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span key={star} className={`material-symbols-outlined ${star <= avgReviewRating ? 'fill-1' : ''}`}>
                          star
                        </span>
                      ))}
                    </div>
                    <span className={`text-lg font-bold ${textMain}`}>
                      {avgReviewRating.toFixed(1)}
                    </span>
                  </div>
                </div>
                {review.header && (
                  <h5 className={`font-bold ${textMain} mb-2`}>{review.header}</h5>
                )}
                <p className={`${textMuted} leading-loose italic`}>"{review.comment}"</p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className={textMuted}>Пока нет отзывов</p>
        </div>
      )}
    </div>
  );
};

