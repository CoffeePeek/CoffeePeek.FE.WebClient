import React from 'react';
import { DetailedCoffeeShop, formatEquipmentName, getEquipmentCategoryLabel } from '../api/coffeeshop';
import PhotoCarousel from './PhotoCarousel';
import ShopPhotoPlaceholder from './ShopPhotoPlaceholder';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/theme';
import { getPriceRangeTier } from '../utils/priceRange';
import { formatDayOfWeek, getCurrentDayOfWeek, normalizeDayOfWeek } from '../utils/shopUtils';
import {
  X, Camera, Star, MapPin, Phone, Envelope, Globe, DeviceMobile,
  Coffee, Gear, Leaf, Flame, Drop, Clock, Circle, PriceRangeLabel,
} from '@/components/Icon';

interface CoffeeShopModalProps {
  shop: DetailedCoffeeShop | null;
  isOpen: boolean;
  onClose: () => void;
}

const CoffeeShopModal: React.FC<CoffeeShopModalProps> = ({ shop, isOpen, onClose }) => {
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  if (!isOpen || !shop) return null;

  const extractPhotoUrls = (): string[] => {
    const urls: string[] = [];

    if (shop.photos && Array.isArray(shop.photos)) {
      shop.photos.forEach((photo: unknown) => {
        if (photo && typeof photo === 'object' && 'fullUrl' in photo && typeof (photo as { fullUrl: unknown }).fullUrl === 'string') {
          const url = (photo as { fullUrl: string }).fullUrl.trim();
          if (url) urls.push(url);
        } else if (typeof photo === 'string' && photo.trim()) {
          urls.push(photo.trim());
        }
      });
    }

    const legacy = shop as DetailedCoffeeShop & { imageUrls?: unknown[] };
    if (legacy.imageUrls && Array.isArray(legacy.imageUrls)) {
      legacy.imageUrls.forEach((url: unknown) => {
        if (typeof url === 'string' && url.trim()) {
          urls.push(url.trim());
        } else if (url && typeof url === 'object' && 'fullUrl' in url && typeof (url as { fullUrl: unknown }).fullUrl === 'string') {
          const fullUrl = (url as { fullUrl: string }).fullUrl.trim();
          if (fullUrl) urls.push(fullUrl);
        }
      });
    }

    return [...new Set(urls)];
  };

  const photoUrls = extractPhotoUrls();

  const priceLevel = getPriceRangeTier(shop.priceRange);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className={`${themeClasses.bg.card} border ${themeClasses.border.default} rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}>
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className={`text-2xl font-bold ${themeClasses.text.primary}`}>{shop.name}</h2>
            <button
              onClick={onClose}
              className={`${themeClasses.text.secondary} ${theme === 'dark' ? 'hover:text-white' : 'hover:text-gray-900'} flex items-center justify-center`}
              aria-label="Закрыть"
            >
              <X size={24} />
            </button>
          </div>

          {photoUrls.length > 0 ? (
            <div className="mb-6">
              <h3 className={`text-lg font-semibold ${themeClasses.text.primary} mb-3 flex items-center gap-2`}>
                <Camera size={20} />
                <span>Фотографии кофейни</span>
                <span className={`text-sm font-normal ${themeClasses.text.secondary}`}>
                  ({photoUrls.length} {photoUrls.length === 1 ? 'фото' : photoUrls.length < 5 ? 'фото' : 'фотографий'})
                </span>
              </h3>
              <div className={`rounded-xl overflow-hidden border ${themeClasses.border.default} min-h-[300px]`}>
                <PhotoCarousel images={photoUrls} shopName={shop.name} isCardView={false} />
              </div>
            </div>
          ) : (
            <div className={`mb-6 rounded-xl overflow-hidden border ${themeClasses.border.default} h-[220px]`}>
              <ShopPhotoPlaceholder fontSize={24} />
            </div>
          )}

          <div className="mb-6">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <div className="flex items-center gap-2">
                <Star size={20} weight="fill" color="#EAB308" />
                <span className={`${themeClasses.text.primary} font-semibold text-lg`}>{(shop.rating || 0).toFixed(1)}</span>
                <span className={`${themeClasses.text.secondary} text-sm`}>({shop.reviewCount || 0} {shop.reviewCount === 1 ? 'отзыв' : shop.reviewCount < 5 ? 'отзыва' : 'отзывов'})</span>
              </div>
              {priceLevel && (
                <div className="flex items-center gap-1 text-lg">
                  <PriceRangeLabel level={priceLevel} />
                </div>
              )}
              <span className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center gap-1.5 ${
                shop.isOpen
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                <Circle size={8} weight="fill" color={shop.isOpen ? '#22C55E' : '#EF4444'} />
                {shop.isOpen ? 'Открыто' : 'Закрыто'}
              </span>
            </div>

            {shop.location && (
              <div className={`mb-4 p-3 ${themeClasses.bg.tertiary} rounded-lg border ${themeClasses.border.default}`}>
                <div className="flex items-start gap-2">
                  <MapPin size={20} className="shrink-0 mt-0.5" color="#EAB308" />
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

            {shop.description && (
              <div className={`mb-4 p-3 ${themeClasses.bg.tertiary} rounded-lg border ${themeClasses.border.default}`}>
                <h3 className={`text-sm font-semibold ${themeClasses.text.primary} mb-2`}>О кофейне</h3>
                <p className={`${themeClasses.text.secondary} leading-relaxed`}>{shop.description}</p>
              </div>
            )}
          </div>

          {shop.shopContact && (shop.shopContact.phone || shop.shopContact.email || shop.shopContact.website || shop.shopContact.instagram) && (
            <div className={`mb-6 p-4 ${themeClasses.bg.tertiary} rounded-lg border ${themeClasses.border.default}`}>
              <h3 className={`text-lg font-semibold ${themeClasses.text.primary} mb-3 flex items-center gap-2`}>
                <Phone size={20} />
                <span>Контакты</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {shop.shopContact.phone && (
                  <a
                    href={`tel:${shop.shopContact.phone}`}
                    className={`flex items-center gap-2 ${themeClasses.text.secondary} hover:${themeClasses.text.primary} transition-colors`}
                  >
                    <Phone size={18} />
                    <span className="break-all">{shop.shopContact.phone}</span>
                  </a>
                )}
                {shop.shopContact.email && (
                  <a
                    href={`mailto:${shop.shopContact.email}`}
                    className={`flex items-center gap-2 ${themeClasses.text.secondary} hover:${themeClasses.text.primary} transition-colors`}
                  >
                    <Envelope size={18} />
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
                    <Globe size={18} />
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
                    <DeviceMobile size={18} />
                    <span className="break-all">{shop.shopContact.instagram}</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {(shop.equipments?.length > 0 || shop.beans?.length > 0 || shop.roasters?.length > 0 || shop.brewMethods?.length > 0) && (
            <div className={`mb-6 p-4 ${themeClasses.bg.tertiary} rounded-lg border ${themeClasses.border.default}`}>
              <h3 className={`text-lg font-semibold ${themeClasses.text.primary} mb-4 flex items-center gap-2`}>
                <Coffee size={20} />
                <span>Детали кофе</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {shop.equipments && shop.equipments.length > 0 && (
                  <div className="sm:col-span-2">
                    <h4 className={`text-sm font-medium ${themeClasses.text.primary} mb-2 flex items-center gap-1.5`}>
                      <Gear size={16} /> Оборудование
                    </h4>
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

                {shop.beans && shop.beans.length > 0 && (
                  <div>
                    <h4 className={`text-sm font-medium ${themeClasses.text.primary} mb-2 flex items-center gap-1.5`}>
                      <Leaf size={16} /> Кофейные зёрна
                    </h4>
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

                {shop.roasters && shop.roasters.length > 0 && (
                  <div>
                    <h4 className={`text-sm font-medium ${themeClasses.text.primary} mb-2 flex items-center gap-1.5`}>
                      <Flame size={16} /> Обжарщики
                    </h4>
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

                {shop.brewMethods && shop.brewMethods.length > 0 && (
                  <div>
                    <h4 className={`text-sm font-medium ${themeClasses.text.primary} mb-2 flex items-center gap-1.5`}>
                      <Drop size={16} /> Методы заваривания
                    </h4>
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

          {shop.schedules && shop.schedules.length > 0 && (
            <div className={`p-4 ${themeClasses.bg.tertiary} rounded-lg border ${themeClasses.border.default}`}>
              <h3 className={`text-lg font-semibold ${themeClasses.text.primary} mb-3 flex items-center gap-2`}>
                <Clock size={20} />
                <span>Расписание работы</span>
              </h3>
              <div className="space-y-2">
                {shop.schedules.map(schedule => {
                  const isToday = normalizeDayOfWeek(schedule.dayOfWeek) === getCurrentDayOfWeek();
                  return (
                    <div
                      key={String(schedule.dayOfWeek)}
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
