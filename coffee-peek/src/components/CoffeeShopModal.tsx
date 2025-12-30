import React from 'react';
import { DetailedCoffeeShop } from '../api/coffeeshop';
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

          {/* Main shop info */}
          <div className="mb-6">
            {shop.imageUrls && shop.imageUrls.length > 0 && (
              <PhotoCarousel images={shop.imageUrls} shopName={shop.name} isCardView={false} />
            )}

            <div className="flex items-center gap-4 mb-3">
              <div className="flex items-center gap-1">
                <span className="text-[#EAB308]">⭐</span>
                <span className={themeClasses.text.primary}>{(shop.rating || 0).toFixed(1)}</span>
                <span className={`${themeClasses.text.secondary} text-sm`}>({shop.reviewCount || 0} отзывов)</span>
              </div>
              <span className={`${themeClasses.text.secondary} text-sm`}>
                {formatPriceRange(shop.priceRange || '')}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                shop.isOpen 
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
              }`}>
                {shop.isOpen ? 'Открыто' : 'Закрыто'}
              </span>
            </div>

            {shop.location && shop.location.address && (
              <p className={`${themeClasses.text.secondary} mb-2`}>📍 {shop.location.address}</p>
            )}

            {shop.description && (
              <p className={`${themeClasses.text.secondary} mb-4`}>{shop.description}</p>
            )}
          </div>

          {/* Contact info */}
          {shop.shopContact && (
            <div className="mb-6">
              <h3 className={`text-lg font-semibold ${themeClasses.text.primary} mb-2`}>Контакты</h3>
              <div className="space-y-1">
                {shop.shopContact.phone && (
                  <p className={themeClasses.text.secondary}>📞 {shop.shopContact.phone}</p>
                )}
                {shop.shopContact.email && (
                  <p className={themeClasses.text.secondary}>✉️ {shop.shopContact.email}</p>
                )}
                {shop.shopContact.website && (
                  <p className={themeClasses.text.secondary}>🌐 {shop.shopContact.website}</p>
                )}
                {shop.shopContact.instagram && (
                  <p className={themeClasses.text.secondary}>📱 {shop.shopContact.instagram}</p>
                )}
              </div>
            </div>
          )}

          {/* Equipment */}
          {shop.equipments && shop.equipments.length > 0 && (
            <div className="mb-6">
              <h3 className={`text-lg font-semibold ${themeClasses.text.primary} mb-2`}>Оборудование</h3>
              <div className="flex flex-wrap gap-2">
                {shop.equipments && shop.equipments.map(equipment => (
                  <span 
                    key={equipment.id}
                    className={`px-3 py-1 ${themeClasses.bg.tertiary} text-[#EAB308] rounded-full text-sm`}
                  >
                    {equipment.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Coffee beans */}
          {shop.beans && shop.beans.length > 0 && (
            <div className="mb-6">
              <h3 className={`text-lg font-semibold ${themeClasses.text.primary} mb-2`}>Кофейные зёрна</h3>
              <div className="flex flex-wrap gap-2">
                {shop.beans && shop.beans.map(bean => (
                  <span 
                    key={bean.id}
                    className={`px-3 py-1 ${themeClasses.bg.tertiary} text-[#EAB308] rounded-full text-sm`}
                  >
                    {bean.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Roasters */}
          {shop.roasters && shop.roasters.length > 0 && (
            <div className="mb-6">
              <h3 className={`text-lg font-semibold ${themeClasses.text.primary} mb-2`}>Обжарщики</h3>
              <div className="flex flex-wrap gap-2">
                {shop.roasters && shop.roasters.map(roaster => (
                  <span 
                    key={roaster.id}
                    className={`px-3 py-1 ${themeClasses.bg.tertiary} text-[#EAB308] rounded-full text-sm`}
                  >
                    {roaster.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Brew methods */}
          {shop.brewMethods && shop.brewMethods.length > 0 && (
            <div className="mb-6">
              <h3 className={`text-lg font-semibold ${themeClasses.text.primary} mb-2`}>Методы заваривания</h3>
              <div className="flex flex-wrap gap-2">
                {shop.brewMethods && shop.brewMethods.map(method => (
                  <span 
                    key={method.id}
                    className={`px-3 py-1 ${themeClasses.bg.tertiary} text-[#EAB308] rounded-full text-sm`}
                  >
                    {method.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Schedule */}
          {shop.schedules && shop.schedules.length > 0 && (
            <div>
              <h3 className={`text-lg font-semibold ${themeClasses.text.primary} mb-2`}>Расписание</h3>
              <div className="space-y-1">
                {shop.schedules && shop.schedules.map(schedule => (
                  <div key={schedule.dayOfWeek} className={`flex justify-between py-1 border-b ${themeClasses.border.default}`}>
                    <span className={themeClasses.text.secondary}>{formatDayOfWeek(schedule.dayOfWeek)}</span>
                    <span className={themeClasses.text.primary}>
                      {schedule.openTime && schedule.closeTime 
                        ? `${schedule.openTime} - ${schedule.closeTime}`
                        : 'Закрыто'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CoffeeShopModal;