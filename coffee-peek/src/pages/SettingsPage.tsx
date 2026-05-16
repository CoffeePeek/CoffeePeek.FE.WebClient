import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import Button from '../components/Button';
import { 
  getProfile, 
  UserProfile, 
  updateUsername,
  updateEmail,
  updateAbout,
  updateAvatar
} from '../api/auth';
import { getAvatarUploadUrl } from '../api/photos';
import { ProfileCardSkeleton, PersonalInfoSkeleton } from '../components/skeletons';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/theme';
import { getErrorMessage } from '../utils/errorHandler';
import { TokenManager } from '../api/core/httpClient';
import { logger } from '../utils/logger';
import { usePageTitle } from '../hooks/usePageTitle';
import { Review } from '../api/coffeeshop';

// ==================== Types ====================

interface FavoriteCoffeeShop {
  id: string;
  name: string;
  description: string;
  location: string;
  rating: number;
  imageUrl: string;
}

// ==================== Главный компонент ====================

const SettingsPage: React.FC = () => {
  usePageTitle('Профиль');
  const { user, isLoading: userLoading, logout } = useUser();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [originalValues, setOriginalValues] = useState<Record<string, string>>({});
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const loadProfile = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const token = TokenManager.getAccessToken();
      
      if (!token) {
        throw new Error('Токен доступа отсутствует');
      }
      
      const response = await getProfile();
      setProfile(response.data);
      setError(null);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      logger.error('Error loading profile:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleEditStart = useCallback(() => {
    if (!profile) return;
    
    const original: Record<string, string> = {
      userName: profile.userName || '',
      email: profile.email || '',
      about: profile.about || '',
    };
    setOriginalValues(original);
    setEditValues(original);
    setSelectedAvatarFile(null);
    setAvatarPreview(null);
    setIsEditing(true);
    setError(null);
  }, [profile]);

  const handleEditCancel = useCallback(() => {
    setEditValues({});
    setOriginalValues({});
    setSelectedAvatarFile(null);
    setAvatarPreview(null);
    setIsEditing(false);
    setError(null);
  }, []);

  const handleAvatarSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Выберите изображение');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setError('Размер файла не должен превышать 5MB');
        return;
      }
      
      setSelectedAvatarFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!profile) return;

    const userName = editValues.userName?.trim() || '';
    const email = editValues.email?.trim() || '';
    
    if (!userName) {
      setError('Имя пользователя не может быть пустым');
      return;
    }
    
    if (!email) {
      setError('Email не может быть пустым');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Введите корректный email');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      const updates: Promise<unknown>[] = [];
      
      if (editValues.userName !== originalValues.userName) {
        updates.push(updateUsername({ username: editValues.userName }));
      }
      
      if (editValues.email !== originalValues.email) {
        updates.push(updateEmail({ email: editValues.email }));
      }
      
      if (editValues.about !== originalValues.about) {
        updates.push(updateAbout({ about: editValues.about || '' }));
      }

      if (selectedAvatarFile) {
        const uploadRequest = {
          fileName: selectedAvatarFile.name,
          contentType: selectedAvatarFile.type,
          sizeBytes: selectedAvatarFile.size,
        };

        const uploadUrlResponse = await getAvatarUploadUrl(uploadRequest);
        if (!uploadUrlResponse.success || !uploadUrlResponse.data) {
          throw new Error('Ошибка при получении URL для загрузки аватара');
        }

        const { uploadUrl, storageKey } = uploadUrlResponse.data;

        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          body: selectedAvatarFile,
          headers: {
            'Content-Type': selectedAvatarFile.type,
          },
        });

        if (!uploadResponse.ok) {
          throw new Error('Ошибка загрузки аватара');
        }

        updates.push(updateAvatar({
          uploadedPhoto: {
            fileName: selectedAvatarFile.name,
            contentType: selectedAvatarFile.type,
            storageKey: storageKey,
            size: selectedAvatarFile.size,
          },
        }));
      }

      if (updates.length > 0) {
        await Promise.all(updates);
        
        const updatedProfile = await getProfile();
        setProfile(updatedProfile.data);
      }
      
      setIsEditing(false);
      setEditValues({});
      setOriginalValues({});
      setSelectedAvatarFile(null);
      setAvatarPreview(null);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      logger.error('Error updating profile:', err);
    } finally {
      setIsSaving(false);
    }
  }, [profile, editValues, originalValues, selectedAvatarFile]);

  
  const borderClass = themeClasses.border.default;

  return (
    <div className={`min-h-screen ${themeClasses.bg.primary}`}>
      {/* Error Message */}
      {error && (
        <div className="max-w-7xl mx-auto px-6 pt-4">
          <div className={`p-4 ${theme === 'dark' ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'} border rounded-2xl`}>
            <p className={`text-sm ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
          </div>
        </div>
      )}

      {/* Profile Header */}
      {userLoading || isLoading || !profile ? (
        <div className="max-w-7xl mx-auto px-6 pt-6">
          <ProfileCardSkeleton />
        </div>
      ) : (
        <ProfileHeader
          profile={profile}
          isEditing={isEditing}
          selectedAvatarFile={selectedAvatarFile}
          avatarPreview={avatarPreview}
          onAvatarSelect={handleAvatarSelect}
          isSaving={isSaving}
          onCreatePost={() => navigate('/coffee-shops/new')}
        />
      )}

      {/* Stats Cards */}
      {userLoading || isLoading || !profile ? (
        <div className="max-w-7xl mx-auto px-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className={`${themeClasses.bg.card} border ${borderClass} rounded-2xl py-3 px-4 flex items-center gap-3 animate-pulse`}>
                <div className={`w-9 h-9 ${themeClasses.bg.tertiary} rounded-xl flex-shrink-0`} />
                <div>
                  <div className={`w-12 h-5 ${themeClasses.bg.tertiary} rounded mb-1`} />
                  <div className={`w-16 h-3 ${themeClasses.bg.tertiary} rounded`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <StatsSection profile={profile} />
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Favourite shops — coming when API is ready */}
            <FavoriteCoffeeShopsSection
              shops={[]}
              onAddShop={() => navigate('/shops')}
              onShopClick={(id) => navigate(`/shops/${id}`)}
            />

            {/* Recent activity — coming when API is ready */}
            <RecentActivitySection
              reviews={[]}
              onShopClick={(shopId) => navigate(`/shops/${shopId}`)}
            />
          </div>

          {/* Right Column - Settings */}
          <div className="space-y-6">
            {/* Personal Info */}
            {userLoading || isLoading || !profile ? (
              <PersonalInfoSkeleton />
            ) : (
              <PersonalInformation
                profile={profile}
                isEditing={isEditing}
                editValues={editValues}
                isSaving={isSaving}
                onEditStart={handleEditStart}
                onEditCancel={handleEditCancel}
                onSave={handleSave}
                onInputChange={(field, value) => setEditValues(prev => ({ ...prev, [field]: value }))}
              />
            )}

            {/* Account Settings */}
            <AccountSettings />

            {/* App Settings */}
            <div className={`${themeClasses.bg.card} border ${borderClass} rounded-2xl p-5`}>
              <h3 className={`text-lg font-bold ${themeClasses.text.primary} mb-4`}>Настройки приложения</h3>
              <ThemeSettingItem
                title="Тема"
                description={theme === 'dark' ? 'Тёмная тема' : 'Светлая тема'}
                currentTheme={theme}
                onToggle={toggleTheme}
              />
            </div>

            {/* Add Coffee Shop */}
            <div className={`${themeClasses.bg.card} border ${borderClass} rounded-2xl p-5`}>
              <h3 className={`text-lg font-bold ${themeClasses.text.primary} mb-2`}>Добавить кофейню</h3>
              <p className={`${themeClasses.text.secondary} text-sm mb-4`}>
                Отправьте новую кофейню на модерацию
              </p>
              <Button
                variant="primary"
                onClick={() => navigate('/coffee-shops/new')}
                className="w-full flex items-center justify-center gap-2"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Добавить кофейню
              </Button>
            </div>

            {/* Logout */}
            <div className={`${themeClasses.bg.card} border ${borderClass} rounded-2xl p-5`}>
              <h3 className={`text-lg font-bold ${themeClasses.text.primary} mb-2`}>Выход</h3>
              <p className={`${themeClasses.text.secondary} text-sm mb-4`}>
                Выйти из текущего аккаунта
              </p>
              <Button
                variant="secondary"
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="w-full flex items-center justify-center gap-2"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                Выйти
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== Profile Header ====================

interface ProfileHeaderProps {
  profile: UserProfile;
  isEditing: boolean;
  selectedAvatarFile: File | null;
  avatarPreview: string | null;
  onAvatarSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isSaving: boolean;
  onCreatePost: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  isEditing,
  selectedAvatarFile,
  avatarPreview,
  onAvatarSelect,
  isSaving,
  onCreatePost,
}) => {
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  const displayAvatar = avatarPreview || profile.avatarUrl;

  const memberSince = profile.createdAtUtc
    ? new Date(profile.createdAtUtc).getFullYear()
    : new Date().getFullYear();

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className={`w-24 h-24 rounded-full border-4 ${theme === 'dark' ? 'border-[#3D2F28]' : 'border-white'} shadow-xl overflow-hidden`}>
            {displayAvatar ? (
              <img src={displayAvatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className={`w-full h-full ${themeClasses.primary.bg} flex items-center justify-center`}>
                <span className="text-3xl font-bold text-white">
                  {profile.userName?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
            )}
          </div>
          {isEditing && (
            <label className="absolute bottom-0 right-0 bg-[#EAB308] text-white rounded-full p-1.5 cursor-pointer hover:bg-[#CA8A04] transition-colors shadow-lg">
              <input
                type="file"
                accept="image/*"
                onChange={onAvatarSelect}
                disabled={isSaving}
                className="hidden"
              />
              <span className="material-symbols-rounded text-sm">camera_alt</span>
            </label>
          )}
          {isEditing && selectedAvatarFile && (
            <p className={`text-xs mt-1 ${themeClasses.text.secondary} text-center absolute -bottom-5 w-full`}>
              {selectedAvatarFile.name}
            </p>
          )}
        </div>

        {/* Profile Info */}
        <div className="flex-1">
          <h1 className={`text-3xl font-bold ${themeClasses.text.primary} mb-2`}>
            {profile.userName}
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            {/* Badge */}
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${themeClasses.primary.bgLight} border ${themeClasses.primary.borderLighter}`}>
              <span className={`material-symbols-rounded text-sm ${themeClasses.primary.text}`}>local_cafe</span>
              <span className={`${themeClasses.primary.text} text-xs font-bold uppercase tracking-wider`}>
                Ценитель кофе
              </span>
            </div>
            <span className={`${themeClasses.text.secondary} text-sm`}>
              На сайте с {memberSince}
            </span>
          </div>
        </div>

        {/* Create Post Button */}
        <Button
          variant="primary"
          onClick={onCreatePost}
          className="w-auto flex items-center gap-2"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
          Создать пост
        </Button>
      </div>
    </div>
  );
};

// ==================== Stats Section ====================

interface StatsSectionProps {
  profile: UserProfile;
}

const StatsSection: React.FC<StatsSectionProps> = ({ profile }) => {
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  
  const borderClass = themeClasses.border.default;

  const stats = [
    {
      icon: 'shopping_cart_checkout',
      value: profile.checkInCount || 0,
      label: 'ПОСЕЩЕНИЯ',
      color: themeClasses.primary.text,
      bgColor: themeClasses.primary.bgLight,
    },
    {
      icon: 'rate_review',
      value: profile.reviewCount || 0,
      label: 'ОТЗЫВОВ',
      color: themeClasses.primary.text,
      bgColor: themeClasses.primary.bgLight,
    },
    {
      icon: 'favorite',
      value: profile.addedShopsCount || 0,
      label: 'ИЗБРАННОЕ',
      color: themeClasses.primary.text,
      bgColor: themeClasses.primary.bgLight,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <div
            key={index}
            className={`${themeClasses.bg.card} border ${borderClass} rounded-2xl py-3 px-4 flex items-center gap-3 group hover:shadow-md transition-all`}
          >
            <div className={`w-9 h-9 rounded-xl ${stat.bgColor} ${stat.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
              <span className="material-symbols-rounded text-lg">{stat.icon}</span>
            </div>
            <div>
              <span className={`text-xl font-bold ${themeClasses.text.primary} block leading-tight`}>
                {stat.value}
              </span>
              <span className={`text-xs ${themeClasses.text.secondary} uppercase tracking-[0.1em]`}>
                {stat.label}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ==================== Favorite Coffee Shops Section ====================

interface FavoriteCoffeeShopsSectionProps {
  shops: FavoriteCoffeeShop[];
  onAddShop: () => void;
  onShopClick: (id: string) => void;
}

const FavoriteCoffeeShopsSection: React.FC<FavoriteCoffeeShopsSectionProps> = ({
  shops,
  onAddShop,
  onShopClick,
}) => {
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  
  const borderClass = themeClasses.border.default;

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className={`text-xl font-bold ${themeClasses.text.primary}`}>Любимые кофейни</h2>
          <p className={`${themeClasses.text.secondary} text-sm`}>Коллекция ваших любимых мест</p>
        </div>
        <button
          onClick={onAddShop}
          className={`${themeClasses.primary.text} text-sm font-medium flex items-center gap-1 hover:opacity-80 transition-opacity`}
        >
          Все
          <span className="material-symbols-rounded text-sm">chevron_right</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {shops.map((shop) => (
          <button
            key={shop.id}
            onClick={() => onShopClick(shop.id)}
            className={`${themeClasses.bg.card} border ${borderClass} rounded-2xl overflow-hidden text-left group hover:shadow-lg transition-all`}
          >
            {/* Image */}
            <div className="relative aspect-[4/3] overflow-hidden">
              <img
                src={shop.imageUrl}
                alt={shop.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              {/* Rating badge */}
              <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                <span className="material-symbols-rounded text-[#EAB308] text-xs fill-1">star</span>
                {shop.rating}
              </div>
            </div>
            {/* Info */}
            <div className="p-3">
              <h3 className={`font-bold ${themeClasses.text.primary} text-sm truncate`}>{shop.name}</h3>
              <p className={`${themeClasses.primary.text} text-xs truncate`}>{shop.description}</p>
              <div className="flex items-center gap-1 mt-1">
                <span className={`material-symbols-rounded text-xs ${themeClasses.text.secondary}`}>location_on</span>
                <span className={`${themeClasses.text.secondary} text-xs truncate`}>{shop.location}</span>
              </div>
            </div>
          </button>
        ))}

        {/* Add New Shop Card */}
        <button
          onClick={onAddShop}
          className={`${themeClasses.bg.card} border-2 border-dashed ${borderClass} rounded-2xl flex flex-col items-center justify-center min-h-[200px] group hover:${themeClasses.primary.border} transition-all`}
        >
          <div className={`w-12 h-12 rounded-full ${themeClasses.bg.tertiary} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
            <span className={`material-symbols-rounded text-2xl ${themeClasses.text.secondary}`}>add</span>
          </div>
          <span className={`${themeClasses.text.secondary} text-sm font-medium`}>Добавить</span>
        </button>
      </div>
    </section>
  );
};

// ==================== Recent Activity Section ====================

interface RecentActivitySectionProps {
  reviews: (Review & { shopName?: string })[];
  onShopClick: (shopId: string) => void;
}

const RecentActivitySection: React.FC<RecentActivitySectionProps> = ({ reviews, onShopClick }) => {
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  
  const borderClass = themeClasses.border.default;

  const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins} мин. назад`;
    if (diffHours < 24) return `${diffHours} ч. назад`;
    if (diffDays === 1) return 'Вчера';
    if (diffDays < 7) return `${diffDays} дн. назад`;
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className={`text-xl font-bold ${themeClasses.text.primary}`}>Последняя активность</h2>
      </div>

      {reviews.length > 0 ? (
        <div className="space-y-3">
          {reviews.map((review) => {
            const avgRating = ((review.ratingCoffee + review.ratingService + review.ratingPlace) / 3);

            return (
              <div
                key={review.id}
                className={`${themeClasses.bg.card} border ${borderClass} rounded-2xl p-4 hover:shadow-md transition-all`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-full ${themeClasses.primary.bgLight} flex items-center justify-center flex-shrink-0`}>
                    <span className={`material-symbols-rounded ${themeClasses.primary.text} text-lg`}>edit_square</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={`font-bold ${themeClasses.text.primary} text-sm`}>
                          Отзыв на {review.shopName || 'кофейню'}
                        </p>
                        <p className={`${themeClasses.text.secondary} text-xs mt-0.5`}>
                          "{review.comment}"
                        </p>
                      </div>
                      <span className={`${themeClasses.text.secondary} text-xs whitespace-nowrap flex-shrink-0`}>
                        {formatTimeAgo(review.createdAt)}
                      </span>
                    </div>

                    {/* Stars */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            className={`material-symbols-rounded text-xs ${
                              star <= Math.round(avgRating)
                                ? `${themeClasses.primary.text} fill-1`
                                : themeClasses.text.secondary
                            }`}
                          >
                            star
                          </span>
                        ))}
                      </div>
                      <button
                        onClick={() => onShopClick(review.coffeeShopId)}
                        className={`text-xs ${themeClasses.primary.text} font-medium hover:opacity-80 transition-opacity flex items-center gap-0.5`}
                      >
                        <span className="material-symbols-rounded text-xs">arrow_forward</span>
                        К кофейне
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className={`${themeClasses.bg.card} border ${borderClass} rounded-2xl p-8 text-center`}>
          <div className={`w-14 h-14 rounded-full ${themeClasses.bg.tertiary} flex items-center justify-center mx-auto mb-3`}>
            <span className={`material-symbols-rounded text-3xl ${themeClasses.text.secondary}`}>rate_review</span>
          </div>
          <p className={`${themeClasses.text.secondary}`}>Пока нет активности</p>
        </div>
      )}
    </section>
  );
};

// ==================== Personal Information ====================

interface PersonalInformationProps {
  profile: UserProfile;
  isEditing: boolean;
  editValues: Record<string, string>;
  isSaving: boolean;
  onEditStart: () => void;
  onEditCancel: () => void;
  onSave: () => void;
  onInputChange: (field: string, value: string) => void;
}

const PersonalInformation: React.FC<PersonalInformationProps> = ({
  profile,
  isEditing,
  editValues,
  isSaving,
  onEditStart,
  onEditCancel,
  onSave,
  onInputChange,
}) => {
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  
  return (
    <div className={`${themeClasses.bg.card} border ${themeClasses.border.default} rounded-2xl p-5`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className={`text-lg font-bold ${themeClasses.text.primary}`}>Личная информация</h3>
        {!isEditing ? (
          <Button 
            variant="secondary" 
            onClick={onEditStart}
            className="w-auto !py-1.5 !px-3 text-sm"
          >
            Изменить
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button 
              variant="secondary" 
              onClick={onEditCancel}
              disabled={isSaving}
              className="w-auto !py-1.5 !px-3 text-sm"
            >
              Отмена
            </Button>
            <Button 
              variant="primary" 
              onClick={onSave}
              disabled={isSaving}
              isLoading={isSaving}
              className="w-auto !py-1.5 !px-3 text-sm"
            >
              Сохранить
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <EditableInfoField
          field="userName"
          label="Имя пользователя"
          value={profile.userName || ''}
          isEditing={isEditing}
          editValue={editValues.userName}
          isSaving={isSaving}
          onInputChange={onInputChange}
        />

        <EditableInfoField
          field="email"
          label="Email"
          type="email"
          value={profile.email || ''}
          isEditing={isEditing}
          editValue={editValues.email}
          isSaving={isSaving}
          onInputChange={onInputChange}
        />

        <EditableInfoField
          field="about"
          label="О себе"
          type="textarea"
          value={profile.about || 'Информация не указана'}
          isEditing={isEditing}
          editValue={editValues.about}
          isSaving={isSaving}
          onInputChange={onInputChange}
          placeholder="Расскажите немного о себе..."
        />

        <div>
          <label className={`${themeClasses.text.secondary} text-xs mb-1 block`}>Дата регистрации</label>
          <p className={`${themeClasses.text.primary} text-sm`}>
            {profile.createdAtUtc ? new Date(profile.createdAtUtc).toLocaleDateString('ru-RU') : 'Неизвестно'}
          </p>
        </div>
      </div>
    </div>
  );
};

// ==================== Editable Info Field ====================

interface EditableInfoFieldProps {
  field: string;
  label: string;
  value: string;
  isEditing: boolean;
  editValue?: string;
  isSaving: boolean;
  onInputChange: (field: string, value: string) => void;
  type?: 'text' | 'email' | 'textarea';
  placeholder?: string;
}

const EditableInfoField: React.FC<EditableInfoFieldProps> = ({
  field,
  label,
  value,
  isEditing,
  editValue,
  isSaving,
  onInputChange,
  type = 'text',
  placeholder,
}) => {
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  const displayValue = isEditing && editValue !== undefined ? editValue : value;

  return (
    <div>
      <label className={`${themeClasses.text.secondary} text-xs mb-1 block`}>{label}</label>
      {isEditing ? (
        type === 'textarea' ? (
          <textarea
            value={displayValue}
            onChange={(e) => onInputChange(field, e.target.value)}
            className={`w-full ${themeClasses.bg.input} border ${themeClasses.border.default} rounded-xl py-2 px-3 ${themeClasses.text.primary} min-h-[80px] text-sm`}
            placeholder={placeholder}
            disabled={isSaving}
          />
        ) : (
          <input
            type={type}
            value={displayValue}
            onChange={(e) => onInputChange(field, e.target.value)}
            className={`w-full ${themeClasses.bg.input} border ${themeClasses.border.default} rounded-xl py-2 px-3 ${themeClasses.text.primary} text-sm`}
            placeholder={placeholder}
            disabled={isSaving}
          />
        )
      ) : (
        <p className={`${themeClasses.text.primary} text-sm`}>{value}</p>
      )}
    </div>
  );
};

// ==================== Account Settings ====================

const AccountSettings: React.FC = () => {
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  return (
    <div className={`${themeClasses.bg.card} border ${themeClasses.border.default} rounded-2xl p-5`}>
      <h3 className={`text-lg font-bold ${themeClasses.text.primary} mb-4`}>Настройки аккаунта</h3>
      <div className="space-y-3">
        <SettingItem
          title="Изменить пароль"
          description="Обновите свой пароль для безопасности"
          buttonText="Изменить"
        />
      </div>
    </div>
  );
};

// ==================== Setting Item ====================

interface SettingItemProps {
  title: string;
  description: string;
  buttonText: string;
}

const SettingItem: React.FC<SettingItemProps> = ({ title, description, buttonText }) => {
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className={`${themeClasses.text.primary} font-medium text-sm`}>{title}</p>
        <p className={`${themeClasses.text.secondary} text-xs`}>{description}</p>
      </div>
      <Button variant="secondary" className="!py-1.5 !px-3 text-sm">{buttonText}</Button>
    </div>
  );
};

// ==================== Theme Setting Item ====================

interface ThemeSettingItemProps {
  title: string;
  description: string;
  currentTheme: 'dark' | 'light';
  onToggle: () => void;
}

const ThemeSettingItem: React.FC<ThemeSettingItemProps> = ({ title, description, currentTheme, onToggle }) => {
  const { theme } = useTheme();
  const tc = getThemeClasses(theme);
  const toggleBg = currentTheme === 'dark' ? tc.primary.bg : (theme === 'dark' ? 'bg-[#3D2F28]' : 'bg-gray-300');

  return (
    <div className="flex items-center justify-between">
      <div>
        <p className={`${tc.text.primary} font-medium text-sm`}>{title}</p>
        <p className={`${tc.text.secondary} text-xs`}>{description}</p>
      </div>
      <button
        onClick={onToggle}
        className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-200 ${toggleBg}`}
        aria-label="Переключить тему"
      >
        <span
          className={`
            inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-200 shadow-md
            ${currentTheme === 'dark' ? 'translate-x-8' : 'translate-x-1'}
          `}
        />
        <span className="absolute left-1 top-1/2 -translate-y-1/2 text-xs">
          {currentTheme === 'dark' ? '🌙' : '☀️'}
        </span>
      </button>
    </div>
  );
};

export default SettingsPage;
