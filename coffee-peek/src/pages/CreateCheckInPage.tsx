import WobbleRing from '../components/WobbleRing';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { createCheckIn, CreateCheckInRequest } from '../api/coffeeshop';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors } from '../constants/colors';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useToast } from '../contexts/ToastContext';
import { usePhotoUpload } from '../hooks/usePhotoUpload';
import { TokenManager } from '../api/core/httpClient';
import { logger } from '../utils/logger';
import { usePageTitle } from '../hooks/usePageTitle';
import { ArrowLeft } from '../components/Icon';
import CheckInForm from '../components/CheckInForm';

interface ShopBasicInfo {
  name: string;
  address: string;
  photo: string;
}

function todayInputValue(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const CreateCheckInPage: React.FC = () => {
  const { shopId } = useParams<{ shopId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useTheme();
  const colors = getThemeColors(theme);
  const { requireAuth } = useRequireAuth();
  const { showToast } = useToast();
  const shopFromState = (location.state as { shop?: ShopBasicInfo })?.shop;

  usePageTitle('Чекин');

  useEffect(() => {
    if (!shopId) {
      navigate('/shops');
      return;
    }
    if (!shopFromState) {
      navigate(`/shops/${shopId}`);
    }
  }, [shopFromState, shopId, navigate]);

  const [note, setNote] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visitedDate, setVisitedDate] = useState(todayInputValue);
  const [ratingCoffee, setRatingCoffee] = useState(0);
  const [ratingService, setRatingService] = useState(0);
  const [ratingPlace, setRatingPlace] = useState(0);
  const { selectedFiles, uploadingPhotos, handleFileSelect, removeFile, uploadPhotos } = usePhotoUpload();

  const handleSubmit = async () => {
    if (!requireAuth()) return;
    if (!shopId) return;

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

    const token = TokenManager.getAccessToken();
    if (!token) return;

    try {
      setIsSubmitting(true);
      const uploadedPhotos = await uploadPhotos();
      const visitedAtISO = new Date(`${visitedDate}T00:00:00`).toISOString();
      const rating =
        ratingCoffee && ratingService && ratingPlace
          ? { coffee: ratingCoffee, service: ratingService, place: ratingPlace }
          : undefined;

      const request: CreateCheckInRequest = {
        coffeeShopId: shopId,
        isPublic,
        visitedAt: visitedAtISO,
        note: note.trim() || undefined,
        photos: uploadedPhotos.length > 0 ? uploadedPhotos : undefined,
        rating,
      };

      const response = await createCheckIn(request);
      if (response.success) {
        showToast(isPublic ? 'Чекин успешно создан! Отзыв опубликован.' : 'Чекин успешно создан!', 'success');
        navigate(`/shops/${shopId}`);
      }
    } catch (err) {
      logger.error('Error submitting check-in:', err);
      const status = (err as { status?: number })?.status;
      const msg = err instanceof Error ? err.message : '';
      showToast(
        status === 429 || msg.includes('Слишком много запросов')
          ? 'Слишком много запросов. Подождите минуту и попробуйте снова.'
          : 'Не удалось создать чекин',
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!shopFromState) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}>
        <WobbleRing size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16" style={{ backgroundColor: colors.background }}>
      <main className="max-w-[420px] mx-auto px-4 py-6">
        <button
          type="button"
          onClick={() => navigate(`/shops/${shopId}`)}
          className="flex items-center gap-2 mb-5 font-body text-sm"
          style={{ color: colors.textSecondary }}
        >
          <ArrowLeft size={18} />
          Назад
        </button>
        <CheckInForm
          shopName={shopFromState.name}
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
      </main>
    </div>
  );
};

export default CreateCheckInPage;
