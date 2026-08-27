import React, { useState } from 'react';
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
  const [ratingCoffee, setRatingCoffee] = useState(0);
  const [ratingService, setRatingService] = useState(0);
  const [ratingPlace, setRatingPlace] = useState(0);
  const { selectedFiles, uploadingPhotos, handleFileSelect, removeFile, uploadPhotos, clearFiles } = usePhotoUpload();

  if (!isOpen || !shop) return null;

  const resetForm = () => {
    setNote('');
    setIsPublic(false);
    setVisitedDate(todayInputValue());
    setRatingCoffee(0);
    setRatingService(0);
    setRatingPlace(0);
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
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}
      onClick={handleClose}
    >
      <div
        className="relative w-full sm:max-w-[420px] max-h-[92vh] overflow-y-auto rounded-t-[28px] sm:rounded-[28px] px-5 pt-3 pb-6"
        style={{ backgroundColor: colors.background }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sm:hidden mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />
        <button
          type="button"
          onClick={handleClose}
          aria-label="Закрыть"
          className="hidden sm:flex absolute top-4 right-4 w-8 h-8 items-center justify-center rounded-full"
          style={{ color: colors.textSecondary }}
        >
          <X size={18} />
        </button>
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
  );
};

export default CheckInModal;
