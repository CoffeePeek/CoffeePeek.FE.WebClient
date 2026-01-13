import React, { useEffect, useState } from 'react';
import { 
  DetailedCoffeeShop, 
  getCoffeeShopById, 
  getCoffeeShopReviews, 
  Review, 
  GetReviewsResponse,
  addToFavorite,
  removeFromFavorite,
  getAllFavorites,
  createCheckIn,
  createReview,
  CreateReviewRequest,
  getPhotoUrl
} from '../api/coffeeshop';
import { getUsersPublicProfiles, PublicUserProfile } from '../api/user';
import { ShopDetailSkeleton, ReviewCardSkeleton } from '../components/skeletons';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { useToast } from '../contexts/ToastContext';

interface CoffeeShopPageProps {
  shopId: string;
  onBack: () => void;
  onUserSelect?: (userId: string) => void;
  onCreateReview?: (shopId: string) => void;
}

const CoffeeShopPage: React.FC<CoffeeShopPageProps> = ({ shopId, onBack, onUserSelect, onCreateReview }) => {
  const { theme } = useTheme();
  const { user } = useUser();
  const { showToast } = useToast();
  
  const [shop, setShop] = useState<DetailedCoffeeShop | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsTotalPages, setReviewsTotalPages] = useState(1);
  const [reviewsTotalCount, setReviewsTotalCount] = useState(0);
  const [usersCache, setUsersCache] = useState<Map<string, PublicUserProfile>>(new Map());
  const [isFavorite, setIsFavorite] = useState(false);
  const [isCheckingFavorite, setIsCheckingFavorite] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewHeader, setReviewHeader] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewRatingCoffee, setReviewRatingCoffee] = useState(5);
  const [reviewRatingService, setReviewRatingService] = useState(5);
  const [reviewRatingPlace, setReviewRatingPlace] = useState(5);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Цветовая схема
  const isDark = theme === 'dark';
  const bgClass = isDark ? 'bg-[#1A1412]' : 'bg-[#FCFBFA]';
  const textMain = isDark ? 'text-white' : 'text-[#2D2926]';
  const textMuted = isDark ? 'text-gray-400' : 'text-[#6B6661]';
  const cardBg = isDark ? 'bg-[#2D241F]' : 'bg-white';
  const borderColor = isDark ? 'border-[#3D2F28]' : 'border-[#E8E4E1]';
  const primary = '#B48C4B';
  const primaryHover = '#8E6F3A';

  // Загрузка данных кофейни
  useEffect(() => {
    let cancelled = false;

    const loadShop = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const response = await getCoffeeShopById(shopId);
        
        if (cancelled) return;
        
        if (response.success && response.data) {
          setShop(response.data);
        } else {
          setError('Не удалось загрузить информацию о кофейне');
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Error loading shop details:', err);
          setError('Произошла ошибка при загрузке данных');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    if (shopId) {
      loadShop();
    }

    return () => {
      cancelled = true;
    };
  }, [shopId]);

  // Загрузка отзывов
  useEffect(() => {
    let cancelled = false;
    
    const loadReviews = async () => {
      if (!shopId) return;
      
      try {
        setIsLoadingReviews(true);
        const response = await getCoffeeShopReviews(shopId, reviewsPage, 10);
        
        if (cancelled) return;
        
        if (response.success && response.data) {
          const data = response.data as GetReviewsResponse;
          setReviews(data.reviews || []);
          setReviewsTotalCount(data.totalCount || 0);
          setReviewsTotalPages(data.totalPages || 1);
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
  }, [shopId, reviewsPage]);

  // Загрузка информации о пользователях
  useEffect(() => {
    let cancelled = false;

    const loadUsersForReviews = async () => {
      if (reviews.length === 0) return;

      const userIds = [...new Set(reviews.map(r => r.userId))];
      const missingUserIds = userIds.filter(id => !usersCache.has(id));
      
      if (missingUserIds.length === 0) return;

      try {
        const newUsers = await getUsersPublicProfiles(missingUserIds);
        
        if (cancelled) return;

        setUsersCache(prevCache => {
          const updatedCache = new Map(prevCache);
          newUsers.forEach((user, userId) => {
            updatedCache.set(userId, user);
          });
          return updatedCache;
        });
      } catch (err) {
        if (!cancelled) {
          console.error('Error loading user profiles:', err);
        }
      }
    };

    loadUsersForReviews();

    return () => {
      cancelled = true;
    };
  }, [reviews]);

  // Проверка избранного
  useEffect(() => {
    let cancelled = false;

    const checkFavoriteStatus = async () => {
      if (!user || !shopId) return;
      
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      try {
        setIsCheckingFavorite(true);
        const response = await getAllFavorites(token);
        
        if (cancelled) return;
        
        if (response.success && response.data) {
          const isFav = response.data.data.some(shop => shop.id === shopId);
          setIsFavorite(isFav);
        } else if (response.message?.includes('не существует')) {
          // Endpoint doesn't exist yet, silently skip
          if (import.meta.env.DEV) {
            console.info('Favorites endpoint not available yet');
          }
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Error checking favorite status:', err);
        }
      } finally {
        if (!cancelled) {
          setIsCheckingFavorite(false);
        }
      }
    };

    checkFavoriteStatus();

    return () => {
      cancelled = true;
    };
  }, [user, shopId]);

  const handleToggleFavorite = async () => {
    if (!user) {
      showToast('Необходимо войти в систему', 'error');
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      setIsCheckingFavorite(true);
      
      if (isFavorite) {
        const response = await removeFromFavorite(shopId, token);
        if (response.success) {
          setIsFavorite(false);
          showToast('Удалено из избранного', 'success');
        }
      } else {
        const response = await addToFavorite(shopId, token);
        if (response.success) {
          setIsFavorite(true);
          showToast('Добавлено в избранное', 'success');
        }
      }
    } catch (err: any) {
      console.error('Error toggling favorite:', err);
      showToast('Не удалось изменить статус избранного', 'error');
    } finally {
      setIsCheckingFavorite(false);
    }
  };

  const handleNavigateToUserProfile = (userId: string) => {
    if (onUserSelect) {
      onUserSelect(userId);
    }
  };

  const handleSubmitReview = async () => {
    if (!user) {
      showToast('Необходимо войти в систему', 'error');
      return;
    }

    if (!reviewHeader.trim() || !reviewComment.trim()) {
      showToast('Заполните все обязательные поля', 'error');
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      setIsSubmittingReview(true);
      const request: CreateReviewRequest = {
        shopId,
        header: reviewHeader,
        comment: reviewComment,
        ratingCoffee: reviewRatingCoffee,
        ratingService: reviewRatingService,
        ratingPlace: reviewRatingPlace,
      };

      const response = await createReview(request, token);
      if (response.success) {
        showToast('Отзыв успешно добавлен!', 'success');
        setShowReviewModal(false);
        setReviewHeader('');
        setReviewComment('');
        setReviewRatingCoffee(5);
        setReviewRatingService(5);
        setReviewRatingPlace(5);
        
        // Перезагружаем данные кофейни для обновления рейтинга
        const shopResponse = await getCoffeeShopById(shopId);
        if (shopResponse.success && shopResponse.data) {
          setShop(shopResponse.data);
        }
        
        // Перезагружаем отзывы
        const reviewsResponse = await getCoffeeShopReviews(shopId, 1, 10);
        if (reviewsResponse.success && reviewsResponse.data) {
          setReviews(reviewsResponse.data.reviews || []);
          setReviewsTotalCount(reviewsResponse.data.totalCount || 0);
          setReviewsPage(1);
        }
      }
    } catch (err: any) {
      console.error('Error submitting review:', err);
      showToast('Не удалось отправить отзыв', 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const formatDayOfWeek = (dayOfWeek: number): string => {
    const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
    return days[dayOfWeek] || '';
  };

  const formatDayOfWeekShort = (dayOfWeek: number): string => {
    const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    return days[dayOfWeek] || '';
  };

  const getCurrentStatus = () => {
    if (!shop?.schedules || shop.schedules.length === 0) return null;
    
    const now = new Date();
    const currentDay = now.getDay() === 0 ? 6 : now.getDay() - 1;
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const todaySchedule = shop.schedules.find(s => s.dayOfWeek === currentDay);
    if (!todaySchedule || !todaySchedule.openTime || !todaySchedule.closeTime) return null;
    
    const openTime = parseInt(todaySchedule.openTime.split(':')[0]) * 60 + parseInt(todaySchedule.openTime.split(':')[1]);
    const closeTime = parseInt(todaySchedule.closeTime.split(':')[0]) * 60 + parseInt(todaySchedule.closeTime.split(':')[1]);
    
    const isOpen = currentTime >= openTime && currentTime < closeTime;
    
    return {
      isOpen,
      openTime: todaySchedule.openTime,
      closeTime: todaySchedule.closeTime,
    };
  };

  if (isLoading) {
    return <ShopDetailSkeleton />;
  }

  if (error || !shop) {
    return (
      <div className={`min-h-screen ${bgClass} flex items-center justify-center p-4`}>
        <div className="text-center">
          <p className={`text-xl ${textMain} mb-4`}>{error || 'Кофейня не найдена'}</p>
          <button
            onClick={onBack}
            className="bg-[#B48C4B] hover:bg-[#8E6F3A] text-white px-6 py-3 rounded-2xl font-bold transition-all"
          >
            Вернуться назад
          </button>
        </div>
      </div>
    );
  }

  const status = getCurrentStatus();
  const avgRating = shop.rating || 0;

  return (
    <div className={`min-h-screen ${bgClass} font-body`}>
      {/* Галерея фотографий */}
      <section className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-12 grid-rows-2 gap-4 h-[500px]">
          {shop.photos && shop.photos.length > 0 ? (
            <>
              {/* Главное фото */}
              <div className="col-span-12 md:col-span-8 row-span-2 rounded-3xl overflow-hidden relative group cursor-pointer">
                <div 
                  className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: `url(${getPhotoUrl(shop.photos[0])})` }}
                />
                <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
              </div>
              
              {/* Второе фото */}
              {shop.photos.length > 1 && (
                <div className="hidden md:block col-span-4 row-span-1 rounded-3xl overflow-hidden relative group cursor-pointer">
                  <div 
                    className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                    style={{ backgroundImage: `url(${getPhotoUrl(shop.photos[1])})` }}
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                </div>
              )}
              
              {/* Третье фото */}
              {shop.photos.length > 2 && (
                <div className="hidden md:block col-span-4 row-span-1 rounded-3xl overflow-hidden relative group cursor-pointer">
                  <div 
                    className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                    style={{ backgroundImage: `url(${getPhotoUrl(shop.photos[2])})` }}
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                  {shop.photos.length > 3 && (
                    <button className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-md text-[#2D2926] px-4 py-2 rounded-xl font-bold text-sm border border-[#E8E4E1] shadow-xl flex items-center gap-2 hover:bg-white transition-all">
                      <span className="material-symbols-outlined text-base">grid_view</span>
                      Показать все фото ({shop.photos.length})
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className={`col-span-12 row-span-2 rounded-3xl ${cardBg} border ${borderColor} flex items-center justify-center`}>
              <p className={textMuted}>Нет фотографий</p>
            </div>
          )}
        </div>
      </section>

      {/* Основной контент */}
      <section className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-12 gap-12">
        {/* Левая колонка */}
        <div className="col-span-12 lg:col-span-8 space-y-12">
          {/* Заголовок и действия */}
          <div>
            <div className="flex flex-wrap items-start justify-between gap-6 mb-6">
              <div>
                <h1 className={`text-5xl font-display font-bold ${textMain} mb-2 tracking-tight`}>
                  {shop.name}
                </h1>
                <div className="flex items-center gap-3 text-sm">
                  <span className="bg-[#B48C4B]/10 text-[#B48C4B] font-bold px-3 py-1 rounded-lg flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm fill-1">star</span>
                    {avgRating.toFixed(1)}
                  </span>
                  <span className={`${textMuted} font-medium border-b border-current/30`}>
                    {shop.reviewCount || reviewsTotalCount} отзывов
                  </span>
                  <span className={textMuted}>•</span>
                  {status && (
                    <>
                      <span className={`${status.isOpen ? 'text-green-600' : 'text-red-600'} font-bold uppercase tracking-wider text-xs`}>
                        {status.isOpen ? 'Открыто' : 'Закрыто'}
                      </span>
                      <span className={textMuted}>•</span>
                    </>
                  )}
                  <span className={`${textMuted} font-medium`}>$$</span>
                </div>
              </div>
              
              {/* Кнопки действий */}
              <div className="flex gap-3">
                <button
                  onClick={handleToggleFavorite}
                  disabled={isCheckingFavorite}
                  className={`w-12 h-12 rounded-2xl border ${borderColor} flex items-center justify-center hover:bg-[#F5EFE6] hover:border-[#B48C4B]/30 transition-all ${textMuted} hover:text-[#B48C4B] ${isFavorite ? 'bg-[#F5EFE6] text-[#B48C4B]' : ''}`}
                >
                  <span className={`material-symbols-outlined ${isFavorite ? 'fill-1' : ''}`}>favorite</span>
                </button>
                <button className={`w-12 h-12 rounded-2xl border ${borderColor} flex items-center justify-center hover:bg-[#F5EFE6] hover:border-[#B48C4B]/30 transition-all ${textMuted} hover:text-[#B48C4B]`}>
                  <span className="material-symbols-outlined">share</span>
                </button>
              </div>
            </div>

            {/* Кнопки контактов */}
            {(shop.shopContact?.phone || shop.shopContact?.website || shop.shopContact?.instagram) && (
              <div className="flex flex-wrap gap-4 mb-10">
                {shop.shopContact?.phone && (
                  <a
                    href={`tel:${shop.shopContact.phone}`}
                    className="flex items-center gap-3 bg-[#B48C4B] hover:bg-[#8E6F3A] text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-[#B48C4B]/20 transition-all transform active:scale-95"
                  >
                    <span className="material-symbols-outlined">call</span>
                    Позвонить
                  </a>
                )}
                {shop.shopContact?.website && (
                  <a
                    href={shop.shopContact.website.startsWith('http') ? shop.shopContact.website : `https://${shop.shopContact.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-3 ${cardBg} border ${borderColor} hover:border-[#B48C4B]/50 ${textMain} px-8 py-4 rounded-2xl font-bold transition-all`}
                  >
                    <span className="material-symbols-outlined text-[#B48C4B]">language</span>
                    Веб-сайт
                  </a>
                )}
                {shop.shopContact?.instagram && (
                  <a
                    href={shop.shopContact.instagram.startsWith('http') ? shop.shopContact.instagram : `https://instagram.com/${shop.shopContact.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-3 ${cardBg} border ${borderColor} hover:border-[#B48C4B]/50 ${textMain} px-8 py-4 rounded-2xl font-bold transition-all`}
                  >
                    <span className="material-symbols-outlined text-[#B48C4B]">photo_camera</span>
                    Instagram
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Описание */}
          {shop.description && (
            <div className={`${cardBg} p-6 rounded-3xl border ${borderColor}`}>
              <h2 className={`text-2xl font-display font-bold ${textMain} flex items-center gap-3 mb-4`}>
                <span className="w-1.5 h-8 bg-[#B48C4B] rounded-full" />
                О кофейне
              </h2>
              <p className={`${textMuted} leading-relaxed`}>{shop.description}</p>
            </div>
          )}

          {/* Контакты */}
          {shop.shopContact && (shop.shopContact.phone || shop.shopContact.email || shop.shopContact.website || shop.shopContact.instagram) && (
            <div className={`${cardBg} p-6 rounded-3xl border ${borderColor}`}>
              <h2 className={`text-2xl font-display font-bold ${textMain} flex items-center gap-3 mb-4`}>
                <span className="w-1.5 h-8 bg-[#B48C4B] rounded-full" />
                Контакты
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {shop.shopContact.phone && (
                  <a 
                    href={`tel:${shop.shopContact.phone}`}
                    className={`flex items-center gap-3 p-4 rounded-2xl border ${borderColor} hover:border-[#B48C4B]/50 ${textMuted} hover:text-[#B48C4B] transition-all`}
                  >
                    <span className="material-symbols-outlined text-[#B48C4B]">call</span>
                    <span className="font-medium break-all">{shop.shopContact.phone}</span>
                  </a>
                )}
                {shop.shopContact.email && (
                  <a 
                    href={`mailto:${shop.shopContact.email}`}
                    className={`flex items-center gap-3 p-4 rounded-2xl border ${borderColor} hover:border-[#B48C4B]/50 ${textMuted} hover:text-[#B48C4B] transition-all`}
                  >
                    <span className="material-symbols-outlined text-[#B48C4B]">mail</span>
                    <span className="font-medium break-all">{shop.shopContact.email}</span>
                  </a>
                )}
                {shop.shopContact.website && (
                  <a 
                    href={shop.shopContact.website.startsWith('http') ? shop.shopContact.website : `https://${shop.shopContact.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-3 p-4 rounded-2xl border ${borderColor} hover:border-[#B48C4B]/50 ${textMuted} hover:text-[#B48C4B] transition-all`}
                  >
                    <span className="material-symbols-outlined text-[#B48C4B]">language</span>
                    <span className="font-medium break-all">{shop.shopContact.website}</span>
                  </a>
                )}
                {shop.shopContact.instagram && (
                  <a 
                    href={shop.shopContact.instagram.startsWith('http') ? shop.shopContact.instagram : `https://instagram.com/${shop.shopContact.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-3 p-4 rounded-2xl border ${borderColor} hover:border-[#B48C4B]/50 ${textMuted} hover:text-[#B48C4B] transition-all`}
                  >
                    <span className="material-symbols-outlined text-[#B48C4B]">photo_camera</span>
                    <span className="font-medium break-all">{shop.shopContact.instagram}</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Детали кофе */}
          {(shop.equipments?.length > 0 || shop.beans?.length > 0 || shop.roasters?.length > 0 || shop.brewMethods?.length > 0) && (
            <div>
              <h2 className={`text-2xl font-display font-bold ${textMain} flex items-center gap-3 mb-8`}>
                <span className="w-1.5 h-8 bg-[#B48C4B] rounded-full" />
                Детали кофе
              </h2>
              
              <div className={`${cardBg} p-6 rounded-3xl border ${borderColor}`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Оборудование */}
                {shop.equipments && shop.equipments.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="material-symbols-outlined text-[#B48C4B]">precision_manufacturing</span>
                      <h3 className={`font-bold ${textMain}`}>Оборудование</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {shop.equipments.map(equipment => (
                        <span 
                          key={equipment.id}
                          className="px-4 py-2 bg-[#F5EFE6] text-[#B48C4B] rounded-xl text-sm font-semibold border border-[#B48C4B]/20"
                        >
                          {equipment.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Кофейные зёрна */}
                {shop.beans && shop.beans.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="material-symbols-outlined text-[#B48C4B]">energy</span>
                      <h3 className={`font-bold ${textMain}`}>Кофейные зёрна</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {shop.beans.map(bean => (
                        <span 
                          key={bean.id}
                          className="px-4 py-2 bg-[#F5EFE6] text-[#B48C4B] rounded-xl text-sm font-semibold border border-[#B48C4B]/20"
                        >
                          {bean.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Обжарщики */}
                {shop.roasters && shop.roasters.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="material-symbols-outlined text-[#B48C4B]">local_fire_department</span>
                      <h3 className={`font-bold ${textMain}`}>Обжарщики</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {shop.roasters.map(roaster => (
                        <span 
                          key={roaster.id}
                          className="px-4 py-2 bg-[#F5EFE6] text-[#B48C4B] rounded-xl text-sm font-semibold border border-[#B48C4B]/20"
                        >
                          {roaster.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Методы заваривания */}
                {shop.brewMethods && shop.brewMethods.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="material-symbols-outlined text-[#B48C4B]">water_drop</span>
                      <h3 className={`font-bold ${textMain}`}>Методы заваривания</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {shop.brewMethods.map(method => (
                        <span 
                          key={method.id}
                          className="px-4 py-2 bg-[#F5EFE6] text-[#B48C4B] rounded-xl text-sm font-semibold border border-[#B48C4B]/20"
                        >
                          {method.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          )}

          {/* Отзывы */}
          <div className="pt-8 border-t border-[#E8E4E1]">
            <div className="flex items-center justify-between mb-8">
              <h2 className={`text-2xl font-display font-bold ${textMain} flex items-center gap-3`}>
                <span className="w-1.5 h-8 bg-[#B48C4B] rounded-full" />
                Отзывы клиентов
              </h2>
              {user && (
                <button
                  onClick={() => onCreateReview ? onCreateReview(shopId) : setShowReviewModal(true)}
                  className="bg-[#F5EFE6] text-[#B48C4B] font-bold px-6 py-2.5 rounded-xl hover:bg-[#B48C4B] hover:text-white transition-all"
                >
                  Написать отзыв
                </button>
              )}
            </div>

            {isLoadingReviews ? (
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
                          <div className="w-12 h-12 rounded-full border-2 border-[#B48C4B]/20 overflow-hidden">
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
                          <div className="flex text-[#B48C4B]">
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
        </div>

        {/* Правая колонка */}
        <div className="col-span-12 lg:col-span-4 space-y-8">
          {/* Адрес и расписание */}
          <div className={`${cardBg} rounded-3xl border ${borderColor} overflow-hidden shadow-sm`}>
            <div className="p-8">
              <div className="flex items-start gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-[#F5EFE6] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#B48C4B]">pin_drop</span>
                </div>
                <div>
                  <h3 className={`font-bold ${textMain} mb-1`}>{shop.location?.address || shop.address || 'Адрес не указан'}</h3>
                  {(shop.location?.latitude && shop.location?.longitude) && (
                    <p className={`${textMuted} text-sm`}>
                      {shop.location.latitude.toFixed(6)}, {shop.location.longitude.toFixed(6)}
                    </p>
                  )}
                </div>
              </div>

              {shop.schedules && shop.schedules.length > 0 && (
                <div className={`space-y-4 pt-6 border-t ${borderColor}`}>
                  <div className={`flex items-center gap-4 ${textMain} font-bold`}>
                    <div className="w-12 h-12 rounded-2xl bg-[#F5EFE6] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[#B48C4B]">schedule</span>
                    </div>
                    <span>Часы работы</span>
                  </div>
                  <div className="space-y-3 ml-16 text-sm">
                    {shop.schedules.map((schedule) => {
                      const now = new Date();
                      const currentDay = now.getDay() === 0 ? 6 : now.getDay() - 1;
                      const isToday = schedule.dayOfWeek === currentDay;
                      
                      return (
                        <div 
                          key={schedule.dayOfWeek} 
                          className={`flex justify-between ${isToday ? 'font-bold text-[#B48C4B]' : textMuted}`}
                        >
                          <span>{isToday ? 'Сегодня' : formatDayOfWeek(schedule.dayOfWeek)}</span>
                          <span>{schedule.openTime} - {schedule.closeTime}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Модальное окно отзыва */}
      {showReviewModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className={`${cardBg} border ${borderColor} rounded-2xl max-w-md w-full p-6`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-xl font-bold ${textMain}`}>Оставить отзыв</h3>
              <button onClick={() => setShowReviewModal(false)} className={textMuted}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${textMain} mb-2`}>
                  Заголовок <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={reviewHeader}
                  onChange={(e) => setReviewHeader(e.target.value)}
                  className={`w-full p-3 rounded-lg ${cardBg} border ${borderColor} ${textMain} focus:outline-none focus:ring-2 focus:ring-[#B48C4B]`}
                  placeholder="Краткое описание"
                  maxLength={100}
                />
              </div>

              {/* Рейтинги */}
              {['Кофе', 'Сервис', 'Место'].map((category, idx) => {
                const rating = idx === 0 ? reviewRatingCoffee : idx === 1 ? reviewRatingService : reviewRatingPlace;
                const setRating = idx === 0 ? setReviewRatingCoffee : idx === 1 ? setReviewRatingService : setReviewRatingPlace;
                
                return (
                  <div key={category}>
                    <label className={`block text-sm font-medium ${textMain} mb-2`}>
                      ☕ Рейтинг {category.toLowerCase()} <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setRating(star)}
                          className={`text-3xl transition-transform hover:scale-110 ${
                            star <= rating ? 'text-[#B48C4B]' : `${textMuted} opacity-30`
                          }`}
                        >
                          ☕
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}

              <div>
                <label className={`block text-sm font-medium ${textMain} mb-2`}>
                  Комментарий <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className={`w-full p-3 rounded-lg ${cardBg} border ${borderColor} ${textMain} focus:outline-none focus:ring-2 focus:ring-[#B48C4B]`}
                  placeholder="Ваш подробный отзыв"
                  rows={4}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSubmitReview}
                  disabled={isSubmittingReview}
                  className="flex-1 bg-[#B48C4B] hover:bg-[#8E6F3A] text-white py-3 rounded-xl font-bold transition-all disabled:opacity-50"
                >
                  {isSubmittingReview ? 'Отправка...' : 'Отправить'}
                </button>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className={`flex-1 ${cardBg} border ${borderColor} ${textMain} py-3 rounded-xl font-bold transition-all`}
                >
                  Отмена
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Кнопка назад */}
      <div className="fixed bottom-8 left-8 z-40">
        <button
          onClick={onBack}
          className="bg-[#B48C4B] hover:bg-[#8E6F3A] text-white px-6 py-3 rounded-2xl font-bold shadow-lg transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined">arrow_back</span>
          Назад
        </button>
      </div>
    </div>
  );
};

export default CoffeeShopPage;

