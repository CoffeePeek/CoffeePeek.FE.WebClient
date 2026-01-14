import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  createReview,
  CreateReviewRequest,
} from '../api/coffeeshop';
import { ShopDetailSkeleton } from '../components/skeletons';
import { PhotoGallery } from '../components/coffeeshop/PhotoGallery';
import { ShopHeader } from '../components/coffeeshop/ShopHeader';
import { ContactButtons } from '../components/coffeeshop/ContactButtons';
import { ReviewsSection } from '../components/coffeeshop/ReviewsSection';
import { ShopSidebar } from '../components/coffeeshop/ShopSidebar';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { useToast } from '../contexts/ToastContext';
import { useShopData } from '../hooks/useShopData';
import { useShopReviews } from '../hooks/useShopReviews';
import { useFavoriteStatus } from '../hooks/useFavoriteStatus';
import { useMyReview } from '../hooks/useMyReview';
import { useUsersCache } from '../hooks/useUsersCache';

const CoffeeShopPage: React.FC = () => {
  const { shopId } = useParams<{ shopId: string }>();
  const navigate = useNavigate();
  
  if (!shopId) {
    navigate('/shops');
    return null;
  }
  const { theme } = useTheme();
  const { user } = useUser();
  const { showToast } = useToast();
  
  // Custom hooks
  const { shop, isLoading, error, reloadShop } = useShopData(shopId);
  const { reviews, isLoading: isLoadingReviews, totalCount: reviewsTotalCount, reloadReviews } = useShopReviews(shopId, 1, 10);
  const { isFavorite, isChecking: isCheckingFavorite, toggleFavorite } = useFavoriteStatus(shopId);
  const { myReviewId, isChecking: isCheckingMyReview } = useMyReview(shopId);
  const usersCache = useUsersCache(reviews);
  
  // Legacy modal state (for backward compatibility)
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

  const handleWriteOrEditReview = () => {
    if (!user || !shopId) return;
    if (myReviewId) {
      navigate(`/shops/${shopId}/reviews/${myReviewId}/edit`);
    } else {
      navigate(`/shops/${shopId}/reviews/new`);
    }
  };

  const handleSubmitReview = async () => {
    if (!user || !shopId) {
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
        
        // Перезагружаем данные
        await reloadShop();
        await reloadReviews();
      }
    } catch (err: any) {
      console.error('Error submitting review:', err);
      showToast('Не удалось отправить отзыв', 'error');
    } finally {
      setIsSubmittingReview(false);
    }
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
            onClick={() => navigate('/shops')}
            className="bg-[#B48C4B] hover:bg-[#8E6F3A] text-white px-6 py-3 rounded-2xl font-bold transition-all"
          >
            Вернуться назад
          </button>
        </div>
      </div>
    );
  }

  const avgRating = shop?.rating || 0;

  return (
    <div className={`min-h-screen ${bgClass} font-body`}>
      {/* Галерея фотографий */}
      {shop && (
        <section className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-12 grid-rows-2 gap-4 h-[500px]">
            <PhotoGallery shop={shop} cardBg={cardBg} borderColor={borderColor} textMuted={textMuted} />
          </div>
        </section>
      )}

      {/* Основной контент */}
      {shop && (
        <section className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-12 gap-12">
          {/* Левая колонка */}
          <div className="col-span-12 lg:col-span-8 space-y-12">
            {/* Заголовок и действия */}
            <div>
              <ShopHeader
                shop={shop}
                avgRating={avgRating}
                reviewsTotalCount={reviewsTotalCount}
                isFavorite={isFavorite}
                isCheckingFavorite={isCheckingFavorite}
                onToggleFavorite={toggleFavorite}
                textMain={textMain}
                textMuted={textMuted}
                borderColor={borderColor}
                primary={primary}
              />

              <ContactButtons
                shop={shop}
                cardBg={cardBg}
                borderColor={borderColor}
                textMain={textMain}
                primary={primary}
                primaryHover={primaryHover}
              />
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
            <ReviewsSection
              reviews={reviews}
              usersCache={usersCache}
              isLoading={isLoadingReviews}
              myReviewId={myReviewId}
              isCheckingMyReview={isCheckingMyReview}
              onWriteOrEditReview={handleWriteOrEditReview}
              onUserSelect={(userId) => navigate(`/users/${userId}`)}
              user={user}
              textMain={textMain}
              textMuted={textMuted}
              cardBg={cardBg}
              borderColor={borderColor}
              primary={primary}
            />
          </div>

          {/* Правая колонка */}
          <div className="col-span-12 lg:col-span-4 space-y-8">
            <ShopSidebar
              shop={shop}
              textMain={textMain}
              textMuted={textMuted}
              cardBg={cardBg}
              borderColor={borderColor}
              primary={primary}
            />
          </div>
        </section>
      )}

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
          onClick={() => navigate('/shops')}
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

