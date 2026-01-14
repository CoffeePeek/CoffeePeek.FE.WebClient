import React from 'react';
import { DetailedCoffeeShop, getPhotoUrl } from '../../api/coffeeshop';

interface PhotoGalleryProps {
  shop: DetailedCoffeeShop;
  cardBg: string;
  borderColor: string;
  textMuted: string;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({ shop, cardBg, borderColor, textMuted }) => {
  if (!shop.photos || shop.photos.length === 0) {
    return (
      <div className={`col-span-12 row-span-2 rounded-3xl ${cardBg} border ${borderColor} flex items-center justify-center`}>
        <p className={textMuted}>Нет фотографий</p>
      </div>
    );
  }

  return (
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
  );
};

