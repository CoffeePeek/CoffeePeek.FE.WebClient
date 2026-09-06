import React, { useEffect, useState } from 'react';
import type { CreateCheckInRequest, DetailedCoffeeShop } from '../api/coffeeshop';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors } from '../constants/colors';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useToast } from '../contexts/ToastContext';
import { usePhotoUpload } from '../hooks/usePhotoUpload';
import { logger } from '../utils/logger';
import { buildCheckInRequest, CheckInValidationError } from '../utils/checkInForm';
import { useCreateCheckIn } from '../hooks/queries/useCheckIns';
import { useCheckInDraft } from '../hooks/useCheckInDraft';
import { getErrorMessage } from '../utils/errorHandler';
import { X } from './Icon';
import CheckInForm from './CheckInForm';

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  shop: DetailedCoffeeShop | null;
  onSuccess?: () => void;
}


const CheckInModal: React.FC<CheckInModalProps> = ({
  isOpen,
  onClose,
  shop,
  onSuccess,
}) => {
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  const { requireAuth } = useRequireAuth();
  const { showToast } = useToast();

  const { mutateAsync: submitCheckIn } = useCreateCheckIn();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { draft, updateDraft, clearDraft } = useCheckInDraft(shop?.id, isOpen);
  const {
    selectedFiles,
    uploadingPhotos,
    setSelectedFiles,
    uploadPhotos,
    clearFiles,
  } = usePhotoUpload();

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  useEffect(() => {
    if (!draft) return;
    setSelectedFiles(draft.selectedFiles);
  }, [draft?.coffeeShopId, setSelectedFiles]);

  if (!isOpen || !shop || !draft) return null;

  const handleClose = () => {
    if (isSubmitting) return;
    onClose();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;
    const nextFiles = [...selectedFiles, ...Array.from(event.target.files)];
    setSelectedFiles(nextFiles);
    updateDraft({ selectedFiles: nextFiles });
    event.target.value = '';
  };

  const removeFile = (index: number) => {
    const nextFiles = selectedFiles.filter((_, fileIndex) => fileIndex !== index);
    setSelectedFiles(nextFiles);
    updateDraft({ selectedFiles: nextFiles });
  };

  const handleSubmit = async () => {
    if (isSubmitting || !requireAuth()) return;

    let request: CreateCheckInRequest;
    try {
      request = buildCheckInRequest({
        coffeeShopId: shop.id,
        isPublic: draft.isPublic,
        header: draft.header,
        note: draft.note,
        visitedDate: draft.visitedDate,
        rating: draft.rating,
      });
    } catch (err) {
      showToast(err instanceof CheckInValidationError ? err.message : 'Проверьте данные чекина', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      request.photos = await uploadPhotos();
      const response = await submitCheckIn(request);
      if (!response.success || response.isSuccess === false) throw new Error('Не удалось создать чекин');
      if (response.success) {
        showToast(draft.isPublic ? 'Чекин создан! Отзыв отправлен на модерацию.' : 'Чекин успешно создан!', 'success');
        clearDraft();
        clearFiles();
        onClose();
        onSuccess?.();
      }
    } catch (err) {
      logger.error('Error submitting check-in:', err);
      showToast(getErrorMessage(err), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1200] sm:flex sm:items-center sm:justify-center sm:p-4">
      <button
        type="button"
        aria-label="Закрыть"
        className="absolute inset-0 bg-black/45 sm:bg-black/60"
        onClick={handleClose}
      />
      <div
        className="absolute inset-x-0 bottom-0 sm:relative sm:inset-auto w-full sm:max-w-[420px] flex flex-col min-h-0 overflow-hidden max-h-[min(85dvh,calc(100dvh-4.5rem))] sm:max-h-[90vh] rounded-t-[28px] sm:rounded-[28px] shadow-[0_-8px_40px_rgba(0,0,0,0.18)]"
        style={{ backgroundColor: colors.card }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden shrink-0 pt-2.5 pb-1">
          <div
            className="mx-auto h-1 w-10 rounded-full"
            style={{ backgroundColor: colors.border }}
          />
        </div>
        <button
          type="button"
          onClick={handleClose}
          aria-label="Закрыть"
          className="hidden sm:flex absolute top-4 right-4 z-10 w-8 h-8 items-center justify-center rounded-full"
          style={{ color: colors.textSecondary }}
        >
          <X size={18} />
        </button>
        <div
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-2 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <CheckInForm
            shopName={shop.name}
            header={draft.header}
            onHeaderChange={(header) => updateDraft({ header })}
            note={draft.note}
            onNoteChange={(note) => updateDraft({ note })}
            isPublic={draft.isPublic}
            onPublicChange={(isPublic) => updateDraft({ isPublic })}
            visitedDate={draft.visitedDate}
            onVisitedDateChange={(visitedDate) => updateDraft({ visitedDate })}
            ratingCoffee={draft.rating.coffee}
            ratingService={draft.rating.service}
            ratingPlace={draft.rating.place}
            onRatingCoffee={(coffee) => updateDraft({ rating: { ...draft.rating, coffee } })}
            onRatingService={(service) => updateDraft({ rating: { ...draft.rating, service } })}
            onRatingPlace={(place) => updateDraft({ rating: { ...draft.rating, place } })}
            selectedFiles={selectedFiles}
            onFileSelect={handleFileSelect}
            onRemoveFile={removeFile}
            uploadingPhotos={uploadingPhotos}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
};

export default CheckInModal;
