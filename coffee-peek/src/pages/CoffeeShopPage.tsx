import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ShopDetailSkeleton } from '../components/skeletons';
import { PhotoGallery } from '../components/coffeeshop/PhotoGallery';
import { ShopHeader } from '../components/coffeeshop/ShopHeader';
import { ContactButtons } from '../components/coffeeshop/ContactButtons';
import { ReviewsSection } from '../components/coffeeshop/ReviewsSection';
import { ShopSidebar } from '../components/coffeeshop/ShopSidebar';
import CheckInModal from '../components/CheckInModal';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/theme';
import { useUser } from '../contexts/UserContext';
import { useToast } from '../contexts/ToastContext';
import { useShopData } from '../hooks/useShopData';
import { useMyReview } from '../hooks/useMyReview';
import { useUsersCache } from '../hooks/useUsersCache';
import { useToggleFavorite } from '../hooks/queries/useFavorites';
import { TokenManager } from '../api/core/httpClient';
import { logger } from '../utils/logger';
import { usePageTitle } from '../hooks/usePageTitle';

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
  const { myReviewId } = useMyReview(shop);
  
  // Устанавливаем title с названием кофейни
  usePageTitle(shop?.name || 'Кофейня');
  
  // Favorite logic
  const token = user ? TokenManager.getAccessToken() : null;
  const { toggle, isLoading: isTogglingFavorite } = useToggleFavorite();
  const isFavorite = shop?.isFavorite ?? false;
  
  const handleToggleFavorite = async () => {
    if (!user) {
      showToast('Необходимо войти в систему', 'error');
      return;
    }

    if (!shopId || !token) return;

    try {
      await toggle({ shopId, isFavorite, token });
      showToast(
        isFavorite ? 'Удалено из избранного' : 'Добавлено в избранное',
        'success'
      );
      await reloadShop();
    } catch (err: unknown) {
      logger.error('Error toggling favorite:', err);
      showToast('Не удалось изменить статус избранного', 'error');
    }
  };
  
  // Check-in modal state
  const [showCheckInModal, setShowCheckInModal] = useState(false);

  const tc = getThemeClasses(theme);
  const bgClass = tc.bg.primary;
  const textMain = tc.text.primary;
  const textMuted = tc.text.secondary;
  const cardBg = tc.bg.card;
  const borderColor = tc.border.default;
  
  // Получаем отзывы из shop (приходят с бэкенда в CoffeeShopDetailsDto)
  const reviews = shop?.reviews || [];
  const reviewsTotalCount = shop?.reviewCount || 0;
  const usersCache = useUsersCache(reviews);


  const handleWriteOrEditReview = () => {
    if (!user || !shopId || !shop) return;
    
    const shopBasicInfo = {
      name: shop.name,
      address: shop.location?.address || 'Адрес не указан',
      photo: shop.photos && shop.photos.length > 0 ? shop.photos[0].fullUrl || '' : '',
      averageRating: shop.rating
    };
    
    if (myReviewId) {
      navigate(`/shops/${shopId}/reviews/${myReviewId}/edit`, { state: { shop: shopBasicInfo } });
    } else {
      navigate(`/shops/${shopId}/reviews/new`, { state: { shop: shopBasicInfo } });
    }
  };

  const handleCheckIn = () => {
    if (!shopId || !shop) return;
    
    // Если пользователь неавторизован, редиректим на регистрацию
    if (!user) {
      navigate('/register');
      return;
    }
    
    // Если авторизован, открываем модальное окно
    setShowCheckInModal(true);
  };

  const handleCheckInSuccess = async () => {
    // Обновляем данные кофейни после успешного чекина
    await reloadShop();
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
            className="bg-[#EAB308] hover:bg-[#FACC15] text-[#1A1412] px-6 py-3 rounded-2xl font-bold transition-all"
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
      {shop && shop.photos && shop.photos.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-8">
          <div className="grid grid-cols-12 grid-rows-2 gap-4 h-[500px]">
            <PhotoGallery shop={shop} cardBg={cardBg} borderColor={borderColor} textMuted={textMuted} />
          </div>
        </section>
      )}

      {shop && (
        <section className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-12 gap-12">
          <div className="col-span-12 lg:col-span-8 space-y-12">
            <div>
              <ShopHeader
                shop={shop}
                avgRating={avgRating}
                reviewsTotalCount={reviewsTotalCount}
                isFavorite={isFavorite}
                isCheckingFavorite={isTogglingFavorite}
                onToggleFavorite={handleToggleFavorite}
                onCheckIn={handleCheckIn}
                textMain={textMain}
                textMuted={textMuted}
                borderColor={borderColor}
              />

              <ContactButtons
                shop={shop}
                cardBg={cardBg}
                borderColor={borderColor}
                textMain={textMain}
              />
            </div>

          {/* Описание */}
          {shop.description && (
            <div className={`${cardBg} p-6 rounded-3xl border ${borderColor}`}>
              <h2 className={`text-2xl font-display font-bold ${textMain} flex items-center gap-3 mb-4`}>
                <span className="w-1.5 h-8 bg-[#D4A84B] rounded-full" />
                О кофейне
              </h2>
              <p className={`${textMuted} leading-relaxed`}>{shop.description}</p>
            </div>
          )}

          {/* Контакты */}
          {shop.shopContact && (shop.shopContact.phone || shop.shopContact.email || shop.shopContact.website || shop.shopContact.instagram) && (
            <div className={`${cardBg} p-6 rounded-3xl border ${borderColor}`}>
              <h2 className={`text-2xl font-display font-bold ${textMain} flex items-center gap-3 mb-4`}>
                <span className="w-1.5 h-8 bg-[#D4A84B] rounded-full" />
                Контакты
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {shop.shopContact.phone && (
                  <a 
                    href={`tel:${shop.shopContact.phone}`}
                    className={`flex items-center gap-3 p-4 rounded-2xl border ${borderColor} hover:border-[#D4A84B]/50 ${textMuted} hover:text-[#D4A84B] transition-all`}
                  >
                    <span className="material-symbols-rounded text-[#D4A84B]">call</span>
                    <span className="font-medium break-all">{shop.shopContact.phone}</span>
                  </a>
                )}
                {shop.shopContact.email && (
                  <a 
                    href={`mailto:${shop.shopContact.email}`}
                    className={`flex items-center gap-3 p-4 rounded-2xl border ${borderColor} hover:border-[#D4A84B]/50 ${textMuted} hover:text-[#D4A84B] transition-all`}
                  >
                    <span className="material-symbols-rounded text-[#D4A84B]">mail</span>
                    <span className="font-medium break-all">{shop.shopContact.email}</span>
                  </a>
                )}
                {shop.shopContact.website && (
                  <a 
                    href={shop.shopContact.website.startsWith('http') ? shop.shopContact.website : `https://${shop.shopContact.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-3 p-4 rounded-2xl border ${borderColor} hover:border-[#D4A84B]/50 ${textMuted} hover:text-[#D4A84B] transition-all`}
                  >
                    <span className="material-symbols-rounded text-[#D4A84B]">language</span>
                    <span className="font-medium break-all">{shop.shopContact.website}</span>
                  </a>
                )}
                {shop.shopContact.instagram && (
                  <a 
                    href={shop.shopContact.instagram.startsWith('http') ? shop.shopContact.instagram : `https://instagram.com/${shop.shopContact.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-3 p-4 rounded-2xl border ${borderColor} hover:border-[#D4A84B]/50 ${textMuted} hover:text-[#D4A84B] transition-all`}
                  >
                    <span className="material-symbols-rounded text-[#D4A84B]">photo_camera</span>
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
                <span className="w-1.5 h-8 bg-[#D4A84B] rounded-full" />
                Детали кофе
              </h2>
              
              <div className={`${cardBg} p-6 rounded-3xl border ${borderColor}`}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Оборудование */}
                {shop.equipments && shop.equipments.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="material-symbols-rounded text-[#D4A84B]">precision_manufacturing</span>
                      <h3 className={`font-bold ${textMain}`}>Оборудование</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {shop.equipments.map(equipment => (
                        <span 
                          key={equipment.id}
                          className="px-4 py-2 bg-[#F8F1DD] text-[#D4A84B] rounded-xl text-sm font-semibold border border-[#D4A84B]/20"
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
                      <span className="material-symbols-rounded text-[#D4A84B]">energy</span>
                      <h3 className={`font-bold ${textMain}`}>Кофейные зёрна</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {shop.beans.map(bean => (
                        <span 
                          key={bean.id}
                          className="px-4 py-2 bg-[#F8F1DD] text-[#D4A84B] rounded-xl text-sm font-semibold border border-[#D4A84B]/20"
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
                      <span className="material-symbols-rounded text-[#D4A84B]">local_fire_department</span>
                      <h3 className={`font-bold ${textMain}`}>Обжарщики</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {shop.roasters.map(roaster => (
                        <span 
                          key={roaster.id}
                          className="px-4 py-2 bg-[#F8F1DD] text-[#D4A84B] rounded-xl text-sm font-semibold border border-[#D4A84B]/20"
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
                      <span className="material-symbols-rounded text-[#D4A84B]">water_drop</span>
                      <h3 className={`font-bold ${textMain}`}>Методы заваривания</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {shop.brewMethods.map(method => (
                        <span 
                          key={method.id}
                          className="px-4 py-2 bg-[#F8F1DD] text-[#D4A84B] rounded-xl text-sm font-semibold border border-[#D4A84B]/20"
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
              isLoading={isLoading}
              myReviewId={myReviewId}
              isCheckingMyReview={false}
              onWriteOrEditReview={handleWriteOrEditReview}
              onUserSelect={(userId) => navigate(`/users/${userId}`)}
              user={user}
              textMain={textMain}
              textMuted={textMuted}
              cardBg={cardBg}
              borderColor={borderColor}
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
            />
          </div>
        </section>
      )}

      {/* Кнопка назад */}
      <div className="fixed bottom-8 left-8 z-40">
        <button
          onClick={() => navigate('/shops')}
          className="bg-[#EAB308] hover:bg-[#FACC15] text-[#1A1412] px-6 py-3 rounded-2xl font-bold shadow-lg transition-all flex items-center gap-2"
        >
          <span className="material-symbols-rounded">arrow_back</span>
          Назад
        </button>
      </div>

      {/* Check-in Modal */}
      <CheckInModal
        isOpen={showCheckInModal}
        onClose={() => setShowCheckInModal(false)}
        shop={shop || null}
        onSuccess={handleCheckInSuccess}
      />
    </div>
  );
};

export default CoffeeShopPage;

