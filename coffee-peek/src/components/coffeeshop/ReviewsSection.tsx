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
  coffeeShopName: string;
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
  coffeeShopName,
}) => {
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  const handleNavigateToUserProfile = (userId: string) => {
    if (onUserSelect) {
      onUserSelect(userId);
    }
  };

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className={`text-2xl font-bold ${textMain}`}>Отзывы</h2>
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
        <div className="flex snap-x gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-2 sm:overflow-visible">
          {reviews.map((review) => {
            const userProfile = usersCache.get(review.userId);
            const displayName = userProfile?.userName || review.userName || 'Анонимный пользователь';
            const avatarUrl = userProfile?.avatarUrl || review.userAvatar;
            const reviewDate = new Date(review.createdAt);
            const formattedDate = reviewDate.toLocaleDateString('ru-RU', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
            const avgReviewRating = (review.ratingCoffee + review.ratingService + review.ratingPlace) / 3;

            return (
              <div key={review.id} className={`${cardBg} min-w-[88%] snap-start rounded-[24px] border p-5 transition-all sm:min-w-0 ${borderColor}`}>
                <div className="mb-4 flex items-start justify-between gap-3">
                  <button
                    onClick={() => handleNavigateToUserProfile(review.userId)}
                    className="flex items-center gap-4 hover:opacity-80 transition-opacity min-w-0"
                  >
                    <div className={`w-12 h-12 shrink-0 rounded-full border-2 ${themeClasses.primary.borderLighter} overflow-hidden`}>
                      {avatarUrl ? (
                        <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                      ) : (
                        <div className={`w-full h-full ${cardBg} flex items-center justify-center font-bold ${textMain}`}>
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="text-left min-w-0">
                      <h4 className={`font-bold ${textMain} truncate`}>{displayName}</h4>
                      <p className={`text-xs ${textMuted} font-medium uppercase tracking-widest`}>
                        {formattedDate}
                      </p>
                    </div>
                  </button>
                  <div className="hidden items-center gap-2 sm:flex sm:pl-4">
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
                <div className="mb-4 grid grid-cols-3 gap-2">
                  {[['Аура', review.ratingPlace], ['Сервис', review.ratingService], ['Кофе', review.ratingCoffee]].map(([label, rating]) => <div key={String(label)} className="rounded-2xl bg-black/[.03] px-2 py-3 text-center dark:bg-white/[.05]"><span className={`block text-xs ${textMuted}`}>{label}</span><strong className={textMain}>{rating}</strong></div>)}
                </div>
                <div className="mb-4 flex items-center gap-2 sm:hidden"><div className={`flex ${themeClasses.primary.text}`}>{[1, 2, 3, 4, 5].map(star => <StarIcon key={star} filled={star <= avgReviewRating} size={20} />)}</div><span className={`text-lg font-bold ${textMain}`}>{avgReviewRating.toFixed(1)}</span></div>
                {review.header && (
                  <h5 className={`font-bold ${textMain} mb-2`}>{review.header}</h5>
                )}
                <p className={`${textMuted} leading-relaxed`}>"{review.comment}"</p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 flex flex-col items-center">
          <Mascot pose="book" size={120} />
          <p className={`${textMuted} mt-3`}>Станьте первым, кто оценит и оставит отзыв о своём посещении {coffeeShopName}</p>
        </div>
      )}
    </div>
  );
};

