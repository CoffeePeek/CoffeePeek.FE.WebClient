import React from 'react';
import { DetailedCoffeeShop } from '../../api/coffeeshop';
import { useTheme } from '../../contexts/ThemeContext';
import { getThemeClasses } from '../../utils/theme';
import { instagramHandle, instagramUrl } from '../../utils/shopUtils';
import { AppIcon } from '../icons';

interface ContactButtonsProps {
  shop: DetailedCoffeeShop;
  cardBg: string;
  borderColor: string;
  textMain: string;
}

export const ContactButtons: React.FC<ContactButtonsProps> = ({
  shop,
  cardBg,
  borderColor,
  textMain,
}) => {
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  if (!shop.shopContact?.phone && !shop.shopContact?.website && !shop.shopContact?.instagram) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-4 mt-6">
      {shop.shopContact?.phone && (
        <a
          href={`tel:${shop.shopContact.phone}`}
          className={`flex items-center gap-3 ${themeClasses.primary.bg} ${themeClasses.primary.bgHover} ${themeClasses.text.inverse} px-8 py-4 rounded-2xl font-bold shadow-lg ${themeClasses.primary.shadow} transition-all transform active:scale-95`}
        >
          <AppIcon name="call" size={20} />
          Позвонить
        </a>
      )}
      {shop.shopContact?.website && (
        <a
          href={shop.shopContact.website.startsWith('http') ? shop.shopContact.website : `https://${shop.shopContact.website}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-3 ${cardBg} border ${borderColor} ${themeClasses.primary.borderLight.replace('border-', 'hover:border-')} ${textMain} px-8 py-4 rounded-2xl font-bold transition-all`}
        >
          <AppIcon name="language" size={20} className={themeClasses.primary.text} />
          Веб-сайт
        </a>
      )}
      {shop.shopContact?.instagram && (
        <a
          href={instagramUrl(shop.shopContact.instagram)}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-3 ${cardBg} border ${borderColor} ${themeClasses.primary.borderLight.replace('border-', 'hover:border-')} ${textMain} px-5 py-3 rounded-2xl font-bold transition-all`}
        >
          <AppIcon name="photo_camera" size={20} className={themeClasses.primary.text} />
          {instagramHandle(shop.shopContact.instagram)}
        </a>
      )}
    </div>
  );
};

