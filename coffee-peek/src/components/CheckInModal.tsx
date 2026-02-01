import React, { useState } from 'react';
import { createCheckIn, CreateCheckInRequest, DetailedCoffeeShop } from '../api/coffeeshop';
import { getUploadUrls } from '../api/moderation';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/theme';
import { getThemeColors, COLORS } from '../constants/colors';
import { useUser } from '../contexts/UserContext';
import { useToast } from '../contexts/ToastContext';
import { Icons } from '../constants';
import { TokenManager } from '../api/core/httpClient';

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
  const themeClasses = getThemeClasses(theme);
  const { user } = useUser();
  const { showToast } = useToast();

  // Check-in data
  const [note, setNote] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Date and ratings
  const [visitedDate, setVisitedDate] = useState(() => {
    const now = new Date();
    // Форматируем в формат YYYY-MM-DD для input[type="date"]
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [ratingCoffee, setRatingCoffee] = useState(5);
  const [ratingService, setRatingService] = useState(5);
  const [ratingPlace, setRatingPlace] = useState(5);
  
  // Photo states
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  // Color values for inline styles (based on theme constants)
  const themeColors = getThemeColors(theme);
  const colors = {
    primary: COLORS.primary,
    base: themeColors.background,
    surface: themeColors.surface,
    borderSubtle: themeColors.border,
    textMain: themeColors.textPrimary,
    textMuted: themeColors.textSecondary,
  };

  if (!isOpen || !shop) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadPhotos = async (): Promise<Array<{ fileName: string; contentType: string; storageKey: string; size: number }>> => {
    if (selectedFiles.length === 0) return [];

    const token = TokenManager.getAccessToken();
    if (!token) {
      throw new Error('Не авторизован');
    }

    const uploadRequests = selectedFiles.map(file => ({
      fileName: file.name,
      contentType: file.type,
    }));

    const uploadUrlsResponse = await getUploadUrls(token, uploadRequests);
    if (!uploadUrlsResponse.success || !uploadUrlsResponse.data) {
      throw new Error('Ошибка при получении URL для загрузки');
    }

    const uploadPromises = selectedFiles.map(async (file, index) => {
      const { uploadUrl, storageKey } = uploadUrlsResponse.data[index];
      
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error(`Ошибка загрузки файла ${file.name}`);
      }

      return {
        fileName: file.name,
        contentType: file.type,
        storageKey: storageKey,
        size: file.size,
      };
    });

    return Promise.all(uploadPromises);
  };

  const handleSubmit = async () => {
    if (!user) {
      showToast('Необходимо войти в систему', 'error');
      return;
    }

    // Валидация: если публичный чекин, то рейтинги и заметка обязательны
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
      setUploadingPhotos(true);
      
      // Загружаем фотографии
      const uploadedPhotos = await uploadPhotos();
      setUploadingPhotos(false);
      
      // Преобразуем дату в ISO строку (используем начало дня 00:00:00)
      const dateTimeString = `${visitedDate}T00:00:00`;
      const visitedAtISO = new Date(dateTimeString).toISOString();
      
      // Формируем рейтинг (можно указать всегда, но необязательно для приватного чекина)
      const rating = (ratingCoffee && ratingService && ratingPlace) ? {
        coffee: ratingCoffee,
        service: ratingService,
        place: ratingPlace,
      } : undefined;
      
      const request: CreateCheckInRequest = {
        coffeeShopId: shop.id,
        isPublic: isPublic,
        visitedAt: visitedAtISO,
        note: note.trim() || undefined,
        photos: uploadedPhotos.length > 0 ? uploadedPhotos : undefined,
        rating: rating,
      };

      const response = await createCheckIn(request);
      if (response.success) {
        showToast(isPublic ? 'Чекин успешно создан! Отзыв опубликован.' : 'Чекин успешно создан!', 'success');
        // Сброс формы
        setNote('');
        setIsPublic(false);
        setSelectedFiles([]);
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        setVisitedDate(`${year}-${month}-${day}`);
        setRatingCoffee(5);
        setRatingService(5);
        setRatingPlace(5);
        onClose();
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (err) {
      console.error('Error submitting check-in:', err);
      setUploadingPhotos(false);
      showToast('Не удалось создать чекин', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setNote('');
    setIsPublic(false);
    setSelectedFiles([]);
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    setVisitedDate(`${year}-${month}-${day}`);
    setRatingCoffee(5);
    setRatingService(5);
    setRatingPlace(5);
    onClose();
  };

  const shopImage = shop.photos && shop.photos.length > 0 ? shop.photos[0].fullUrl || '' : '';

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div 
        className={`${themeClasses.bg.card} border ${themeClasses.border.default} rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className={`text-2xl font-bold ${themeClasses.text.primary} mb-1`}>
                Чекиниться
              </h2>
              <p className={`text-sm ${themeClasses.text.secondary}`}>
                Отметьте своё посещение {shop.name}
              </p>
            </div>
            <button
              onClick={handleClose}
              className={`${themeClasses.text.secondary} ${themeClasses.primary.hover} text-2xl w-8 h-8 flex items-center justify-center rounded-lg ${themeClasses.bg.tertiary} hover:${themeClasses.bg.tertiary.replace('bg-', 'bg-')}`}
            >
              ✕
            </button>
          </div>

          {/* Shop info */}
          <div className={`${themeClasses.bg.secondary} rounded-xl p-4 mb-6`}>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              {/* Shop name and address */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="relative w-12 h-12 shrink-0">
                  <div className={`w-full h-full rounded-full overflow-hidden border-2 ${themeClasses.primary.borderLighter}`}>
                    {shopImage ? (
                      <img alt={shop.name} className="w-full h-full object-cover" src={shopImage} />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center ${themeClasses.bg.tertiary}`}>
                        <span className="material-symbols-outlined text-lg" style={{ color: colors.textMuted }}>
                          store
                        </span>
                      </div>
                    )}
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 ${themeClasses.primary.bg} text-white p-1 rounded-full shadow-lg flex items-center justify-center`}>
                    <Icons.CheckIn className="w-2.5 h-2.5" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-bold text-sm ${themeClasses.text.primary} mb-0.5 truncate`}>{shop.name}</h3>
                  <div className="flex items-center gap-1">
                    <span className={`material-symbols-outlined ${themeClasses.primary.text} text-xs`}>location_on</span>
                    <span className={`text-xs ${themeClasses.text.secondary} truncate`}>
                      {shop.location?.address || 'Адрес не указан'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Date picker inside shop info */}
              <div className="w-full md:w-auto md:min-w-[200px]">
                <label className={`block text-xs ${themeClasses.text.secondary} mb-1.5 ml-1`} htmlFor="visitedDate">
                  Дата посещения
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-lg pointer-events-none" style={{ color: colors.textMuted }}>
                    calendar_today
                  </span>
                  <input
                    type="date"
                    id="visitedDate"
                    value={visitedDate}
                    onChange={(e) => setVisitedDate(e.target.value)}
                    className={`
                      w-full ${themeClasses.bg.input} ${themeClasses.border.default} rounded-2xl py-3 pl-12 pr-4 
                      ${themeClasses.text.primary} 
                      focus:outline-none ${themeClasses.primary.ring.replace('focus:', 'focus:ring-2 focus:')} ${themeClasses.border.focus}
                      transition-all duration-200 text-sm
                    `}
                    style={{
                      colorScheme: theme === 'dark' ? 'dark' : 'light',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Note section */}
          <div className="space-y-2 mb-6">
            <label className={`block text-sm font-bold ${themeClasses.text.primary}`} htmlFor="note">
              Заметка {isPublic ? '' : '(необязательно)'}
            </label>
            <div className="relative">
              <textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className={`w-full border rounded-xl p-4 placeholder:opacity-40 ${themeClasses.primary.ringFocus} ${themeClasses.border.focus} outline-none transition-all resize-none h-32`}
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.borderSubtle,
                  color: colors.textMain,
                }}
                placeholder="Поделитесь впечатлениями о вашем визите..."
                maxLength={500}
              />
              <div className="absolute bottom-3 right-3 pointer-events-none" style={{ color: `${colors.textMuted}33` }}>
                <span className="material-symbols-outlined text-xl">edit_note</span>
              </div>
            </div>
            <p className={`text-xs ${themeClasses.text.secondary}`}>
              {note.length}/500 символов
            </p>
          </div>

          {/* Photos section */}
          <div className="space-y-3 mb-6">
            <div>
              <label className={`block text-sm font-bold ${themeClasses.text.primary} mb-2`}>
                Фотографии <span className={`text-xs font-normal ${themeClasses.text.secondary}`}>(необязательно)</span>
              </label>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
                id="photo-upload"
              />
              <label
                htmlFor="photo-upload"
                className={`block w-full border-2 border-dashed rounded-xl py-6 px-4 text-center cursor-pointer ${themeClasses.primary.borderHover} transition-all`}
                style={{
                  backgroundColor: colors.surface,
                  borderColor: colors.borderSubtle,
                }}
              >
                <svg className="mx-auto h-10 w-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: colors.textMuted }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className={`text-sm ${themeClasses.text.secondary}`}>Нажмите для выбора фотографий</span>
              </label>
            </div>

            {/* Selected photos preview */}
            {selectedFiles.length > 0 && (
              <div>
                <p className={`text-xs font-semibold mb-2 ${themeClasses.text.primary}`}>
                  Выбранные фотографии:
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-20 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {uploadingPhotos && (
              <div className="flex items-center justify-center py-3">
                <div className={`w-6 h-6 border-3 ${themeClasses.primary.border} border-t-transparent rounded-full animate-spin`} />
                <span className={`ml-3 text-xs ${themeClasses.text.secondary}`}>
                  Загрузка фотографий...
                </span>
              </div>
            )}
          </div>

          {/* Ratings section - показываем всегда, но обязательны только для публичного чекина */}
          <div className={`${themeClasses.bg.secondary} rounded-xl p-6 mb-6 space-y-6`}>
            <div className="space-y-1">
              <p className={`text-sm font-bold ${themeClasses.text.primary}`}>
                Оценка посещения {isPublic ? '' : '(необязательно)'}
              </p>
              <p className={`text-xs ${themeClasses.text.secondary}`}>
                {isPublic 
                  ? 'Укажите рейтинги для создания отзыва' 
                  : 'Вы можете указать рейтинги, но это необязательно'}
              </p>
            </div>

              <div className="space-y-5">
                {/* Coffee Quality */}
                <div className="flex flex-col gap-2">
                  <span className={`text-sm font-semibold ${themeClasses.text.primary}`}>
                    Качество кофе
                  </span>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRatingCoffee(star)}
                        className="hover:scale-110 transition-transform"
                      >
                        <span
                          className={`material-symbols-outlined text-[24px] ${
                            star <= ratingCoffee ? `star-filled ${themeClasses.primary.text}` : ''
                          }`}
                          style={star > ratingCoffee ? { color: `${colors.primary}20` } : undefined}
                        >
                          star
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Service Quality */}
                <div className="flex flex-col gap-2">
                  <span className={`text-sm font-semibold ${themeClasses.text.primary}`}>
                    Качество сервиса
                  </span>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRatingService(star)}
                        className="hover:scale-110 transition-transform"
                      >
                        <span
                          className={`material-symbols-outlined text-[24px] ${
                            star <= ratingService ? `star-filled ${themeClasses.primary.text}` : ''
                          }`}
                          style={star > ratingService ? { color: `${colors.primary}20` } : undefined}
                        >
                          star
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Atmosphere */}
                <div className="flex flex-col gap-2">
                  <span className={`text-sm font-semibold ${themeClasses.text.primary}`}>
                    Атмосфера/Место
                  </span>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRatingPlace(star)}
                        className="hover:scale-110 transition-transform"
                      >
                        <span
                          className={`material-symbols-outlined text-[24px] ${
                            star <= ratingPlace ? `star-filled ${themeClasses.primary.text}` : ''
                          }`}
                          style={star > ratingPlace ? { color: `${colors.primary}20` } : undefined}
                        >
                          star
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

          {/* Public checkbox */}
          <div className={`${themeClasses.bg.secondary} rounded-xl p-4 mb-6`}>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="w-5 h-5 rounded"
                style={{ accentColor: COLORS.primary }}
              />
              <div>
                <p className={`font-bold ${themeClasses.text.primary}`}>
                  Сделать чекин публичным
                </p>
                <p className={`text-xs mt-1 ${themeClasses.text.secondary}`}>
                  При публичном чекине автоматически создастся отзыв о кофейне
                </p>
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleClose}
              className={`flex-1 px-4 py-3 rounded-xl font-semibold ${themeClasses.button.secondary} transition-all`}
            >
              Отмена
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`flex-1 px-4 py-3 ${themeClasses.primary.bg} ${themeClasses.primary.bgHover} text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg ${themeClasses.primary.shadow} transition-all disabled:opacity-50`}
            >
              {isSubmitting ? (
                <>
                  <div className={`w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin`} />
                  Создание...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                  Чекиниться
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckInModal;
