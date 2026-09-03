import React from 'react';
import { Review } from '../../api/coffeeshop';
import { PublicUserProfile } from '../../api/user';
import { ReviewCardSkeleton } from '../skeletons';
import { useTheme } from '../../contexts/ThemeContext';
import { getThemeClasses } from '../../utils/theme';
import { AppUser } from '../../contexts/UserContext';
import { StarIcon } from '../icons';
import Mascot from '../Mascot';

interface ReviewsSectionProps {
  reviews: Review[];
  usersCache: Map<string, PublicUserProfile>;
  isLoading: boolean;
  myReviewId: string | null;
  isCheckingMyReview: boolean;
  onWriteOrEditReview: () => void;
  onUserSelect?: (userId: string) => void;
  user: AppUser | null;
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 sm:mb-8">
        <h2 className={`text-xl sm:text-2xl font-extended font-bold ${textMain} flex items-center gap-3 min-w-0`}>
          <span className={`w-1.5 h-8 ${themeClasses.primary.bg} rounded-full shrink-0`} />
          Отзывы клиентов
        </h2>
        {user && (
          <button
            onClick={onWriteOrEditReview}
            disabled={isCheckingMyReview}
            className={`shrink-0 ${themeClasses.primary.bgLight} ${themeClasses.primary.text} font-bold px-4 sm:px-6 py-2.5 rounded-xl ${themeClasses.primary.bg.replace('bg-', 'hover:bg-')} ${themeClasses.text.inverse.replace('text-', 'hover:text-')} transition-all disabled:opacity-60 disabled:cursor-not-allowed`}
            style={{ padding: '10px 16px' }}
          >
            {myReviewId ? 'Изменить' : 'Написать'}
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
                        <StarIcon key={star} filled={star <= avgReviewRating} size={20} />
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
        <div className="text-center py-8 flex flex-col items-center">
          <Mascot pose="book" size={120} />
          <p className={`${textMuted} mt-3`}>Пока нет отзывов</p>
        </div>
      )}
    </div>
  );
};

