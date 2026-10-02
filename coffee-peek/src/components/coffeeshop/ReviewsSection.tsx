import { savedDrinkName } from '../../utils/consumedDrinks';
import React from 'react';
import { getPhotoUrl } from '../../api/coffeeshop';
import type { Review, ShortPhotoMetadataDto } from '../../api/coffeeshop';
import type { PublicUserProfile } from '../../api/user';
import { ReviewCardSkeleton } from '../skeletons';
import { useTheme } from '../../contexts/ThemeContext';
import { getThemeClasses } from '../../utils/theme';
import type { AppUser } from '../../contexts/UserContext';
import { StarIcon } from '../icons';
import Mascot from '../Mascot';
import PhotoLightbox from '../PhotoLightbox';
import ReportReviewButton from '../ReportReviewButton';

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
  averageRating: number;
  totalCount: number;
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({
  reviews, usersCache, isLoading, myReviewId, isCheckingMyReview,
  onWriteOrEditReview, onUserSelect, user, textMain, textMuted,
  cardBg, borderColor, coffeeShopName, averageRating, totalCount,
}) => {
  const { theme } = useTheme();
  const classes = getThemeClasses(theme);
  const [expandedReviews, setExpandedReviews] = React.useState<Set<string>>(new Set());
  const [gallery, setGallery] = React.useState<{ images: ShortPhotoMetadataDto[]; initialIndex: number } | null>(null);
  const ratings = [
    { label: 'Кофе', key: 'ratingCoffee', pose: 'cup' },
    { label: 'Сервис', key: 'ratingService', pose: 'dessert' },
    { label: 'Аура', key: 'ratingPlace', pose: 'happy' },
  ] as const;

  return (
    <section aria-label="Отзывы">
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 className={`text-2xl font-bold ${textMain}`}>Отзывы</h2>
        {user && <button type="button" onClick={onWriteOrEditReview} disabled={isCheckingMyReview} className={`min-h-11 shrink-0 rounded-xl px-4 py-2.5 font-bold disabled:opacity-60 ${classes.primary.bgLight} ${classes.primary.text}`}>{myReviewId ? 'Изменить' : 'Написать'}</button>}
      </div>
      {!isLoading && totalCount > 0 && <div className="mb-6 space-y-4 sm:mb-7">
        <div className={`flex items-center gap-2 text-xl font-bold sm:text-2xl ${textMain}`}><StarIcon filled size={28} className={classes.primary.text} /><span>{averageRating.toFixed(1)} · Отзывы: {totalCount}</span></div>
        {reviews.length > 0 && <div className="space-y-3">{ratings.map(({ label, key, pose }) => {
          const value = reviews.reduce((sum, review) => sum + review[key], 0) / reviews.length;
          return <div key={key} className="flex items-center gap-3 sm:gap-4">
            <div className="flex w-28 shrink-0 items-center gap-2 sm:w-36"><Mascot pose={pose} size={28} /><span className={textMain}>{label}</span></div>
            <div role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={5} aria-valuenow={value} className={`h-2.5 flex-1 overflow-hidden rounded-full ${classes.bg.tertiary}`}><div className={`h-full rounded-full ${classes.primary.bg}`} style={{ width: `${Math.max(0, Math.min(100, value * 20))}%` }} /></div>
            <span className={`w-9 text-right text-lg font-semibold tabular-nums ${textMain}`}>{value.toFixed(1)}</span>
          </div>;
        })}{reviews.length < totalCount && <p className={`text-xs ${textMuted}`}>Оценки категорий — по показанным отзывам</p>}</div>}
      </div>}
      {isLoading ? <ReviewCardSkeleton count={3} /> : reviews.length > 0 ? (
        <div className="flex snap-x snap-mandatory items-start gap-4 overflow-x-auto pb-3 sm:grid sm:grid-cols-2 sm:overflow-visible">
          {reviews.map((review, index) => {
            const profile = usersCache.get(review.userId);
            const name = profile?.userName || review.userName || 'Анонимный пользователь';
            const avatar = profile?.avatarUrl || review.userAvatar;
            const photos = (review.photos ?? []).filter(photo => getPhotoUrl(photo, 'thumbnail'));
            const date = new Date(review.createdAt).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' });
            const rating = (review.ratingCoffee + review.ratingService + review.ratingPlace) / 3;
            const expanded = expandedReviews.has(review.id);
            const long = review.comment.length > 220;
            const blurred = !user && index > 0;
            return <article key={review.id} aria-hidden={blurred || undefined} inert={blurred || undefined} className={`w-[88%] min-w-[88%] snap-start rounded-[28px] border p-4 sm:w-auto sm:min-w-0 sm:p-5 ${cardBg} ${borderColor} ${blurred ? 'pointer-events-none select-none blur-[6px]' : ''}`}>
              <div className="mb-4 flex items-start justify-between gap-1">
                <button type="button" disabled={!review.author} onClick={() => onUserSelect?.(review.userId)} className="flex min-w-0 items-center gap-3 text-left hover:opacity-80">
                  <div className={`h-12 w-12 shrink-0 overflow-hidden rounded-full border ${classes.primary.borderLight}`}>{avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : <span className={`flex h-full w-full items-center justify-center text-xl font-bold ${textMain}`}>{name.charAt(0).toUpperCase()}</span>}</div>
                  <div className="min-w-0"><h3 className={`truncate font-bold ${textMain}`}>{name}</h3><div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5"><span className={`flex items-center gap-1 font-bold ${textMain}`}><StarIcon filled size={18} className={classes.primary.text} />{rating.toFixed(1)}</span><span className={`text-xs ${textMuted}`}>{date}</span></div></div>
                </button>
                <ReportReviewButton reviewId={review.id} />
              </div>
              {savedDrinkName(review) && <p className="my-2 text-sm">Напиток: {savedDrinkName(review)}</p>}
              {review.header && <h4 className={`mb-2 text-lg font-bold ${textMain}`}>{review.header}</h4>}
              <p className={`whitespace-pre-line leading-relaxed ${textMuted} ${long && !expanded ? 'line-clamp-4' : ''}`}>{review.comment}</p>
              {long && <button type="button" aria-expanded={expanded} onClick={() => setExpandedReviews(current => { const next = new Set(current); if (expanded) next.delete(review.id); else next.add(review.id); return next; })} className={`mt-2 min-h-11 font-semibold ${classes.primary.text}`}>{expanded ? 'Свернуть' : 'Читать полностью'}</button>}
              {photos.length > 0 && <div className="mt-4 flex gap-2 overflow-x-auto rounded-2xl">{photos.map((photo, photoIndex) => <button type="button" key={photo.storageKey || photo.fullUrl || photoIndex} onClick={() => setGallery({ images: photos, initialIndex: photoIndex })} className={`aspect-square shrink-0 overflow-hidden rounded-2xl ${photos.length === 1 ? 'w-full' : 'w-[calc(50%-4px)]'}`} aria-label={`Открыть фото ${photoIndex + 1} к отзыву`}><img src={getPhotoUrl(photo, 'thumbnail')} alt="" loading="lazy" className="h-full w-full object-cover" /></button>)}</div>}
            </article>;
          })}
        </div>
      ) : <div className="flex flex-col items-center py-8 text-center"><Mascot pose="book" size={120} /><p className={`${textMuted} mt-3`}>Станьте первым, кто оценит и оставит отзыв о своём посещении {coffeeShopName}</p></div>}
      {gallery && <PhotoLightbox images={gallery.images} shopName={coffeeShopName} initialIndex={gallery.initialIndex} onClose={() => setGallery(null)} />}
    </section>
  );
};
