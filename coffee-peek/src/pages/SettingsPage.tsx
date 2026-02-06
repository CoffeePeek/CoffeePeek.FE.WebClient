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

const SettingsPage: React.FC = () => {
  usePageTitle('Настройки');
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
    } catch (err: any) {
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
    
    // Сохраняем исходные значения
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
      // Проверяем тип файла
      if (!file.type.startsWith('image/')) {
        setError('Выберите изображение');
        return;
      }
      
      // Проверяем размер (например, максимум 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Размер файла не должен превышать 5MB');
        return;
      }
      
      setSelectedAvatarFile(file);
      
      // Создаем preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!profile) return;

    // Валидация обязательных полей
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

    // Проверяем email формат
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Введите корректный email');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      // Определяем измененные поля
      const updates: Promise<any>[] = [];
      
      if (editValues.userName !== originalValues.userName) {
        updates.push(updateUsername({ username: editValues.userName }));
      }
      
      if (editValues.email !== originalValues.email) {
        updates.push(updateEmail({ email: editValues.email }));
      }
      
      if (editValues.about !== originalValues.about) {
        updates.push(updateAbout({ about: editValues.about || '' }));
      }

      // Загружаем аватар, если выбран новый файл
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

        // Загружаем файл на S3
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

        // Отправляем полный объект UploadedPhotoDto
        updates.push(updateAvatar({
          uploadedPhoto: {
            fileName: selectedAvatarFile.name,
            contentType: selectedAvatarFile.type,
            storageKey: storageKey,
            size: selectedAvatarFile.size,
          },
        }));
      }

      // Отправляем только измененные поля
      if (updates.length > 0) {
        await Promise.all(updates);
        
        // Обновляем профиль после успешного сохранения
        const updatedProfile = await getProfile();
        setProfile(updatedProfile.data);
      }
      
      setIsEditing(false);
      setEditValues({});
      setOriginalValues({});
      setSelectedAvatarFile(null);
      setAvatarPreview(null);
    } catch (err: any) {
      setError(getErrorMessage(err));
      logger.error('Error updating profile:', err);
    } finally {
      setIsSaving(false);
    }
  }, [profile, editValues, originalValues, selectedAvatarFile]);

  return (
    <div className={`min-h-screen ${themeClasses.bg.primary} p-6`}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className={`text-4xl font-bold ${themeClasses.text.primary} mb-2`}>Настройки</h1>
          <p className={themeClasses.text.secondary}>Управление вашим аккаунтом и настройками приложения</p>
        </header>

        {/* Error Message */}
        {error && (
          <div className={`mb-6 p-4 ${theme === 'dark' ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'} border rounded-2xl`}>
            <p className={`text-sm ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
          </div>
        )}

        {/* Profile Card - показываем shimmer только для этой секции */}
        {userLoading || isLoading || !profile ? (
          <ProfileCardSkeleton />
        ) : (
          <ProfileCard
            profile={profile}
            isEditing={isEditing}
            selectedAvatarFile={selectedAvatarFile}
            avatarPreview={avatarPreview}
            onAvatarSelect={handleAvatarSelect}
            isSaving={isSaving}
          />
        )}

        {/* Info Sections Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Личная информация - показываем shimmer только для этой секции */}
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
          {/* Настройки аккаунта - статичные, показываем сразу */}
          <AccountSettings />
        </div>

        {/* Добавить кофейню */}
        <div className={`${themeClasses.bg.card} border ${themeClasses.border.default} rounded-2xl p-6 mb-6`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-xl font-bold ${themeClasses.text.primary} mb-2`}>Добавить кофейню</h3>
              <p className={`${themeClasses.text.secondary} text-sm`}>
                Отправьте новую кофейню на модерацию. После проверки она появится в каталоге.
              </p>
            </div>
            <Button
              variant="primary"
              onClick={() => navigate('/coffee-shops/new')}
              className="w-auto flex items-center gap-2"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Добавить кофейню
              </Button>
            </div>
          </div>

        {/* Настройки приложения */}
        <div className={`${themeClasses.bg.card} border ${themeClasses.border.default} rounded-2xl p-6 mb-6`}>
          <h3 className={`text-xl font-bold ${themeClasses.text.primary} mb-4`}>Настройки приложения</h3>

          <div className="space-y-4">
            <ThemeSettingItem
              title="Тема"
              description={theme === 'dark' ? 'Тёмная тема' : 'Светлая тема'}
              currentTheme={theme}
              onToggle={toggleTheme}
            />
          </div>
        </div>

        {/* Кнопка выхода */}
        <div className={`${themeClasses.bg.card} border ${themeClasses.border.default} rounded-2xl p-6`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className={`text-xl font-bold ${themeClasses.text.primary} mb-2`}>Выход из аккаунта</h3>
              <p className={`${themeClasses.text.secondary} text-sm`}>
                Выйти из текущего аккаунта
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="w-auto flex items-center gap-2"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
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
  );
};

// Компонент карточки профиля
interface ProfileCardProps {
  profile: UserProfile;
  isEditing: boolean;
  selectedAvatarFile: File | null;
  avatarPreview: string | null;
  onAvatarSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isSaving: boolean;
}

const ProfileCard: React.FC<ProfileCardProps> = ({
  profile,
  isEditing,
  selectedAvatarFile,
  avatarPreview,
  onAvatarSelect,
  isSaving,
}) => {
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);

  const displayAvatar = avatarPreview || profile.avatarUrl;

  return (
  <div className={`${themeClasses.bg.card} border ${themeClasses.border.default} rounded-2xl p-6 mb-6`}>
    <div className="flex flex-col md:flex-row gap-6">
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className="relative">
          <div className={`w-32 h-32 ${themeClasses.bg.input} rounded-full border-2 ${themeClasses.border.default} flex items-center justify-center overflow-hidden`}>
            {displayAvatar ? (
              <img src={displayAvatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className={`w-16 h-16 ${themeClasses.bg.tertiary} rounded-full flex items-center justify-center`}>
                <span className="text-[#EAB308] text-2xl font-bold">
                  {profile.userName?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
            )}
          </div>
          {isEditing && (
            <label className="absolute bottom-0 right-0 bg-[#EAB308] text-white rounded-full p-2 cursor-pointer hover:bg-[#CA8A04] transition-colors shadow-lg">
              <input
                type="file"
                accept="image/*"
                onChange={onAvatarSelect}
                disabled={isSaving}
                className="hidden"
              />
              <span className="material-symbols-outlined text-lg">camera_alt</span>
            </label>
          )}
        </div>
        {isEditing && selectedAvatarFile && (
          <p className={`text-xs mt-2 ${themeClasses.text.secondary} text-center`}>
            {selectedAvatarFile.name}
          </p>
        )}
      </div>

      {/* Profile Info */}
      <div className="flex-1">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className={`text-2xl font-bold ${themeClasses.text.primary} mb-1`}>
              {profile.userName}
            </h2>
            <p className={themeClasses.text.secondary}>{profile.email}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard label="Отзывы" value={profile.reviewCount || 0} />
          <StatCard label="Чекины" value={profile.checkInCount || 0} />
          <StatCard label="Добавлено кофеен" value={profile.addedShopsCount || 0} />
        </div>
      </div>
    </div>
  </div>
  );
};

// Компонент статистики
interface StatCardProps {
  label: string;
  value: number;
}

const StatCard: React.FC<StatCardProps> = ({ label, value }) => {
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  return (
  <div className={`${themeClasses.bg.input} border ${themeClasses.border.default} rounded-xl p-4`}>
    <p className={`${themeClasses.text.secondary} text-sm`}>{label}</p>
    <p className={`${themeClasses.text.primary} text-xl font-bold`}>{value}</p>
  </div>
  );
};

// Компонент личной информации
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
  <div className={`${themeClasses.bg.card} border ${themeClasses.border.default} rounded-2xl p-6`}>
    <div className="flex items-center justify-between mb-4">
      <h3 className={`text-xl font-bold ${themeClasses.text.primary}`}>Личная информация</h3>
      {!isEditing ? (
        <Button 
          variant="secondary" 
          onClick={onEditStart}
          className="w-auto"
        >
          Редактировать
        </Button>
      ) : (
        <div className="flex gap-2">
          <Button 
            variant="secondary" 
            onClick={onEditCancel}
            disabled={isSaving}
            className="w-auto"
          >
            Отмена
          </Button>
          <Button 
            variant="primary" 
            onClick={onSave}
            disabled={isSaving}
            isLoading={isSaving}
            className="w-auto"
          >
            Сохранить
          </Button>
        </div>
      )}
    </div>

    <div className="space-y-4">
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
        <label className={`${themeClasses.text.secondary} text-sm mb-1 block`}>Дата регистрации</label>
        <p className={themeClasses.text.primary}>
          {profile.createdAtUtc ? new Date(profile.createdAtUtc).toLocaleDateString('ru-RU') : 'Неизвестно'}
        </p>
      </div>
    </div>
  </div>
  );
};

// Компонент редактируемого поля информации
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
      <label className={`${themeClasses.text.secondary} text-sm mb-1 block`}>{label}</label>
      {isEditing ? (
        type === 'textarea' ? (
          <textarea
            value={displayValue}
            onChange={(e) => onInputChange(field, e.target.value)}
            className={`w-full ${themeClasses.bg.input} border ${themeClasses.border.default} rounded-xl py-2 px-4 ${themeClasses.text.primary} min-h-[100px]`}
            placeholder={placeholder}
            disabled={isSaving}
          />
        ) : (
          <input
            type={type}
            value={displayValue}
            onChange={(e) => onInputChange(field, e.target.value)}
            className={`w-full ${themeClasses.bg.input} border ${themeClasses.border.default} rounded-xl py-2 px-4 ${themeClasses.text.primary}`}
            placeholder={placeholder}
            disabled={isSaving}
          />
        )
      ) : (
        <p className={themeClasses.text.primary}>{value}</p>
      )}
    </div>
  );
};

// Компонент настроек аккаунта
const AccountSettings: React.FC = () => {
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  return (
  <div className={`${themeClasses.bg.card} border ${themeClasses.border.default} rounded-2xl p-6`}>
    <h3 className={`text-xl font-bold ${themeClasses.text.primary} mb-4`}>Настройки аккаунта</h3>

    <div className="space-y-4">
      <SettingItem
        title="Изменить пароль"
        description="Обновите свой пароль для безопасности аккаунта"
        buttonText="Изменить"
      />
    </div>
  </div>
  );
};

// Компонент элемента настройки
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
      <p className={`${themeClasses.text.primary} font-medium`}>{title}</p>
      <p className={`${themeClasses.text.secondary} text-sm`}>{description}</p>
    </div>
    <Button variant="secondary">{buttonText}</Button>
  </div>
  );
};

// Компонент настройки темы
interface ThemeSettingItemProps {
  title: string;
  description: string;
  currentTheme: 'dark' | 'light';
  onToggle: () => void;
}

const ThemeSettingItem: React.FC<ThemeSettingItemProps> = ({ title, description, currentTheme, onToggle }) => {
  const { theme } = useTheme();
  const themeClasses = theme === 'dark' 
    ? {
        border: 'border-[#3D2F28]',
        text: 'text-white',
        textSecondary: 'text-[#A39E93]',
        toggleBg: currentTheme === 'dark' ? 'bg-[#EAB308]' : 'bg-[#3D2F28]',
      }
    : {
        border: 'border-gray-200',
        text: 'text-gray-900',
        textSecondary: 'text-gray-600',
        toggleBg: currentTheme === 'dark' ? 'bg-[#EAB308]' : 'bg-gray-300',
      };

  return (
    <div className={`flex items-center justify-between py-3 border-b ${themeClasses.border} last:border-0`}>
      <div>
        <p className={`${themeClasses.text} font-medium`}>{title}</p>
        <p className={`${themeClasses.textSecondary} text-sm`}>{description}</p>
      </div>
      <button
        onClick={onToggle}
        className={`
          relative inline-flex h-8 w-16 items-center rounded-full transition-colors duration-200
          ${themeClasses.toggleBg}
        `}
        aria-label="Переключить тему"
      >
        <span
          className={`
            inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-200 shadow-md
            ${currentTheme === 'dark' ? 'translate-x-9' : 'translate-x-1'}
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
