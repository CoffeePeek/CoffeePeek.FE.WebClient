import React, { useMemo, useState } from 'react';
import {
  formatMenuCapturedAt,
  formatMenuPrice,
  ShopMenuDto,
  ShopMenuItemDto,
} from '../../api/menu';
import PhotoLightbox from '../PhotoLightbox';

interface ShopMenuSectionProps {
  menu: ShopMenuDto | null | undefined;
  textMain: string;
  textMuted: string;
  cardBg: string;
  borderColor: string;
}

function groupPresent(items: ShopMenuItemDto[]) {
  const present = items.filter((item) => item.availability === 'Present');
  return {
    espresso: present.filter((item) => item.category === 'Espresso'),
    filter: present.filter((item) => item.category === 'Filter'),
  };
}

const DrinkGroup: React.FC<{
  title: string;
  items: ShopMenuItemDto[];
  textMain: string;
  textMuted: string;
}> = ({ title, items, textMain, textMuted }) => {
  if (items.length === 0) return null;
  return (
    <div>
      <h3 className={`font-bold ${textMain} mb-3`}>{title}</h3>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.slug} className="flex items-baseline justify-between gap-3">
            <span className={textMain}>{item.nameRu}</span>
            <span className={`shrink-0 tabular-nums ${textMuted}`}>
              {item.price != null ? formatMenuPrice(item.price, item.currency || 'BYN') : '—'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export const ShopMenuSection: React.FC<ShopMenuSectionProps> = ({
  menu,
  textMain,
  textMuted,
  cardBg,
  borderColor,
}) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const grouped = useMemo(() => groupPresent(menu?.items ?? []), [menu?.items]);
  const photos = (menu?.photos ?? []).filter((photo) => photo.fullUrl);


  if (!menu) {
    return (
      <div className={`${cardBg} p-4 sm:p-6 rounded-3xl border ${borderColor} min-w-0`}>
        <h2 className={`text-xl sm:text-2xl font-extended font-bold ${textMain} flex items-center gap-3 mb-3`}>
          <span className="w-1.5 h-8 bg-[#D4A84B] rounded-full" />
          Меню
        </h2>
        <p className={textMuted}>Меню пока нет</p>
      </div>
    );
  }

  const captured = menu.capturedAtUtc ? formatMenuCapturedAt(menu.capturedAtUtc) : null;
  const updated =
    menu.updatedAtUtc &&
    menu.capturedAtUtc &&
    menu.updatedAtUtc !== menu.capturedAtUtc
      ? formatMenuCapturedAt(menu.updatedAtUtc)
      : null;

  return (
    <div className={`${cardBg} p-4 sm:p-6 rounded-3xl border ${borderColor} min-w-0 space-y-5`}>
      <div>
        <h2 className={`text-xl sm:text-2xl font-extended font-bold ${textMain} flex items-center gap-3 mb-1`}>
          <span className="w-1.5 h-8 bg-[#D4A84B] rounded-full" />
          Меню
        </h2>
        {captured && (
          <p className={`text-xs leading-snug ${textMuted}`}>
            Актуально на {captured}
            {updated ? ` · обновлено ${updated}` : ''}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <DrinkGroup title="Эспрессо" items={grouped.espresso} textMain={textMain} textMuted={textMuted} />
        <DrinkGroup title="Фильтр" items={grouped.filter} textMain={textMain} textMuted={textMuted} />
      </div>

      {photos.length > 0 && (
        <div>
          <h3 className={`font-bold ${textMain} mb-3`}>Фото меню</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {photos.map((photo, index) => (
              <button
                key={photo.id ?? photo.storageKey ?? index}
                type="button"
                onClick={() => setLightboxIndex(index)}
                className="block rounded-xl overflow-hidden aspect-[3/4] bg-black/5"
              >
                <img src={photo.fullUrl ?? ''} alt="Фото меню" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {lightboxIndex !== null && photos.length > 0 && (
        <PhotoLightbox
          images={photos.map((photo) => ({
            fileName: photo.fileName,
            storageKey: photo.storageKey,
            fullUrl: photo.fullUrl,
          }))}
          shopName="Меню"
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
};
