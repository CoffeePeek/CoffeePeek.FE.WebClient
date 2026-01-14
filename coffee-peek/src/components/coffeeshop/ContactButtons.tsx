import React from 'react';
import { DetailedCoffeeShop } from '../../api/coffeeshop';

interface ContactButtonsProps {
  shop: DetailedCoffeeShop;
  cardBg: string;
  borderColor: string;
  textMain: string;
  primary: string;
  primaryHover: string;
}

export const ContactButtons: React.FC<ContactButtonsProps> = ({
  shop,
  cardBg,
  borderColor,
  textMain,
  primary,
  primaryHover,
}) => {
  if (!shop.shopContact?.phone && !shop.shopContact?.website && !shop.shopContact?.instagram) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-4 mb-10">
      {shop.shopContact?.phone && (
        <a
          href={`tel:${shop.shopContact.phone}`}
          className={`flex items-center gap-3 bg-[${primary}] hover:bg-[${primaryHover}] text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-[${primary}]/20 transition-all transform active:scale-95`}
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
          className={`flex items-center gap-3 ${cardBg} border ${borderColor} hover:border-[${primary}]/50 ${textMain} px-8 py-4 rounded-2xl font-bold transition-all`}
        >
          <span className={`material-symbols-outlined text-[${primary}]`}>language</span>
          Веб-сайт
        </a>
      )}
      {shop.shopContact?.instagram && (
        <a
          href={shop.shopContact.instagram.startsWith('http') ? shop.shopContact.instagram : `https://instagram.com/${shop.shopContact.instagram.replace('@', '')}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-3 ${cardBg} border ${borderColor} hover:border-[${primary}]/50 ${textMain} px-8 py-4 rounded-2xl font-bold transition-all`}
        >
          <span className={`material-symbols-outlined text-[${primary}]`}>photo_camera</span>
          Instagram
        </a>
      )}
    </div>
  );
};

