import React from 'react';
import { DetailedCoffeeShop, formatEquipmentName, getEquipmentCategoryLabel } from '../api/coffeeshop';
import PhotoCarousel from './PhotoCarousel';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/theme';

interface CoffeeShopModalProps {
  shop: DetailedCoffeeShop | null;
  isOpen: boolean;
  onClose: () => void;
}

const CoffeeShopModal: React.FC<CoffeeShopModalProps> = ({ shop, isOpen, onClose }) => {
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  if (!isOpen || !shop) return null;

  // Функция для извлечения URL фотографий из различных форматов
  const extractPhotoUrls = (): string[] => {
    const urls: string[] = [];
    
    // Проверяем shop.photos (новый формат - PhotoMetadataDto[])
    if (shop.photos && Array.isArray(shop.photos)) {
      shop.photos.forEach((photo: any) => {
        if (photo && typeof photo === 'object') {
          // Если это объект с fullUrl
          if ('fullUrl' in photo && typeof photo.fullUrl === 'string' && photo.fullUrl.trim()) {
            urls.push(photo.fullUrl.trim());
          }
        } else if (typeof photo === 'string' && photo.trim()) {
          // Если это уже строка
          urls.push(photo.trim());
        }
      });
    }
    
    // Проверяем shop.imageUrls (старый формат)
    if ((shop as any).imageUrls && Array.isArray((shop as any).imageUrls)) {
      (shop as any).imageUrls.forEach((url: any) => {
        if (typeof url === 'string' && url.trim()) {
          urls.push(url.trim());
        } else if (url && typeof url === 'object' && 'fullUrl' in url && typeof url.fullUrl === 'string' && url.fullUrl.trim()) {
          urls.push(url.fullUrl.trim());
        }
      });
    }
    
    // Удаляем дубликаты
    return [...new Set(urls)];
  };

  const photoUrls = extractPhotoUrls();
  
  // Отладочная информация
  if (process.env.NODE_ENV === 'development') {
    console.log('CoffeeShopModal - Shop data:', {
      shopName: shop.name,
      hasPhotos: !!shop.photos,
      photosCount: shop.photos?.length || 0,
      photosData: shop.photos,
      hasImageUrls: !!(shop as any).imageUrls,
      imageUrlsCount: (shop as any).imageUrls?.length || 0,
      extractedUrls: photoUrls,
      extractedUrlsCount: photoUrls.length
    });
  }

  const formatPriceRange = (priceRange: string) => {
    switch (priceRange) {
      case 'Budget':
        return '💰';
      case 'Moderate':
        return '💰💰';
      case 'Premium':
        return '💰💰💰';
      default:
        return priceRange;
    }
  };

  const formatDayOfWeek = (day: number) => {
    const days = [
      'Воскресенье', 'Понедельник', 'Вторник', 'Среда', 
      'Четверг', 'Пятница', 'Суббота'
    ];
    return days[day] || '';
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className={`${themeClasses.bg.card} border ${themeClasses.border.default} rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className={`text-2xl font-bold ${themeClasses.text.primary}`}>{shop.name}</h2>
            <button
              onClick={onClose}
              className={`${themeClasses.text.secondary} ${theme === 'dark' ? 'hover:text-white' : 'hover:text-gray-900'} text-xl`}
            >
              ✕
            </button>
          </div>

          {/* Фотографии кофейни */}
          {photoUrls.length > 0 ? (
            <div className="mb-6">
              <h3 className={`text-lg font-semibold ${themeClasses.text.primary} mb-3 flex items-center gap-2`}>
                <span>📸</span>
                <span>Фотографии кофейни</span>
                <span className={`text-sm font-normal ${themeClasses.text.secondary}`}>
                  ({photoUrls.length} {photoUrls.length === 1 ? 'фото' : photoUrls.length < 5 ? 'фото' : 'фотографий'})
                </span>
              </h3>
              <div className={`rounded-xl overflow-hidden border ${themeClasses.border.default} bg-gray-900 min-h-[300px]`}>
                <PhotoCarousel images={photoUrls} shopName={shop.name} isCardView={false} />
              </div>
            </div>
          ) : (
            // Показываем сообщение, если фотографий нет (для отладки)
            process.env.NODE_ENV === 'development' && (
              <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-yellow-500 text-sm">
                  ⚠️ Фотографии не найдены. Проверьте консоль для отладки.
                </p>
              </div>
            )
          )}

          {/* Main shop info */}
          <div className="mb-6">

            {/* Header info with rating, price, status */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="text-[#EAB308] text-xl">⭐</span>
                <span className={`${themeClasses.text.primary} font-semibold text-lg`}>{(shop.rating || 0).toFixed(1)}</span>
                <span className={`${themeClasses.text.secondary} text-sm`}>({shop.reviewCount || 0} {shop.reviewCount === 1 ? 'отзыв' : shop.reviewCount < 5 ? 'отзыва' : 'отзывов'})</span>
              </div>
              <div className="flex items-center gap-1 text-lg">
                {formatPriceRange(shop.priceRange || '')}
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                shop.isOpen 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {shop.isOpen ? '🟢 Открыто' : '🔴 Закрыто'}
              </span>
            </div>

            {/* Address and location */}
            {shop.location && (
              <div className={`mb-4 p-3 ${themeClasses.bg.tertiary} rounded-lg border ${themeClasses.border.default}`}>
                <div className="flex items-start gap-2">
                  <span className="text-xl">📍</span>
                  <div className="flex-1">
                    {shop.location.address && (
                      <p className={`${themeClasses.text.primary} font-medium mb-1`}>{shop.location.address}</p>
                    )}
                    {shop.location.latitude && shop.location.longitude && (
                      <p className={`${themeClasses.text.secondary} text-xs`}>
                        Координаты: {shop.location.latitude.toFixed(6)}, {shop.location.longitude.toFixed(6)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            {shop.description && (
              <div className={`mb-4 p-3 ${themeClasses.bg.tertiary} rounded-lg border ${themeClasses.border.default}`}>
                <h3 className={`text-sm font-semibold ${themeClasses.text.primary} mb-2`}>О кофейне</h3>
                <p className={`${themeClasses.text.secondary} leading-relaxed`}>{shop.description}</p>
              </div>
            )}
          </div>

          {/* Contact info */}
          {shop.shopContact && (shop.shopContact.phone || shop.shopContact.email || shop.shopContact.website || shop.shopContact.instagram) && (
            <div className={`mb-6 p-4 ${themeClasses.bg.tertiary} rounded-lg border ${themeClasses.border.default}`}>
              <h3 className={`text-lg font-semibold ${themeClasses.text.primary} mb-3 flex items-center gap-2`}>
                <span>📞</span>
                <span>Контакты</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {shop.shopContact.phone && (
                  <a 
                    href={`tel:${shop.shopContact.phone}`}
                    className={`flex items-center gap-2 ${themeClasses.text.secondary} hover:${themeClasses.text.primary} transition-colors`}
                  >
                    <span className="text-lg">📞</span>
                    <span className="break-all">{shop.shopContact.phone}</span>
                  </a>
                )}
                {shop.shopContact.email && (
                  <a 
                    href={`mailto:${shop.shopContact.email}`}
                    className={`flex items-center gap-2 ${themeClasses.text.secondary} hover:${themeClasses.text.primary} transition-colors`}
                  >
                    <span className="text-lg">✉️</span>
                    <span className="break-all">{shop.shopContact.email}</span>
                  </a>
                )}
                {shop.shopContact.website && (
                  <a 
                    href={shop.shopContact.website.startsWith('http') ? shop.shopContact.website : `https://${shop.shopContact.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-2 ${themeClasses.text.secondary} hover:${themeClasses.text.primary} transition-colors`}
                  >
                    <span className="text-lg">🌐</span>
                    <span className="break-all">{shop.shopContact.website}</span>
                  </a>
                )}
                {shop.shopContact.instagram && (
                  <a 
                    href={shop.shopContact.instagram.startsWith('http') ? shop.shopContact.instagram : `https://instagram.com/${shop.shopContact.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-2 ${themeClasses.text.secondary} hover:${themeClasses.text.primary} transition-colors`}
                  >
                    <span className="text-lg">📱</span>
                    <span className="break-all">{shop.shopContact.instagram}</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Coffee details grid */}
          {(shop.equipments?.length > 0 || shop.beans?.length > 0 || shop.roasters?.length > 0 || shop.brewMethods?.length > 0) && (
            <div className={`mb-6 p-4 ${themeClasses.bg.tertiary} rounded-lg border ${themeClasses.border.default}`}>
              <h3 className={`text-lg font-semibold ${themeClasses.text.primary} mb-4 flex items-center gap-2`}>
                <span>☕</span>
                <span>Детали кофе</span>
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Equipment */}
                {shop.equipments && shop.equipments.length > 0 && (
                  <div className="sm:col-span-2">
                    <h4 className={`text-sm font-medium ${themeClasses.text.primary} mb-2`}>⚙️ Оборудование</h4>
                    <div className="flex flex-wrap gap-2">
                      {shop.equipments.map(equipment => (
                        <span 
                          key={equipment.id}
                          className={`px-3 py-1.5 ${themeClasses.bg.primary} border ${themeClasses.border.default} text-[#EAB308] rounded-lg text-sm font-medium`}
                          title={`${getEquipmentCategoryLabel(equipment.category)}${equipment.brand ? ` · ${equipment.brand}` : ''}${equipment.model ? ` ${equipment.model}` : ''}`}
                        >
                          {formatEquipmentName(equipment)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Coffee beans */}
                {shop.beans && shop.beans.length > 0 && (
                  <div>
                    <h4 className={`text-sm font-medium ${themeClasses.text.primary} mb-2`}>🌱 Кофейные зёрна</h4>
                    <div className="flex flex-wrap gap-2">
                      {shop.beans.map(bean => (
                        <span 
                          key={bean.id}
                          className={`px-3 py-1.5 ${themeClasses.bg.primary} border ${themeClasses.border.default} text-[#EAB308] rounded-lg text-sm font-medium`}
                        >
                          {bean.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Roasters */}
                {shop.roasters && shop.roasters.length > 0 && (
                  <div>
                    <h4 className={`text-sm font-medium ${themeClasses.text.primary} mb-2`}>🔥 Обжарщики</h4>
                    <div className="flex flex-wrap gap-2">
                      {shop.roasters.map(roaster => (
                        <span 
                          key={roaster.id}
                          className={`px-3 py-1.5 ${themeClasses.bg.primary} border ${themeClasses.border.default} text-[#EAB308] rounded-lg text-sm font-medium`}
                        >
                          {roaster.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Brew methods */}
                {shop.brewMethods && shop.brewMethods.length > 0 && (
                  <div>
                    <h4 className={`text-sm font-medium ${themeClasses.text.primary} mb-2`}>💧 Методы заваривания</h4>
                    <div className="flex flex-wrap gap-2">
                      {shop.brewMethods.map(method => (
                        <span 
                          key={method.id}
                          className={`px-3 py-1.5 ${themeClasses.bg.primary} border ${themeClasses.border.default} text-[#EAB308] rounded-lg text-sm font-medium`}
                        >
                          {method.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Schedule */}
          {shop.schedules && shop.schedules.length > 0 && (
            <div className={`p-4 ${themeClasses.bg.tertiary} rounded-lg border ${themeClasses.border.default}`}>
              <h3 className={`text-lg font-semibold ${themeClasses.text.primary} mb-3 flex items-center gap-2`}>
                <span>🕐</span>
                <span>Расписание работы</span>
              </h3>
              <div className="space-y-2">
                {shop.schedules.map(schedule => {
                  const isToday = new Date().getDay() === schedule.dayOfWeek;
                  return (
                    <div 
                      key={schedule.dayOfWeek} 
                      className={`flex justify-between items-center py-2 px-3 rounded-lg ${
                        isToday ? `${themeClasses.bg.primary} border ${themeClasses.border.default}` : ''
                      }`}
                    >
                      <span className={`${isToday ? themeClasses.text.primary : themeClasses.text.secondary} font-medium`}>
                        {formatDayOfWeek(schedule.dayOfWeek)}
                        {isToday && <span className="ml-2 text-xs text-[#EAB308]">(сегодня)</span>}
                      </span>
                      <span className={`${isToday ? themeClasses.text.primary : themeClasses.text.secondary} font-semibold`}>
                        {schedule.openTime && schedule.closeTime 
                          ? `${schedule.openTime} - ${schedule.closeTime}`
                          : <span className="text-red-400">Закрыто</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoffeeShopModal;