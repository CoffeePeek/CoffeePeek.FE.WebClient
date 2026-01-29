import React, { useState } from 'react';
import { DetailedCoffeeShop, getPhotoUrl } from '../../api/coffeeshop';
import PhotoCarousel from '../PhotoCarousel';

interface PhotoGalleryProps {
  shop: DetailedCoffeeShop;
  cardBg: string;
  borderColor: string;
  textMuted: string;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({ shop, cardBg, borderColor, textMuted }) => {
  const [showCarousel, setShowCarousel] = useState(false);

  // Если фотографий нет, не рендерим компонент
  if (!shop.photos || shop.photos.length === 0) {
    return null;
  }

  const photos = shop.photos;
  const photoCount = photos.length;

  // Если одна фотография - показываем во всю область
  if (photoCount === 1) {
    return (
      <div className="col-span-12 row-span-2 rounded-3xl overflow-hidden relative group cursor-pointer">
        <div 
          className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
          style={{ backgroundImage: `url(${getPhotoUrl(photos[0])})` }}
        />
        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
      </div>
    );
  }

  // Если две фотографии - делим 70/30
  if (photoCount === 2) {
    return (
      <>
        <div className="col-span-12 md:col-span-8 row-span-2 rounded-3xl overflow-hidden relative group cursor-pointer">
          <div 
            className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
            style={{ backgroundImage: `url(${getPhotoUrl(photos[0])})` }}
          />
          <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
        </div>
        <div className="col-span-12 md:col-span-4 row-span-2 rounded-3xl overflow-hidden relative group cursor-pointer">
          <div 
            className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
            style={{ backgroundImage: `url(${getPhotoUrl(photos[1])})` }}
          />
          <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
        </div>
      </>
    );
  }

  // Если три фотографии - текущий алгоритм (одно большое, два маленьких)
  if (photoCount === 3) {
    return (
      <>
        <div className="col-span-12 md:col-span-8 row-span-2 rounded-3xl overflow-hidden relative group cursor-pointer">
          <div 
            className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
            style={{ backgroundImage: `url(${getPhotoUrl(photos[0])})` }}
          />
          <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
        </div>
        <div className="hidden md:block col-span-4 row-span-1 rounded-3xl overflow-hidden relative group cursor-pointer">
          <div 
            className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
            style={{ backgroundImage: `url(${getPhotoUrl(photos[1])})` }}
          />
          <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
        </div>
        <div className="hidden md:block col-span-4 row-span-1 rounded-3xl overflow-hidden relative group cursor-pointer">
          <div 
            className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
            style={{ backgroundImage: `url(${getPhotoUrl(photos[2])})` }}
          />
          <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
        </div>
      </>
    );
  }

  // Если больше трёх - показываем первые 3 и кнопку "Показать все"
  return (
    <>
      <div className="col-span-12 md:col-span-8 row-span-2 rounded-3xl overflow-hidden relative group cursor-pointer">
        <div 
          className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
          style={{ backgroundImage: `url(${getPhotoUrl(photos[0])})` }}
        />
        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
      </div>
      <div className="hidden md:block col-span-4 row-span-1 rounded-3xl overflow-hidden relative group cursor-pointer">
        <div 
          className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
          style={{ backgroundImage: `url(${getPhotoUrl(photos[1])})` }}
        />
        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
      </div>
      <div className="hidden md:block col-span-4 row-span-1 rounded-3xl overflow-hidden relative group cursor-pointer">
        <div 
          className="w-full h-full bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
          style={{ backgroundImage: `url(${getPhotoUrl(photos[2])})` }}
        />
        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
        <button 
          onClick={(e) => {
            e.stopPropagation();
            setShowCarousel(true);
          }}
          className="absolute bottom-6 right-6 bg-white/90 backdrop-blur-md text-[#2D2926] px-4 py-2 rounded-xl font-bold text-sm border border-[#E8E4E1] shadow-xl flex items-center gap-2 hover:bg-white transition-all z-10"
        >
          <span className="material-symbols-outlined text-base">grid_view</span>
          Показать все фото ({photoCount})
        </button>
      </div>

      {/* Модальное окно с каруселью */}
      {showCarousel && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowCarousel(false)}
        >
          <div 
            className="max-w-7xl w-full h-full max-h-[90vh] relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowCarousel(false)}
              className="absolute top-4 right-4 z-10 bg-white/90 hover:bg-white text-[#2D2926] p-2 rounded-full transition-all shadow-lg"
              aria-label="Закрыть"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="h-full">
              <PhotoCarousel images={photos} shopName={shop.name} isCardView={false} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

