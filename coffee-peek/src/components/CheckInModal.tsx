import React, { useEffect, useState } from 'react';
import { createCheckIn, CreateCheckInRequest, DetailedCoffeeShop } from '../api/coffeeshop';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors } from '../constants/colors';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useToast } from '../contexts/ToastContext';
import { usePhotoUpload } from '../hooks/usePhotoUpload';
import { logger } from '../utils/logger';
import { X } from './Icon';
import CheckInForm from './CheckInForm';

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  shop: DetailedCoffeeShop | null;
  onSuccess?: () => void;
}

function todayInputValue(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

  const [note, setNote] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visitedDate, setVisitedDate] = useState(todayInputValue);
  const [ratingCoffee, setRatingCoffee] = useState(5);
  const [ratingService, setRatingService] = useState(5);
  const [ratingPlace, setRatingPlace] = useState(5);
  const { selectedFiles, uploadingPhotos, handleFileSelect, removeFile, uploadPhotos, clearFiles } = usePhotoUpload();

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  if (!isOpen || !shop) return null;

  const resetForm = () => {
    setNote('');
    setIsPublic(false);
    setVisitedDate(todayInputValue());
    setRatingCoffee(5);
    setRatingService(5);
    setRatingPlace(5);
    clearFiles();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!requireAuth()) return;

    if (isPublic) {
      if (!ratingCoffee || !ratingService || !ratingPlace) {
        showToast('Для публичного чекина необходимо указать все рейтинги', 'error');
        return;
      }
      if (!note.trim()) {
        showToast('Для публичного чекина необходимо указать заметку', 'error');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const uploadedPhotos = await uploadPhotos();
      const visitedAtISO = new Date(`${visitedDate}T00:00:00`).toISOString();
      const rating =
        ratingCoffee && ratingService && ratingPlace
          ? { coffee: ratingCoffee, service: ratingService, place: ratingPlace }
          : undefined;

      const request: CreateCheckInRequest = {
        coffeeShopId: shop.id,
        isPublic,
        visitedAt: visitedAtISO,
        note: note.trim() || undefined,
        photos: uploadedPhotos.length > 0 ? uploadedPhotos : undefined,
        rating,
      };

      const response = await createCheckIn(request);
      if (response.success) {
        showToast(isPublic ? 'Чекин успешно создан! Отзыв опубликован.' : 'Чекин успешно создан!', 'success');
        resetForm();
        onClose();
        onSuccess?.();
      }
    } catch (err) {
      logger.error('Error submitting check-in:', err);
      showToast('Не удалось создать чекин', 'error');
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
            note={note}
            onNoteChange={setNote}
            isPublic={isPublic}
            onPublicChange={setIsPublic}
            visitedDate={visitedDate}
            onVisitedDateChange={setVisitedDate}
            ratingCoffee={ratingCoffee}
            ratingService={ratingService}
            ratingPlace={ratingPlace}
            onRatingCoffee={setRatingCoffee}
            onRatingService={setRatingService}
            onRatingPlace={setRatingPlace}
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
