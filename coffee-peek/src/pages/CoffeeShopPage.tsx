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
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useToast } from '../contexts/ToastContext';
import { useShopData } from '../hooks/useShopData';
import { useMyReview } from '../hooks/useMyReview';
import { useUsersCache } from '../hooks/useUsersCache';
import { useLocalFavorites } from '../hooks/useLocalFavorites';
import { usePageTitle } from '../hooks/usePageTitle';
import { AppIcon } from '../components/icons';

const CoffeeShopPage: React.FC = () => {
  const { shopId } = useParams<{ shopId: string }>();
  const navigate = useNavigate();
  
  if (!shopId) {
    navigate('/shops');
    return null;
  }
  const { theme } = useTheme();
  const { user, requireAuth } = useRequireAuth();
  const { showToast } = useToast();
  
  // Custom hooks
  const { shop, isLoading, error, reloadShop } = useShopData(shopId);
  const { myReviewId } = useMyReview(shop);
  
  // Устанавливаем title с названием кофейни
  usePageTitle(shop?.name || 'Кофейня');
  
  // Local-only favorites (device storage, no API)
  const { isFavorite, toggleFavorite } = useLocalFavorites();
  const shopIsFavorite = isFavorite(shopId);
  
  const handleToggleFavorite = () => {
    const nowFavorite = toggleFavorite(shopId);
    showToast(
      nowFavorite ? 'Добавлено в избранное' : 'Удалено из избранного',
      'success'
    );
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
    if (!requireAuth()) return;
    if (!shopId || !shop) return;
    
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
    if (!requireAuth()) return;
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
        <section className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-12 gap-12 items-start">
          <div className="col-span-12 lg:col-span-8 space-y-12">
            <div>
              <ShopHeader
                shop={shop}
                avgRating={avgRating}
                reviewsTotalCount={reviewsTotalCount}
                isFavorite={shopIsFavorite}
                isCheckingFavorite={false}
                onToggleFavorite={handleToggleFavorite}
                onCheckIn={handleCheckIn}
                textMain={textMain}
                textMuted={textMuted}
                borderColor={borderColor}
              />

              {shop.tags && shop.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4">
                  {shop.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-display font-semibold border ${borderColor} ${textMuted}`}
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
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
          <ContactButtons
            shop={shop}
            cardBg={cardBg}
            borderColor={borderColor}
            textMain={textMain}
            textMuted={textMuted}
          />

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
                      <AppIcon name="precision_manufacturing" size={24} color="#D4A84B" />
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
                      <AppIcon name="energy" size={24} color="#D4A84B" />
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
                      <AppIcon name="local_fire_department" size={24} color="#D4A84B" />
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
                      <AppIcon name="water_drop" size={24} color="#D4A84B" />
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
          <div className="col-span-12 lg:col-span-4 space-y-8 self-start">
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
          <AppIcon name="arrow_back" size={24} />
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

