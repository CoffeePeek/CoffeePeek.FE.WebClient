import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { createCheckIn, CreateCheckInRequest } from '../api/coffeeshop';
import { getUploadUrls } from '../api/moderation';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/theme';
import { getThemeColors, COLORS } from '../constants/colors';
import { useUser } from '../contexts/UserContext';
import { useToast } from '../contexts/ToastContext';
import { Icons } from '../constants';

interface ShopBasicInfo {
  name: string;
  address: string;
  photo: string;
}

const CreateCheckInPage: React.FC = () => {
  const { shopId } = useParams<{ shopId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  if (!shopId) {
    navigate('/shops');
    return null;
  }
  
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  const { user } = useUser();
  const { showToast } = useToast();

  // Получаем данные о кофейне из navigation state
  const shopFromState = (location.state as { shop?: ShopBasicInfo })?.shop;
  
  // Если данных нет в state (прямой переход по URL), редиректим на страницу кофейни
  useEffect(() => {
    if (!shopFromState) {
      navigate(`/shops/${shopId}`);
    }
  }, [shopFromState, shopId, navigate]);

  // Check-in data
  const [note, setNote] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Date and ratings
  const [visitedDate, setVisitedDate] = useState(() => {
    const now = new Date();
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
    primaryHover: COLORS.primaryDark,
    primaryLight: COLORS.primaryLight,
    base: themeColors.background,
    surface: themeColors.surface,
    borderSubtle: themeColors.border,
    textMain: themeColors.textPrimary,
    textMuted: themeColors.textSecondary,
  };

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

    const token = localStorage.getItem('accessToken');
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

    const token = localStorage.getItem('accessToken');
    if (!token) return;

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
        coffeeShopId: shopId,
        isPublic: isPublic,
        visitedAt: visitedAtISO,
        note: note.trim() || undefined,
        photos: uploadedPhotos.length > 0 ? uploadedPhotos : undefined,
        rating: rating,
      };

      const response = await createCheckIn(request);
      if (response.success) {
        showToast(isPublic ? 'Чекин успешно создан! Отзыв опубликован.' : 'Чекин успешно создан!', 'success');
        navigate(`/shops/${shopId}`);
      }
    } catch (err) {
      console.error('Error submitting check-in:', err);
      setUploadingPhotos(false);
      showToast('Не удалось создать чекин', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Если нет данных о кофейне, показываем загрузку (редирект произойдет)
  if (!shopFromState) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.surface }}>
        <div className={`w-12 h-12 border-4 ${themeClasses.primary.border} border-t-transparent rounded-full animate-spin`} />
      </div>
    );
  }

  const shop = shopFromState;
  const shopImage = shop?.photo || '';

  return (
    <div className="min-h-screen pt-16" style={{ backgroundColor: colors.surface }}>
      <main className="max-w-6xl mx-auto px-8 py-12">
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: colors.textMain }}>
              Чекиниться
            </h1>
            <p className="mt-1" style={{ color: colors.textMuted }}>
              Отметьте своё посещение {shop?.name || 'кофейни'}
            </p>
          </div>
          <button
            onClick={() => navigate(`/shops/${shopId}`)}
            className={`flex items-center gap-2 font-semibold hover:opacity-70 transition-opacity ${themeClasses.text.secondary} ${themeClasses.primary.hover}`}
          >
            <Icons.Back />
            Назад
          </button>
        </div>

        <div className="grid grid-cols-12 gap-12 items-start">
          {/* Sidebar */}
          <aside className="col-span-12 lg:col-span-4">
            <div
              className="rounded-3xl p-8 border shadow-soft text-center"
              style={{ backgroundColor: colors.base, borderColor: colors.borderSubtle }}
            >
              <div className="relative w-32 h-32 mx-auto mb-6">
                <div className={`w-full h-full rounded-full overflow-hidden border-4 shadow-lg ${themeClasses.primary.borderLighter}`}>
                  {shopImage ? (
                    <img alt={shop?.name || 'Кофейня'} className="w-full h-full object-cover" src={shopImage} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: colors.surface }}>
                      <span className="material-symbols-outlined text-4xl" style={{ color: colors.textMuted }}>
                        store
                      </span>
                    </div>
                  )}
                </div>
                <div className={`absolute -bottom-2 -right-2 ${themeClasses.primary.bg} text-white p-2 rounded-full shadow-lg`}>
                  <Icons.CheckIn className="text-sm" />
                </div>
              </div>

              <h2 className="text-2xl font-bold mb-2" style={{ color: colors.textMain }}>
                {shop?.name || 'Кофейня'}
              </h2>

              <div className="flex items-center justify-center gap-1.5 mb-8" style={{ color: colors.textMuted }}>
                <span className={`material-symbols-outlined ${themeClasses.primary.text} text-lg`}>location_on</span>
                <span className="text-sm font-medium">
                  {shop?.address || 'Адрес не указан'}
                </span>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <div className="col-span-12 lg:col-span-8 space-y-10">
            {/* Note section */}
            <section
              className="rounded-3xl p-8 border shadow-soft space-y-6"
              style={{ backgroundColor: colors.base, borderColor: colors.borderSubtle }}
            >
              <div className="space-y-2">
                <label className="block text-sm font-bold" htmlFor="note" style={{ color: colors.textMain }}>
                  Заметка (необязательно)
                </label>
                <div className="relative">
                  <textarea
                    id="note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className={`w-full border rounded-xl p-5 placeholder:opacity-40 ${themeClasses.primary.ringFocus} ${themeClasses.border.focus} outline-none transition-all resize-none h-40`}
                    style={{
                      backgroundColor: colors.surface,
                      borderColor: colors.borderSubtle,
                      color: colors.textMain,
                    }}
                    placeholder="Поделитесь впечатлениями о вашем визите..."
                    maxLength={500}
                  />
                  <div className="absolute bottom-4 right-4 pointer-events-none" style={{ color: `${colors.textMuted}33` }}>
                    <span className="material-symbols-outlined text-2xl">edit_note</span>
                  </div>
                </div>
                <p className="text-xs" style={{ color: colors.textMuted }}>
                  {note.length}/500 символов
                </p>
              </div>
            </section>

            {/* Photos section */}
            <section
              className="rounded-3xl p-8 border shadow-soft space-y-6"
              style={{ backgroundColor: colors.base, borderColor: colors.borderSubtle }}
            >
              <div className="space-y-2">
                <label className="block text-sm font-bold" style={{ color: colors.textMain }}>
                  Фотографии
                </label>
                <p className="text-sm" style={{ color: colors.textMuted }}>
                  Добавьте фотографии к вашему чекину (необязательно)
                </p>
              </div>

              {/* File input */}
              <div>
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
                  className={`block w-full border-2 border-dashed rounded-2xl py-8 px-4 text-center cursor-pointer ${themeClasses.primary.borderHover} transition-all`}
                  style={{
                    backgroundColor: colors.surface,
                    borderColor: colors.borderSubtle,
                  }}
                >
                  <svg className="mx-auto h-12 w-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: colors.textMuted }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span style={{ color: colors.textMuted }}>Нажмите для выбора фотографий</span>
                </label>
              </div>

              {/* Selected photos preview */}
              {selectedFiles.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-3" style={{ color: colors.textMain }}>
                    Выбранные фотографии:
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-24 object-cover rounded-xl"
                        />
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-sm"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {uploadingPhotos && (
                <div className="flex items-center justify-center py-4">
                  <div className={`w-8 h-8 border-4 ${themeClasses.primary.border} border-t-transparent rounded-full animate-spin`} />
                  <span className="ml-3 text-sm" style={{ color: colors.textMuted }}>
                    Загрузка фотографий...
                  </span>
                </div>
              )}
            </section>

            {/* Public checkbox */}
            <section
              className="rounded-3xl p-8 border shadow-soft"
              style={{ backgroundColor: colors.base, borderColor: colors.borderSubtle }}
            >
              <label className="flex items-center gap-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-5 h-5 rounded"
                  style={{ accentColor: COLORS.primary }}
                />
                <div>
                  <p className="font-bold" style={{ color: colors.textMain }}>
                    Сделать чекин публичным
                  </p>
                  <p className="text-sm mt-1" style={{ color: colors.textMuted }}>
                    При публичном чекине автоматически создастся отзыв о кофейне
                  </p>
                </div>
              </label>
            </section>

            {/* Submit button */}
            <div className="pt-6 flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`px-10 py-5 ${themeClasses.primary.bg} ${themeClasses.primary.bgHover} text-white rounded-2xl font-bold text-lg flex items-center gap-3 shadow-lg ${themeClasses.primary.shadow} transition-all active:scale-95 group disabled:opacity-50`}
              >
                {isSubmitting ? 'Создание...' : 'Чекиниться'}
                <span className="material-symbols-outlined group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">
                  check_circle
                </span>
              </button>
            </div>
          </div>
        </div>
      </main>

      <div className="h-20"></div>
    </div>
  );
};

export default CreateCheckInPage;
