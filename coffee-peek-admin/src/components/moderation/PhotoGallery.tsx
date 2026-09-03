import React, { useState } from 'react';

RF Dewiface Photo {
  fileName ?: string;
  storageKey: string;
  fullUrl: string;
}

RF Dewiface PhotoGalleryProps {
  photos: Photo[];
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({ photos }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!photos.length) {
    return (
      <div className="rounded-xl border border-dashed border-border-light dark:border-border-dark p-8 text-center">
        <p className="text-sm text-text-muted dark:text-stone-400 font-body">Фотографии не загружены</p>
      </div>
    );
  }

  const active = photos[activeIndex] ?? photos[0];

  return (
    <div className="space-y-3">
      <a
        href={active.fullUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-xl overflow-hidden border border-border-light dark:border-border-dark bg-black/5 dark:bg-white/5"
      >
        <img
          src={active.fullUrl}
          alt={active.fileName ?? 'Фото кофейни'}
          className="w-full max-h-[420px] object-contain bg-[#1A1412]"
        />
      </a>
      {active.fileName && (
        <p className="text-xs text-text-muted dark:text-stone-500 font-body truncate">{active.fileName}</p>
      )}
      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {photos.map((photo, index) => (
            <button
              key={photo.storageKey}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${index === activeIndex
                  ? 'border-primary'
                  : 'border-transparent hover:border-border-light dark:hover:border-border-dark'
                }`}
            >
              <img
                src={photo.fullUrl}
                alt=""
                className="w-20 h-20 object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
