import React from 'react';
import { DetailedCoffeeShop } from '../../api/coffeeshop';
import { useTheme } from '../../contexts/ThemeContext';
import { getThemeClasses } from '../../utils/theme';

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
    <div className="flex flex-wrap gap-4 mb-10">
      {shop.shopContact?.phone && (
        <a
          href={`tel:${shop.shopContact.phone}`}
          className={`flex items-center gap-3 ${themeClasses.primary.bg} ${themeClasses.primary.bgHover} ${themeClasses.text.inverse} px-8 py-4 rounded-2xl font-bold shadow-lg ${themeClasses.primary.shadow} transition-all transform active:scale-95`}
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
          className={`flex items-center gap-3 ${cardBg} border ${borderColor} ${themeClasses.primary.borderLight.replace('border-', 'hover:border-')} ${textMain} px-8 py-4 rounded-2xl font-bold transition-all`}
        >
          <span className={`material-symbols-outlined ${themeClasses.primary.text}`}>language</span>
          Веб-сайт
        </a>
      )}
      {shop.shopContact?.instagram && (
        <a
          href={shop.shopContact.instagram.startsWith('http') ? shop.shopContact.instagram : `https://instagram.com/${shop.shopContact.instagram.replace('@', '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-3 ${cardBg} border ${borderColor} ${themeClasses.primary.borderLight.replace('border-', 'hover:border-')} ${textMain} px-8 py-4 rounded-2xl font-bold transition-all`}
        >
          <span className={`material-symbols-outlined ${themeClasses.primary.text}`}>photo_camera</span>
          Instagram
        </a>
      )}
    </div>
  );
};

