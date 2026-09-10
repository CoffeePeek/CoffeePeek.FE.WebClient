import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRoasterById, updateRoaster, deleteRoaster, RoasterPhoto } from '../api/roasters';
import { uploadRoasterPhotoFiles } from '../api/photos';
import { UploadedPhotoDto } from '../api/menu';
import { useCatalogs } from '../hooks/useCatalogs';
import { useToast } from '../contexts/ToastContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ConfirmModal } from '../components/ui/ConfirmModal';

const fieldClass =
  'w-full border border-border-light dark:border-border-dark rounded-lg px-3 py-2 text-sm bg-white dark:bg-surface-dark text-text-main dark:text-white font-body';

const EXTENSION_CONTENT_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
};

function guessContentType(fileName?: string | null): string {
  const ext = fileName?.split('.').pop()?.toLowerCase();
  return (ext && EXTENSION_CONTENT_TYPES[ext]) || 'image/jpeg';
}

type PhotoEntry =
  | { kind: 'existing'; key: string; photo: RoasterPhoto }
  | { kind: 'new'; key: string; file: File; previewUrl: string };

export const RoasterEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState('');
  const [about, setAbout] = useState('');
  const [cityId, setCityId] = useState('');
  const [address, setAddress] = useState('');
  const [instagramLink, setInstagramLink] = useState('');
  const [siteLink, setSiteLink] = useState('');
  const [photoEntries, setPhotoEntries] = useState<PhotoEntry[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { data: catalogs } = useCatalogs();

  const { data: roaster, isLoading } = useQuery({
    queryKey: ['admin', 'roaster', id],
    queryFn: () => getRoasterById(id!).then((r) => r.data),
    enabled: !!id,
  });

  useEffect(() => {
    if (!roaster) return;
    setName(roaster.name);
    setAbout(roaster.about ?? '');
    setCityId('');
    setAddress(roaster.location?.address ?? '');
    setInstagramLink(roaster.contact?.instagramLink ?? '');
    setSiteLink(roaster.contact?.siteLink ?? '');
    setPhotoEntries(
      roaster.photos.map((photo, index) => ({
        kind: 'existing' as const,
        key: photo.id ?? `existing-${index}`,
        photo,
      }))
    );
  }, [roaster]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const newFiles = photoEntries.filter((e): e is Extract<PhotoEntry, { kind: 'new' }> => e.kind === 'new');
      const uploaded = newFiles.length ? await uploadRoasterPhotoFiles(newFiles.map((e) => e.file)) : [];
      const uploadedByKey = new Map(newFiles.map((entry, index) => [entry.key, uploaded[index]]));

      const photos: UploadedPhotoDto[] = photoEntries.map((entry) =>
        entry.kind === 'existing'
          ? {
              fileName: entry.photo.fileName || 'photo.jpg',
              contentType: guessContentType(entry.photo.fileName),
              storageKey: entry.photo.storageKey,
              size: 0,
            }
          : uploadedByKey.get(entry.key)!
      );

      return updateRoaster(id!, {
        name: name.trim(),
        about: about.trim() || null,
        // cityId isn't returned by GET /api/roasters/{id}, so an empty picker means
        // "don't change" here, not "clear" — omit rather than send null.
        cityId: cityId || undefined,
        address: address.trim() || null,
        instagramLink: instagramLink.trim() || null,
        siteLink: siteLink.trim() || null,
        photos,
      });
    },
    onSuccess: () => {
      showToast('Обжарщик обновлён', 'success');
      qc.invalidateQueries({ queryKey: ['admin', 'roaster', id] });
      qc.invalidateQueries({ queryKey: ['admin', 'published-roasters'] });
    },
    onError: (err: any) => showToast(err?.message ?? 'Ошибка', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteRoaster(id!),
    onSuccess: () => {
      showToast('Обжарщик удалён', 'success');
      qc.invalidateQueries({ queryKey: ['admin', 'published-roasters'] });
      navigate('/published-roasters');
    },
    onError: (err: any) => showToast(err?.message ?? 'Не удалось удалить обжарщика', 'error'),
  });

  const addFiles = (files: File[]) => {
    setPhotoEntries((current) => [
      ...current,
      ...files.map((file, index) => ({
        kind: 'new' as const,
        key: `new-${Date.now()}-${index}`,
        file,
        previewUrl: URL.createObjectURL(file),
      })),
    ]);
  };

  const removeEntry = (key: string) => {
    setPhotoEntries((current) => current.filter((entry) => entry.key !== key));
  };

  const moveEntry = (index: number, to: number) => {
    if (to < 0 || to >= photoEntries.length) return;
    setPhotoEntries((current) => {
      const next = [...current];
      const [entry] = next.splice(index, 1);
      next.splice(to, 0, entry);
      return next;
    });
  };

  if (isLoading || !roaster) {
    return (
      <div className="page-container">
        <div className="h-8 w-48 bg-gray-100 dark:bg-white/5 rounded animate-pulse" />
        <div className="h-64 bg-gray-100 dark:bg-white/5 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="page-container pb-8">
      <div className="flex items-start gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/published-roasters')}
          className="shrink-0 self-start min-h-[44px] sm:min-h-0"
        >
          ← Назад
        </Button>
        <h2 className="page-header-title text-xl sm:text-2xl min-w-0 flex-1">{roaster.name}</h2>
      </div>

      <Card>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
          className="space-y-5"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-text-muted dark:text-stone-400 mb-1.5 font-body">
                Название
              </label>
              <input value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} required />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-text-muted dark:text-stone-400 mb-1.5 font-body">
                О компании
              </label>
              <textarea
                value={about}
                onChange={(e) => setAbout(e.target.value)}
                rows={4}
                className={`${fieldClass} resize-y min-h-[96px]`}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted dark:text-stone-400 mb-1.5 font-body">
                Город
              </label>
              <select value={cityId} onChange={(e) => setCityId(e.target.value)} className={fieldClass}>
                <option value="">Не менять</option>
                {(catalogs?.cities ?? []).map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted dark:text-stone-400 mb-1.5 font-body">
                Адрес
              </label>
              <input value={address} onChange={(e) => setAddress(e.target.value)} className={fieldClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted dark:text-stone-400 mb-1.5 font-body">
                Instagram
              </label>
              <input
                value={instagramLink}
                onChange={(e) => setInstagramLink(e.target.value)}
                className={fieldClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted dark:text-stone-400 mb-1.5 font-body">
                Сайт
              </label>
              <input value={siteLink} onChange={(e) => setSiteLink(e.target.value)} className={fieldClass} />
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            loading={saveMutation.isPending}
            className="w-full sm:w-auto min-h-[44px] sm:min-h-0"
          >
            Сохранить
          </Button>
        </form>
      </Card>

      <Card>
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-text-main dark:text-white font-display">Фотографии</h3>
            <p className="mt-1 text-xs text-text-muted dark:text-stone-400 font-body">
              Первая фотография — обложка. Изменения применяются при сохранении карточки выше.
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              e.target.value = '';
              if (files.length) addFiles(files);
            }}
          />
          <Button variant="secondary" size="sm" onClick={() => fileInputRef.current?.click()}>
            Добавить фото
          </Button>
        </div>

        {!photoEntries.length ? (
          <p className="text-xs text-text-muted dark:text-stone-400 font-body">В галерее пока нет фотографий.</p>
        ) : (
          <ol className="space-y-2">
            {photoEntries.map((entry, index) => (
              <li
                key={entry.key}
                className="flex items-center gap-3 rounded-lg border border-border-light p-2 dark:border-border-dark"
              >
                <img
                  src={entry.kind === 'existing' ? entry.photo.fullUrl : entry.previewUrl}
                  alt=""
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
                    {entry.kind === 'new' && (
                      <span className="rounded bg-blue-500/15 px-2 py-0.5 text-[11px] font-semibold text-blue-400">
                        Новое
                      </span>
                    )}
                  </div>
                  <p className="mt-1 truncate text-xs text-text-muted dark:text-stone-400">
                    {entry.kind === 'existing' ? entry.photo.fileName || entry.photo.storageKey : entry.file.name}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={index === 0}
                    onClick={() => moveEntry(index, index - 1)}
                    aria-label="Переместить выше"
                  >
                    ↑
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={index === photoEntries.length - 1}
                    onClick={() => moveEntry(index, index + 1)}
                    aria-label="Переместить ниже"
                  >
                    ↓
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => removeEntry(entry.key)}>
                    Удалить
                  </Button>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Card>

      <Card>
        <h3 className="text-sm font-semibold text-text-main dark:text-white font-display mb-1">Удаление</h3>
        <p className="text-xs text-text-muted dark:text-stone-400 font-body mb-3">
          Безвозвратно удаляет обжарщика из каталога.
        </p>
        <Button
          variant="danger"
          size="sm"
          onClick={() => setConfirmDelete(true)}
          className="w-full sm:w-auto min-h-[44px] sm:min-h-0"
        >
          Удалить обжарщика
        </Button>
      </Card>

      <ConfirmModal
        isOpen={confirmDelete}
        title="Удалить обжарщика?"
        message="Это действие необратимо."
        confirmLabel="Удалить"
        variant="danger"
        onConfirm={async () => {
          await deleteMutation.mutateAsync();
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
};
