import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { createReview, CreateReviewRequest, getReviewById, updateReview, ShortPhotoMetadataDto, getPhotoUrl } from '../api/coffeeshop';
import { getUploadUrls } from '../api/moderation';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/theme';
import { getThemeColors, COLORS } from '../constants/colors';
import { useUser } from '../contexts/UserContext';
import { useToast } from '../contexts/ToastContext';

interface ShopBasicInfo {
  name: string;
  address: string;
  photo: string;
  averageRating?: number;
}

const CreateReviewPage: React.FC = () => {
  const { shopId, reviewId } = useParams<{ shopId: string; reviewId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  if (!shopId) {
    navigate('/shops');
    return null;
  }
  
  const isEditMode = !!reviewId;
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  const { user } = useUser();
  const { showToast } = useToast();

  // Получаем данные о кофейне из navigation state
  const shopFromState = (location.state as { shop?: ShopBasicInfo })?.shop;
  
  // Если данных нет в state (прямой переход по URL), редиректим на страницу кофейни
  useEffect(() => {
    if (!shopFromState && !isEditMode) {
      navigate(`/shops/${shopId}`);
    }
  }, [shopFromState, isEditMode, shopId, navigate]);

  // Review data
  const [header, setHeader] = useState('');
  const [description, setDescription] = useState('');
  const [ratingCoffee, setRatingCoffee] = useState(5);
  const [ratingService, setRatingService] = useState(5);
  const [ratingPlace, setRatingPlace] = useState(5);
  const [visitedDate, setVisitedDate] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingExistingReview, setIsLoadingExistingReview] = useState(false);
  
  // Photo states
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [reviewPhotos, setReviewPhotos] = useState<ShortPhotoMetadataDto[]>([]);
  const [removedPhotoKeys, setRemovedPhotoKeys] = useState<string[]>([]);

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

  // Если редактируем — подгружаем отзыв и префилим поля
  useEffect(() => {
    let cancelled = false;

    const loadExistingReview = async () => {
      if (!reviewId) return;
      if (!user) return;

      try {
        setIsLoadingExistingReview(true);
        const response = await getReviewById(reviewId);
        if (cancelled) return;

        if (response.success && response.data) {
          const r = response.data;
          setHeader(r.header || '');
          setDescription(r.comment || '');
          setRatingCoffee(r.ratingCoffee || 5);
          setRatingService(r.ratingService || 5);
          setRatingPlace(r.ratingPlace || 5);
          setReviewPhotos(r.photos || []);
          // Загружаем дату посещения, если есть
          if (r.visitedAt) {
            const date = new Date(r.visitedAt);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            setVisitedDate(`${year}-${month}-${day}`);
          }
        } else {
          showToast('Не удалось загрузить отзыв для редактирования', 'error');
        }
      } catch (err) {
        if (!cancelled) {
          console.error('Error loading review to edit:', err);
          showToast('Не удалось загрузить отзыв для редактирования', 'error');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingExistingReview(false);
        }
      }
    };

    loadExistingReview();

    return () => {
      cancelled = true;
    };
  }, [reviewId, user?.id, showToast]);

  const getAverageRating = () => {
    return ((ratingCoffee + ratingService + ratingPlace) / 3).toFixed(1);
  };

  const getRatingText = () => {
    const avg = parseFloat(getAverageRating());
    if (avg >= 4.5) return 'Excellent Experience';
    if (avg >= 3.5) return 'Great Experience';
    if (avg >= 2.5) return 'Good Experience';
    if (avg >= 1.5) return 'Fair Experience';
    return 'Needs Improvement';
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

  const removeReviewPhoto = (storageKey: string) => {
    setReviewPhotos(prev => prev.filter(photo => photo.storageKey !== storageKey));
    setRemovedPhotoKeys(prev => [...prev, storageKey]);
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

    if (!header.trim() || !description.trim()) {
      showToast('Заполните заголовок и описание', 'error');
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    try {
      setIsSubmitting(true);
      setUploadingPhotos(true);
      
      // Загружаем новые фотографии
      const uploadedPhotos = await uploadPhotos();
      setUploadingPhotos(false);
      
      // Формируем список фотографий: существующие (не удаленные) + новые
      const existingPhotos = reviewPhotos
        .filter(photo => !removedPhotoKeys.includes(photo.storageKey))
        .map(photo => {
          // Определяем contentType по расширению файла
          const extension = photo.fileName.split('.').pop()?.toLowerCase();
          const contentTypeMap: Record<string, string> = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'webp': 'image/webp',
          };
          const contentType = extension ? (contentTypeMap[extension] || 'image/jpeg') : 'image/jpeg';
          
          return {
            fileName: photo.fileName,
            contentType: contentType,
            storageKey: photo.storageKey,
            size: 0, // размер не критичен для существующих фото
          };
        });
      
      const allPhotos = [...existingPhotos, ...uploadedPhotos];
      
      // Преобразуем дату в ISO строку (используем начало дня 00:00:00)
      const dateTimeString = `${visitedDate}T00:00:00`;
      const visitedAtISO = new Date(dateTimeString).toISOString();
      
      const request: CreateReviewRequest = {
        shopId,
        header: header.trim(),
        comment: description.trim(),
        ratingCoffee,
        ratingService,
        ratingPlace,
        visitedAt: visitedAtISO,
        photos: allPhotos.length > 0 ? allPhotos : undefined,
      };

      const response = reviewId
        ? await updateReview({ ...request, id: reviewId }, token)
        : await createReview(request, token);
      if (response.success) {
        showToast(reviewId ? 'Отзыв успешно обновлён!' : 'Отзыв успешно опубликован!', 'success');
        navigate(`/shops/${shopId}`);
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      setUploadingPhotos(false);
      showToast(reviewId ? 'Не удалось обновить отзыв' : 'Не удалось опубликовать отзыв', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingExistingReview) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.surface }}>
        <div className={`w-12 h-12 border-4 ${themeClasses.primary.border} border-t-transparent rounded-full animate-spin`} />
      </div>
    );
  }

  // Если нет данных о кофейне при создании отзыва, показываем загрузку (редирект произойдет)
  if (!shopFromState && !isEditMode) {
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
              {reviewId ? 'Редактировать отзыв' : 'Поделиться впечатлением'}
            </h1>
            <p className="mt-1" style={{ color: colors.textMuted }}>
              {reviewId
                ? `Обновите ваш отзыв о ${shop?.name || 'кофейне'}`
                : `Расскажите сообществу о вашем последнем визите в ${shop?.name || 'кофейне'}`}
            </p>
          </div>
          <button
            onClick={() => navigate(`/shops/${shopId}`)}
            className="flex items-center gap-2 font-semibold hover:opacity-70 transition-opacity"
            style={{ color: colors.textMuted }}
          >
            <span className="material-symbols-outlined">arrow_back</span>
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
                <div className="w-full h-full rounded-full overflow-hidden border-4 shadow-lg" style={{ borderColor: colors.primaryLight }}>
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
                  <span className="material-symbols-outlined text-sm block">verified</span>
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

              <div className="pt-8 border-t" style={{ borderColor: `${colors.borderSubtle}80` }}>
                <p className="text-[10px] font-bold uppercase tracking-widest mb-4" style={{ color: colors.textMuted }}>
                  Общая оценка
                </p>
                <div className="flex justify-center gap-2 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className={`material-symbols-outlined text-[32px] ${
                        star <= parseFloat(getAverageRating()) ? `star-filled ${themeClasses.primary.text}` : ''
                      }`}
                      style={star > parseFloat(getAverageRating()) ? { color: `${colors.primary}30` } : undefined}
                    >
                      star
                    </span>
                  ))}
                </div>
                <p className={`${themeClasses.primary.text} font-bold text-base mb-6`}>
                  {getAverageRating()} {getRatingText()}
                </p>

                {/* Date picker */}
                <div className="pt-6 border-t" style={{ borderColor: `${colors.borderSubtle}80` }}>
                  <label className={`block text-xs ${themeClasses.text.secondary} mb-2 text-left`} htmlFor="visitedDate">
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
          </aside>

          {/* Main content */}
          <div className="col-span-12 lg:col-span-8 space-y-10">
            {/* Ratings section */}
            <section
              className="rounded-3xl p-8 border shadow-soft space-y-8"
              style={{ backgroundColor: colors.base, borderColor: colors.borderSubtle }}
            >
              <div className="grid grid-cols-1 gap-8">
                {/* Ratings */}
                <div className="space-y-6">
                  {/* Coffee Quality */}
                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-bold" style={{ color: colors.textMain }}>
                      Качество кофе
                    </span>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setRatingCoffee(star)}
                          className="hover:scale-110 transition-transform"
                        >
                          <span
                            className={`material-symbols-outlined text-[28px] ${
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
                    <span className="text-sm font-bold" style={{ color: colors.textMain }}>
                      Качество сервиса
                    </span>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setRatingService(star)}
                          className="hover:scale-110 transition-transform"
                        >
                          <span
                            className={`material-symbols-outlined text-[28px] ${
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
                    <span className="text-sm font-bold" style={{ color: colors.textMain }}>
                      Атмосфера/Место
                    </span>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setRatingPlace(star)}
                          className="hover:scale-110 transition-transform"
                        >
                          <span
                            className={`material-symbols-outlined text-[28px] ${
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

              {/* Header and Description */}
              <div className="space-y-6 pt-6 border-t" style={{ borderColor: `${colors.borderSubtle}80` }}>
                <div className="space-y-2">
                  <label className="block text-sm font-bold" htmlFor="header" style={{ color: colors.textMain }}>
                    Заголовок
                  </label>
                  <input
                    id="header"
                    type="text"
                    value={header}
                    onChange={(e) => setHeader(e.target.value)}
                    className={`w-full border rounded-xl px-5 py-4 placeholder:opacity-40 ${themeClasses.primary.ringFocus} ${themeClasses.border.focus} outline-none transition-all font-semibold`}
                    style={{
                      backgroundColor: colors.surface,
                      borderColor: colors.borderSubtle,
                      color: colors.textMain,
                    }}
                    placeholder="Дайте заголовок вашему отзыву (например: Лучший кортадо в городе!)"
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold" htmlFor="description" style={{ color: colors.textMain }}>
                    Описание
                  </label>
                  <div className="relative">
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className={`w-full border rounded-xl p-5 placeholder:opacity-40 ${themeClasses.primary.ringFocus} ${themeClasses.border.focus} outline-none transition-all resize-none h-40`}
                      style={{
                        backgroundColor: colors.surface,
                        borderColor: colors.borderSubtle,
                        color: colors.textMain,
                      }}
                      placeholder="Поделитесь подробностями о вашем визите..."
                    />
                    <div className="absolute bottom-4 right-4 pointer-events-none" style={{ color: `${colors.textMuted}33` }}>
                      <span className="material-symbols-outlined text-2xl">edit_note</span>
                    </div>
                  </div>
                </div>
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
                  Добавьте фотографии к вашему отзыву (необязательно)
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

              {/* Existing photos (edit mode) */}
              {reviewPhotos.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-3" style={{ color: colors.textMain }}>
                    Существующие фотографии:
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {reviewPhotos.map((photo, index) => (
                      <div key={photo.storageKey || index} className="relative group">
                        <img
                          src={getPhotoUrl(photo)}
                          alt={`Review photo ${index + 1}`}
                          className="w-full h-24 object-cover rounded-xl"
                        />
                        <button
                          type="button"
                          onClick={() => removeReviewPhoto(photo.storageKey)}
                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-sm"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New selected photos preview */}
              {selectedFiles.length > 0 && (
                <div>
                  <p className="text-sm font-semibold mb-3" style={{ color: colors.textMain }}>
                    Новые фотографии:
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

            {/* Submit button */}
            <div className="pt-6 flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={`px-10 py-5 ${themeClasses.primary.bg} ${themeClasses.primary.bgHover} text-white rounded-2xl font-bold text-lg flex items-center gap-3 shadow-lg ${themeClasses.primary.shadow} transition-all active:scale-95 group disabled:opacity-50`}
              >
                {isSubmitting ? (reviewId ? 'Сохранение...' : 'Публикация...') : (reviewId ? 'Сохранить изменения' : 'Опубликовать отзыв')}
                <span className="material-symbols-outlined group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">
                  send
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

export default CreateReviewPage;

