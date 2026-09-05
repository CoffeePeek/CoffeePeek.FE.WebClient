import WobbleRing from '../components/WobbleRing';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import type { CreateCheckInRequest } from '../api/coffeeshop';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeColors } from '../constants/colors';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { useToast } from '../contexts/ToastContext';
import { usePhotoUpload } from '../hooks/usePhotoUpload';
import { logger } from '../utils/logger';
import { buildCheckInRequest, CheckInValidationError, todayInputValue } from '../utils/checkInForm';
import { useCreateCheckIn } from '../hooks/queries/useCheckIns';
import { getErrorMessage } from '../utils/errorHandler';
import { usePageTitle } from '../hooks/usePageTitle';
import { ArrowLeft } from '../components/Icon';
import CheckInForm from '../components/CheckInForm';

interface ShopBasicInfo {
  name: string;
  address: string;
  photo: string;
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

  const [header, setHeader] = useState('');
  const [note, setNote] = useState('');
  const { mutateAsync: submitCheckIn } = useCreateCheckIn();
  const [isPublic, setIsPublic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [visitedDate, setVisitedDate] = useState(todayInputValue);
  const [ratingCoffee, setRatingCoffee] = useState(5);
  const [ratingService, setRatingService] = useState(5);
  const [ratingPlace, setRatingPlace] = useState(5);
  const { selectedFiles, uploadingPhotos, handleFileSelect, removeFile, uploadPhotos } = usePhotoUpload();

  const handleSubmit = async () => {
    if (isSubmitting || !requireAuth()) return;
    if (!shopId) return;

    let request: CreateCheckInRequest;
    try {
      request = buildCheckInRequest({
        coffeeShopId: shopId, isPublic, header, note, visitedDate,
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
        navigate(`/shops/${shopId}`);
      }
    } catch (err) {
      logger.error('Error submitting check-in:', err);
      showToast(getErrorMessage(err), 'error');
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
    <div className="min-h-[calc(100dvh-64px)]" style={{ backgroundColor: colors.background }}>
      <main className="sm:max-w-[420px] sm:mx-auto sm:px-4 sm:py-6 h-[calc(100dvh-64px)] sm:h-auto flex flex-col">
        <button
          type="button"
          onClick={() => navigate(`/shops/${shopId}`)}
          className="hidden sm:flex items-center gap-2 mb-5 font-body text-sm"
          style={{ color: colors.textSecondary }}
        >
          <ArrowLeft size={18} />
          Назад
        </button>
        <div
          className="mt-auto sm:mt-0 flex flex-col min-h-0 max-h-[min(85dvh,100%)] sm:max-h-none overflow-hidden rounded-t-[28px] sm:rounded-[28px] shadow-[0_-8px_40px_rgba(0,0,0,0.12)] sm:shadow-none"
          style={{ backgroundColor: colors.card }}
        >
          <div className="sm:hidden shrink-0 pt-2.5 pb-1">
            <div className="mx-auto h-1 w-10 rounded-full" style={{ backgroundColor: colors.border }} />
          </div>
          <div
            className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pt-2 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
            style={{ WebkitOverflowScrolling: 'touch' }}
          >
            <CheckInForm
              shopName={shopFromState.name}
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
      </main>
    </div>
  );
};

export default CreateCheckInPage;
