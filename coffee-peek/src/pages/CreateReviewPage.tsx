import React, { useState, useEffect } from 'react';
import { DetailedCoffeeShop, getCoffeeShopById, createReview, CreateReviewRequest } from '../api/coffeeshop';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { useToast } from '../contexts/ToastContext';

interface CreateReviewPageProps {
  shopId: string;
  onBack: () => void;
  onReviewCreated?: () => void;
}

const CreateReviewPage: React.FC<CreateReviewPageProps> = ({ shopId, onBack, onReviewCreated }) => {
  const { theme } = useTheme();
  const { user } = useUser();
  const { showToast } = useToast();

  const [shop, setShop] = useState<DetailedCoffeeShop | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Review data
  const [header, setHeader] = useState('');
  const [description, setDescription] = useState('');
  const [ratingCoffee, setRatingCoffee] = useState(5);
  const [ratingService, setRatingService] = useState(5);
  const [ratingPlace, setRatingPlace] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isDark = theme === 'dark';

  // Color scheme from the design
  const colors = {
    primary: '#C69546',
    primaryHover: '#A87D39',
    primaryLight: '#FDF8EF',
    base: isDark ? '#1A1412' : '#FFFFFF',
    surface: isDark ? '#2D241F' : '#F9F8F6',
    borderSubtle: isDark ? '#3D2F28' : '#E5E1DA',
    textMain: isDark ? '#FFFFFF' : '#2D2A26',
    textMuted: isDark ? '#A8A8A8' : '#75706B',
  };

  useEffect(() => {
    const loadShop = async () => {
      try {
        setIsLoading(true);
        const response = await getCoffeeShopById(shopId);
        if (response.success && response.data) {
          setShop(response.data);
        }
      } catch (err) {
        console.error('Error loading shop:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (shopId) {
      loadShop();
    }
  }, [shopId]);

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
      const request: CreateReviewRequest = {
        shopId,
        header: header.trim(),
        comment: description.trim(),
        ratingCoffee,
        ratingService,
        ratingPlace,
      };

      const response = await createReview(request, token);
      if (response.success) {
        showToast('Отзыв успешно опубликован!', 'success');
        if (onReviewCreated) {
          onReviewCreated();
        } else {
          onBack();
        }
      }
    } catch (err) {
      console.error('Error submitting review:', err);
      showToast('Не удалось опубликовать отзыв', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.surface }}>
        <div className="w-12 h-12 border-4 border-[#C69546] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.surface }}>
        <p style={{ color: colors.textMain }}>Кофейня не найдена</p>
      </div>
    );
  }

  const shopImage = shop.photos && shop.photos.length > 0 ? shop.photos[0].fullUrl || '' : '';

  return (
    <div className="min-h-screen pt-16" style={{ backgroundColor: '#FBFBFA' }}>
      <main className="max-w-6xl mx-auto px-8 py-12">
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: colors.textMain }}>
              Поделиться впечатлением
            </h1>
            <p className="mt-1" style={{ color: colors.textMuted }}>
              Расскажите сообществу о вашем последнем визите в {shop.name}
            </p>
          </div>
          <button
            onClick={onBack}
            className="flex items-center gap-2 font-semibold hover:opacity-70 transition-opacity"
            style={{ color: colors.textMuted }}
          >
            <span className="material-symbols-outlined">arrow_back</span>
            Отменить
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
                    <img alt={shop.name} className="w-full h-full object-cover" src={shopImage} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: colors.surface }}>
                      <span className="material-symbols-outlined text-4xl" style={{ color: colors.textMuted }}>
                        store
                      </span>
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-2 -right-2 bg-[#C69546] text-white p-2 rounded-full shadow-lg">
                  <span className="material-symbols-outlined text-sm block">verified</span>
                </div>
              </div>

              <h2 className="text-2xl font-bold mb-2" style={{ color: colors.textMain }}>
                {shop.name}
              </h2>

              <div className="flex items-center justify-center gap-1.5 mb-8" style={{ color: colors.textMuted }}>
                <span className="material-symbols-outlined text-[#C69546] text-lg">location_on</span>
                <span className="text-sm font-medium">
                  {shop.location?.address || shop.address || 'Адрес не указан'}
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
                        star <= parseFloat(getAverageRating()) ? 'star-filled text-[#C69546]' : 'text-[#C69546]/30'
                      }`}
                    >
                      star
                    </span>
                  ))}
                </div>
                <p className="text-[#C69546] font-bold text-base">
                  {getAverageRating()} {getRatingText()}
                </p>
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
                              star <= ratingCoffee ? 'star-filled text-[#C69546]' : 'text-[#C69546]/20'
                            }`}
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
                              star <= ratingService ? 'star-filled text-[#C69546]' : 'text-[#C69546]/20'
                            }`}
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
                              star <= ratingPlace ? 'star-filled text-[#C69546]' : 'text-[#C69546]/20'
                            }`}
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
                    className="w-full border rounded-xl px-5 py-4 placeholder:opacity-40 focus:ring-4 focus:ring-[#C69546]/5 focus:border-[#C69546] outline-none transition-all font-semibold"
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
                      className="w-full border rounded-xl p-5 placeholder:opacity-40 focus:ring-4 focus:ring-[#C69546]/5 focus:border-[#C69546] outline-none transition-all resize-none h-40"
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

            {/* Submit button */}
            <div className="pt-6 flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-10 py-5 bg-[#C69546] hover:bg-[#A87D39] text-white rounded-2xl font-bold text-lg flex items-center gap-3 shadow-lg shadow-[#C69546]/20 transition-all active:scale-95 group disabled:opacity-50"
              >
                {isSubmitting ? 'Публикация...' : 'Опубликовать отзыв'}
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

