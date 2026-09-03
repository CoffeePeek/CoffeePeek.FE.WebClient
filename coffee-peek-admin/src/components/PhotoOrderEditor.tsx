import React, { useEffect, useRef, useState } from 'react';
import { PublishedShopPhoto } from '../api/admin';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

interface PhotoOrderEditorProps {
  photos: PublishedShopPhoto[];
  isSaving?: boolean;
  isUploading?: boolean;
  isDeleting?: boolean;
  onSave: (photoIds: string[]) => Promise<unknown>;
  onAddFiles?: (files: File[]) => Promise<unknown>;
  onDelete?: (photoIds: string[]) => Promise<unknown>;
}

const sameOrder = (left: PublishedShopPhoto[], right: PublishedShopPhoto[]) =>
  left.length === right.length && left.every((photo, index) => photo.id === right[index]?.id);

export const PhotoOrderEditor: React.FC<PhotoOrderEditorProps> = ({
  photos,
  isSaving = false,
  isUploading = false,
  isDeleting = false,
  onSave,
  onAddFiles,
  onDelete,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loadedPhotos, setLoadedPhotos] = useState(photos);
  const [orderedPhotos, setOrderedPhotos] = useState(photos);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    setLoadedPhotos(photos);
    setOrderedPhotos(photos);
    setSelectedIds((current) => current.filter((id) => photos.some((photo) => photo.id === id)));
  }, [photos]);

  const move = (from: number, to: number) => {
    if (to < 0 || to >= orderedPhotos.length) return;
    setOrderedPhotos((current) => {
      const next = [...current];
      const [photo] = next.splice(from, 1);
      next.splice(to, 0, photo);
      return next;
    });
  };

  const dirty = !sameOrder(orderedPhotos, loadedPhotos);
  const busy = isSaving || isUploading || isDeleting;

  const toggleSelected = (id: string) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
    );
  };

  return (
    <Card>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-text-main dark:text-white font-display">Галерея</h3>
          <p className="mt-1 text-xs text-text-muted dark:text-stone-400 font-body">
            Первая фотография — обложка. Можно менять порядок, добавлять и удалять.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {onAddFiles && (
            <>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files ?? []);
                  e.target.value = '';
                  if (files.length) void onAddFiles(files);
                }}
              />
              <Button
                variant="secondary"
                size="sm"
                loading={isUploading}
                disabled={busy && !isUploading}
                onClick={() => inputRef.current?.click()}
              >
                Добавить фото
              </Button>
            </>
          )}
          {onDelete && (
            <Button
              variant="danger"
              size="sm"
              loading={isDeleting}
              disabled={!selectedIds.length || busy}
              onClick={() => void onDelete(selectedIds)}
            >
              Удалить выбранные
            </Button>
          )}
          <Button
            variant="primary"
            size="sm"
            loading={isSaving}
            disabled={!dirty || !orderedPhotos.length || busy}
            onClick={() => onSave(orderedPhotos.map((photo) => photo.id))}
          >
            Сохранить порядок
          </Button>
        </div>
      </div>

      {!orderedPhotos.length ? (
        <p className="text-xs text-text-muted dark:text-stone-400 font-body">В галерее пока нет фотографий.</p>
      ) : (
        <ol className="space-y-2">
          {orderedPhotos.map((photo, index) => (
            <li
              key={photo.id}
              className="flex items-center gap-3 rounded-lg border border-border-light p-2 dark:border-border-dark"
            >
              {onDelete && (
                <input
                  type="checkbox"
                  checked={selectedIds.includes(photo.id)}
                  onChange={() => toggleSelected(photo.id)}
                  className="rounded border-border-light dark:border-border-dark"
                  aria-label={`Выбрать фото ${index + 1}`}
                />
              )}
              <img
                src={photo.fullUrl}
                alt={photo.fileName || `Фото ${index + 1}`}
                className="h-14 w-14 rounded object-cover bg-gray-100 dark:bg-white/5"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-text-main dark:text-white">#{index + 1}</span>
                  {index === 0 && (
                    <span className="rounded bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary">
                      Обложка
                    </span>
                  )}
                </div>
                <p className="mt-1 truncate text-xs text-text-muted dark:text-stone-400">
                  {photo.fileName || photo.storageKey}
                </p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={index === 0 || busy}
                  onClick={() => move(index, index - 1)}
                  aria-label="Переместить выше"
                >
                  ↑
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={index === orderedPhotos.length - 1 || busy}
                  onClick={() => move(index, index + 1)}
                  aria-label="Переместить ниже"
                >
                  ↓
                </Button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
};
