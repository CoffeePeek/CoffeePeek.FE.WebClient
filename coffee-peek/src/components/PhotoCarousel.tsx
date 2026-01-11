import React, { useState } from 'react';
import { getPhotoUrl, PhotoMetadataDto, ShortPhotoMetadataDto } from '../api/coffeeshop';

interface PhotoCarouselProps {
  images: (string | PhotoMetadataDto | ShortPhotoMetadataDto)[];
  shopName: string;
  isCardView?: boolean; // Optional prop to indicate if used in card view
}

const PhotoCarousel: React.FC<PhotoCarouselProps> = ({ images, shopName, isCardView = false }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = () => {
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? images.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const goToNext = () => {
    const isLastSlide = currentIndex === images.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (!images || images.length === 0) {
    return null;
  }

  // Фильтруем валидные URL
  // Поддерживаем как строки (старый формат), так и объекты PhotoMetadataDto (новый формат)
  const validImages = images
    .map(img => {
      // Если это объект PhotoMetadataDto или ShortPhotoMetadataDto
      if (img && typeof img === 'object' && ('fullUrl' in img || 'storageKey' in img)) {
        return getPhotoUrl(img as PhotoMetadataDto | ShortPhotoMetadataDto);
      }
      // Если это строка (старый формат)
      if (typeof img === 'string') {
        return img.trim();
      }
      // Если это что-то другое, пытаемся преобразовать в строку
      return img ? String(img).trim() : '';
    })
    .filter(url => url && url.length > 0);
  
  if (validImages.length === 0) {
    return null;
  }

  return (
    <div className="relative group h-full">
      <div className={`relative overflow-hidden rounded-xl bg-[#1A1412] ${isCardView ? 'h-full' : 'aspect-video'}`}>
        <div
          className="flex transition-transform duration-300 ease-in-out h-full"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {validImages.map((image, index) => (
            <div key={index} className="w-full flex-shrink-0">
              <img
                src={image}
                alt={`${shopName} - ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  // Показываем placeholder только если это не уже placeholder
                  if (!target.src.includes('placeholder')) {
                    target.src = 'https://via.placeholder.com/800x600/1A1412/FFFFFF?text=Image+Not+Found';
                  }
                }}
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation arrows */}
      {validImages.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToPrevious();
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
            aria-label="Previous image"
          >
            &lt;
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
            aria-label="Next image"
          >
            &gt;
          </button>
        </>
      )}

      {/* Indicators */}
      {validImages.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
          {validImages.map((_, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                goToSlide(index);
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex ? 'bg-white' : 'bg-white/50'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Counter */}
      {validImages.length > 1 && (
        <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
          {currentIndex + 1} / {validImages.length}
        </div>
      )}
    </div>
  );
};

export default PhotoCarousel;