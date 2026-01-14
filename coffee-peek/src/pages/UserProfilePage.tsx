import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUserPublicProfile, PublicUserProfile } from '../api/user';
import { getReviewsByUserId, Review } from '../api/coffeeshop';
import { useTheme } from '../contexts/ThemeContext';
import Button from '../components/Button';
import { useUsersCache } from '../hooks/useUsersCache';

const UserProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { theme } = useTheme();
  
  const [profile, setProfile] = React.useState<PublicUserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  
  // Load user reviews
  const [reviews, setReviews] = React.useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = React.useState(false);
  const [reviewsPage, setReviewsPage] = React.useState(1);
  const [reviewsTotalPages, setReviewsTotalPages] = React.useState(1);
  const usersCache = useUsersCache(reviews);

  // Load profile
  React.useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      if (!userId) return;
      
      try {
        setIsLoadingProfile(true);
        setError(null);
        const response = await getUserPublicProfile(userId);
        
        if (cancelled) return;
        
        if (response.success && response.data) {
          setProfile(response.data);
        } else {
          setError('Не удалось загрузить профиль пользователя');
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Error loading profile:', err);
          setError('Произошла ошибка при загрузке профиля');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingProfile(false);
        }
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Load user reviews
  React.useEffect(() => {
    let cancelled = false;

    const loadReviews = async () => {
      if (!userId) return;
      
      try {
        setIsLoadingReviews(true);
        const response = await getReviewsByUserId(userId, reviewsPage, 10);
        
        if (cancelled) return;
        
        if (response.success && response.data) {
          setReviews(response.data.reviews || []);
          setReviewsTotalPages(response.data.totalPages || 1);
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Error loading reviews:', err);
        }
      } finally {
        if (!cancelled) {
          setIsLoadingReviews(false);
        }
      }
    };

    loadReviews();

    return () => {
      cancelled = true;
    };
  }, [userId, reviewsPage]);

  const handlePreviousPage = () => {
    if (reviewsPage > 1) {
      setReviewsPage(reviewsPage - 1);
    }
  };

  const handleNextPage = () => {
    if (reviewsPage < reviewsTotalPages) {
      setReviewsPage(reviewsPage + 1);
    }
  };

  const handleShopSelect = (shopId: string) => {
    navigate(`/shops/${shopId}`);
  };

  const bgClass = theme === 'dark' ? 'bg-[#1A1412]' : 'bg-stone-50/50';
  const bgSurface = theme === 'dark' ? 'bg-[#2D241F]' : 'bg-white';
  const borderClass = theme === 'dark' ? 'border-[#3D2F28]' : 'border-stone-200';
  const textMain = theme === 'dark' ? 'text-white' : 'text-[#2C241E]';
  const textMuted = theme === 'dark' ? 'text-[#A39E93]' : 'text-[#7C746E]';

  if (isLoadingProfile) {
    return (
      <div className={`min-h-screen ${bgClass} flex items-center justify-center`}>
        <div className="w-12 h-12 border-4 border-[#EAB308] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className={`min-h-screen ${bgClass} flex items-center justify-center p-4`}>
        <div className="text-center">
          <p className={`text-xl ${textMain} mb-4`}>
            {error || 'Профиль не найден'}
          </p>
          <Button onClick={() => navigate(-1)} variant="primary">
            Вернуться назад
          </Button>
        </div>
      </div>
    );
  }

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + ((r.ratingCoffee + r.ratingService + r.ratingPlace) / 3), 0) / reviews.length).toFixed(1)
    : '0.0';

  return (
    <div className={`min-h-screen ${bgClass} pt-16`}>
      {/* Back button */}
      <div className="fixed top-20 left-4 z-10">
        <Button onClick={() => navigate(-1)} variant="secondary">
          <span className="material-symbols-outlined text-xl">arrow_back</span>
          Назад
        </Button>
      </div>

      {/* Profile header */}
      <header className={`${bgSurface} border-b ${borderClass} px-12 py-10`}>
        <div className="max-w-6xl mx-auto flex items-end justify-between">
          <div className="flex items-center gap-8">
            <div className="relative">
              <div className={`w-32 h-32 rounded-full border-4 ${theme === 'dark' ? 'border-[#3D2F28]' : 'border-white'} shadow-xl overflow-hidden ring-1 ${theme === 'dark' ? 'ring-[#3D2F28]' : 'ring-stone-200'}`}>
                {profile.avatarUrl ? (
                  <img 
                    src={profile.avatarUrl} 
                    alt={profile.userName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[#D4A373] flex items-center justify-center">
                    <span className="text-5xl font-bold text-white">
                      {profile.userName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <h1 className={`text-4xl font-bold ${textMain} tracking-tight`}>
                {profile.userName}
              </h1>
              <div className="flex items-center gap-2">
                {profile.nickname && (
                  <div className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full ${theme === 'dark' ? 'bg-[#EAB308]/10 border-[#EAB308]/20' : 'bg-[#FAC638]/10 border-[#FAC638]/20'} border`}>
                    <span className="material-symbols-outlined text-lg text-[#D4A373]">verified</span>
                    <span className={`${theme === 'dark' ? 'text-[#D4A373]' : 'text-[#A67F48]'} text-xs font-bold uppercase tracking-widest`}>
                      @{profile.nickname}
                    </span>
                  </div>
                )}
                {profile.createdAt && (
                  <span className={`${textMuted} text-sm px-2`}>
                    На сайте с {new Date(profile.createdAt).getFullYear()}
                  </span>
                )}
              </div>
              {profile.about && (
                <p className={`${textMuted} text-sm max-w-lg`}>
                  {profile.about}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-12 py-10 space-y-12">
        {/* Statistics */}
        <section>
          <div className="grid grid-cols-3 gap-6">
            <div className={`${bgSurface} p-8 rounded-3xl border ${borderClass} shadow-sm flex flex-col items-center text-center group hover:border-[#D4A373]/30 transition-all`}>
              <div className={`w-12 h-12 rounded-2xl ${theme === 'dark' ? 'bg-[#D4A373]/10' : 'bg-[#D4A373]/10'} text-[#D4A373] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <span className="material-symbols-outlined text-3xl">shopping_cart_checkout</span>
              </div>
              <span className={`text-4xl font-bold ${textMain}`}>
                {profile.checkInCount ?? 0}
              </span>
              <span className={`text-xs font-bold ${textMuted} uppercase tracking-[0.2em] mt-2`}>
                ПОСЕЩЕНИЯ
              </span>
            </div>
            <div className={`${bgSurface} p-8 rounded-3xl border ${borderClass} shadow-sm flex flex-col items-center text-center group hover:border-[#D4A373]/30 transition-all`}>
              <div className={`w-12 h-12 rounded-2xl ${theme === 'dark' ? 'bg-[#D4A373]/10' : 'bg-[#D4A373]/10'} text-[#D4A373] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <span className="material-symbols-outlined text-3xl">rate_review</span>
              </div>
              <span className={`text-4xl font-bold ${textMain}`}>
                {profile.reviewCount ?? 0}
              </span>
              <span className={`text-xs font-bold ${textMuted} uppercase tracking-[0.2em] mt-2`}>
                ОТЗЫВОВ
              </span>
            </div>
            <div className={`${bgSurface} p-8 rounded-3xl border ${borderClass} shadow-sm flex flex-col items-center text-center group hover:border-[#D4A373]/30 transition-all`}>
              <div className={`w-12 h-12 rounded-2xl ${theme === 'dark' ? 'bg-[#D4A373]/10' : 'bg-[#D4A373]/10'} text-[#D4A373] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <span className="material-symbols-outlined text-3xl fill-1">star</span>
              </div>
              <span className={`text-4xl font-bold ${textMain}`}>
                {averageRating}
              </span>
              <span className={`text-xs font-bold ${textMuted} uppercase tracking-[0.2em] mt-2`}>
                РЕЙТИНГ
              </span>
            </div>
          </div>
        </section>

        {/* Reviews */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div className="flex flex-col gap-1">
              <h2 className={`text-2xl font-bold ${textMain}`}>Последние отзывы</h2>
              <p className={`${textMuted} text-sm`}>
                {profile.reviewCount ? `Всего отзывов: ${profile.reviewCount}` : 'Пока нет отзывов'}
              </p>
            </div>
          </div>

          {isLoadingReviews ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-12 h-12 border-4 border-[#EAB308] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : reviews.length > 0 ? (
            <>
              <div className="space-y-4">
                {reviews.map((review) => {
                  const reviewDate = new Date(review.createdAt);
                  const formattedDate = reviewDate.toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  });
                  const avgRating = ((review.ratingCoffee + review.ratingService + review.ratingPlace) / 3).toFixed(1);

                  return (
                    <div
                      key={review.id}
                      className={`${bgSurface} p-6 rounded-2xl border ${borderClass} shadow-sm flex items-start gap-4 hover:shadow-md transition-all`}
                    >
                      <div className={`w-12 h-12 rounded-full ${theme === 'dark' ? 'bg-[#2D241F]' : 'bg-stone-100'} flex items-center justify-center shrink-0`}>
                        <span className="material-symbols-outlined text-[#D4A373]">edit_square</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          {review.header ? (
                            <p className={`font-bold ${textMain}`}>{review.header}</p>
                          ) : (
                            <p className={`font-bold ${textMain}`}>Отзыв о кофейне</p>
                          )}
                          <span className={`text-xs ${textMuted}`}>{formattedDate}</span>
                        </div>
                        {review.comment && (
                          <p className={`text-sm ${textMuted} mt-1 leading-relaxed`}>
                            {review.comment}
                          </p>
                        )}
                        <div className="mt-3 flex items-center gap-3">
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span 
                                key={star}
                                className={`material-symbols-outlined text-sm ${
                                  star <= Math.round(parseFloat(avgRating))
                                    ? 'text-[#FAC638] fill-1'
                                    : theme === 'dark' ? 'text-[#3D2F28]' : 'text-stone-300'
                                }`}
                              >
                                star
                              </span>
                            ))}
                          </div>
                          <button
                            onClick={() => handleShopSelect(review.coffeeShopId)}
                            className="text-xs text-[#D4A373] hover:text-[#A67F48] font-medium transition-colors flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                            Перейти к кофейне
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {reviewsTotalPages > 1 && (
                <div className="flex items-center justify-center gap-4 mt-8">
                  <Button
                    onClick={handlePreviousPage}
                    disabled={reviewsPage === 1}
                    variant="secondary"
                  >
                    <span className="material-symbols-outlined text-xl">chevron_left</span>
                    Предыдущая
                  </Button>
                  <span className={`px-4 py-2 ${textMain} font-medium`}>
                    Страница {reviewsPage} из {reviewsTotalPages}
                  </span>
                  <Button
                    onClick={handleNextPage}
                    disabled={reviewsPage === reviewsTotalPages}
                    variant="secondary"
                  >
                    Следующая
                    <span className="material-symbols-outlined text-xl">chevron_right</span>
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className={`${bgSurface} p-12 rounded-2xl border ${borderClass} text-center`}>
              <div className={`w-16 h-16 rounded-full ${theme === 'dark' ? 'bg-[#2D241F]' : 'bg-stone-100'} ${textMuted} flex items-center justify-center mx-auto mb-4`}>
                <span className="material-symbols-outlined text-4xl">rate_review</span>
              </div>
              <p className={`${textMuted} text-lg`}>
                Пользователь пока не оставил ни одного отзыва
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default UserProfilePage;
