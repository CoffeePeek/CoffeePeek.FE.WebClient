import React, { useEffect, useState } from 'react';
import type { CreateCheckInRequest, DetailedCoffeeShop } from '../api/coffeeshop';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors } from '../constants/colors';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useToast } from '../contexts/ToastContext';
import { usePhotoUpload } from '../hooks/usePhotoUpload';
import { logger } from '../utils/logger';
import { buildCheckInRequest, CheckInValidationError, todayInputValue } from '../utils/checkInForm';
import { useCreateCheckIn } from '../hooks/queries/useCheckIns';
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

  const [header, setHeader] = useState('');
  const [note, setNote] = useState('');
  const { mutateAsync: submitCheckIn } = useCreateCheckIn();
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
    setHeader('');
    setNote('');
    setIsPublic(false);
    setVisitedDate(todayInputValue());
    setRatingCoffee(5);
    setRatingService(5);
    setRatingPlace(5);
    clearFiles();
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (isSubmitting || !requireAuth()) return;

    let request: CreateCheckInRequest;
    try {
      request = buildCheckInRequest({
        coffeeShopId: shop.id, isPublic, header, note, visitedDate,
        rating: { coffee: ratingCoffee, service: ratingService, place: ratingPlace },
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
        showToast(isPublic ? 'Чекин создан! Отзыв отправлен на модерацию.' : 'Чекин успешно создан!', 'success');
        resetForm();
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
            header={header}
            onHeaderChange={setHeader}
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
