import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import Button from '../components/Button';
import { getProfile, updateProfile, UserProfile, UpdateProfileRequest } from '../api/auth';
import { ProfileCardSkeleton, PersonalInfoSkeleton } from '../components/skeletons';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/theme';
import { getErrorMessage } from '../utils/errorHandler';

const SettingsPage: React.FC = () => {
  const { user, isLoading: userLoading, logout } = useUser();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<UserProfile>>({});
  const [error, setError] = useState<string | null>(null);

  const loadProfile = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        throw new Error('Токен доступа отсутствует');
      }
      
      const response = await getProfile(token);
      setProfile(response.data);
      setEditData(response.data);
      setError(null);
    } catch (err: any) {
      setError(getErrorMessage(err));
      console.error('Error loading profile:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleEditToggle = useCallback(() => {
    if (isEditing && profile) {
      setEditData(profile);
    }
    setIsEditing(prev => !prev);
    setError(null);
  }, [isEditing, profile]);

  const handleSave = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('accessToken');
      
      if (!token) {
        throw new Error('Токен доступа отсутствует');
      }
      
      const updateRequest: UpdateProfileRequest = {
        userName: editData.userName,
        email: editData.email,
        about: editData.about,
      };
      
      const response = await updateProfile(token, updateRequest);
      setProfile(response.data);
      setEditData(response.data);
      setIsEditing(false);
      setError(null);
    } catch (err: any) {
      setError(getErrorMessage(err));
      console.error('Error updating profile:', err);
    } finally {
      setIsLoading(false);
    }
  }, [editData]);

  const handleInputChange = useCallback((field: keyof UserProfile, value: any) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  }, []);

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
            editData={editData}
            isEditing={isEditing}
            onEditToggle={handleEditToggle}
            onSave={handleSave}
            onInputChange={handleInputChange}
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
              editData={editData}
              isEditing={isEditing}
              onInputChange={handleInputChange}
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
  editData: Partial<UserProfile>;
  isEditing: boolean;
  onEditToggle: () => void;
  onSave: () => void;
  onInputChange: (field: keyof UserProfile, value: any) => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({
  profile,
  editData,
  isEditing,
  onEditToggle,
  onSave,
  onInputChange,
}) => {
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  return (
  <div className={`${themeClasses.bg.card} border ${themeClasses.border.default} rounded-2xl p-6 mb-6`}>
    <div className="flex flex-col md:flex-row gap-6">
      {/* Avatar */}
      <div className="flex-shrink-0">
        <div className={`w-32 h-32 ${themeClasses.bg.input} rounded-full border-2 ${themeClasses.border.default} flex items-center justify-center overflow-hidden`}>
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <div className={`w-16 h-16 ${themeClasses.bg.tertiary} rounded-full flex items-center justify-center`}>
              <span className="text-[#EAB308] text-2xl font-bold">
                {profile.userName?.charAt(0)?.toUpperCase() || 'U'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Profile Info */}
      <div className="flex-1">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className={`text-2xl font-bold ${themeClasses.text.primary} mb-1`}>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.userName || ''}
                  onChange={(e) => onInputChange('userName', e.target.value)}
                  className={`${themeClasses.bg.input} border ${themeClasses.border.default} rounded-xl py-2 px-4 ${themeClasses.text.primary} w-full md:w-64`}
                  placeholder="Имя пользователя"
                />
              ) : (
                profile.userName
              )}
            </h2>
            <p className={themeClasses.text.secondary}>{profile.email}</p>
          </div>

          <div className="flex gap-2">
            <Button variant={isEditing ? "secondary" : "secondary"} onClick={onEditToggle}>
              {isEditing ? 'Отмена' : 'Редактировать'}
            </Button>
            {isEditing && (
              <Button variant="primary" onClick={onSave}>
                Сохранить
              </Button>
            )}
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
  editData: Partial<UserProfile>;
  isEditing: boolean;
  onInputChange: (field: keyof UserProfile, value: any) => void;
}

const PersonalInformation: React.FC<PersonalInformationProps> = ({
  profile,
  editData,
  isEditing,
  onInputChange,
}) => {
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  return (
  <div className={`${themeClasses.bg.card} border ${themeClasses.border.default} rounded-2xl p-6`}>
    <h3 className={`text-xl font-bold ${themeClasses.text.primary} mb-4`}>Личная информация</h3>

    <div className="space-y-4">
      <InfoField
        label="Имя пользователя"
        value={profile.userName}
        editValue={editData.userName || ''}
        isEditing={isEditing}
        onChange={(val) => onInputChange('userName', val)}
      />

      <InfoField
        label="Email"
        type="email"
        value={profile.email}
        editValue={editData.email || ''}
        isEditing={isEditing}
        onChange={(val) => onInputChange('email', val)}
      />

      <InfoField
        label="О себе"
        type="textarea"
        value={profile.about || 'Информация не указана'}
        editValue={editData.about || ''}
        isEditing={isEditing}
        onChange={(val) => onInputChange('about', val)}
        placeholder="Расскажите немного о себе..."
      />

      <div>
        <label className={`${themeClasses.text.secondary} text-sm mb-1 block`}>Дата регистрации</label>
        <p className={themeClasses.text.primary}>
          {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('ru-RU') : 'Неизвестно'}
        </p>
      </div>
    </div>
  </div>
  );
};

// Компонент поля информации
interface InfoFieldProps {
  label: string;
  value: string;
  editValue: string;
  isEditing: boolean;
  onChange: (value: string) => void;
  type?: 'text' | 'email' | 'textarea';
  placeholder?: string;
}

const InfoField: React.FC<InfoFieldProps> = ({
  label,
  value,
  editValue,
  isEditing,
  onChange,
  type = 'text',
  placeholder,
}) => {
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  return (
  <div>
    <label className={`${themeClasses.text.secondary} text-sm mb-1 block`}>{label}</label>
    {isEditing ? (
      type === 'textarea' ? (
        <textarea
          value={editValue}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full ${themeClasses.bg.input} border ${themeClasses.border.default} rounded-xl py-2 px-4 ${themeClasses.text.primary} min-h-[100px]`}
          placeholder={placeholder}
        />
      ) : (
        <input
          type={type}
          value={editValue}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full ${themeClasses.bg.input} border ${themeClasses.border.default} rounded-xl py-2 px-4 ${themeClasses.text.primary}`}
          placeholder={placeholder}
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

      <SettingItem
        title="Уведомления"
        description="Управляйте настройками уведомлений"
        buttonText="Настроить"
      />

      <SettingItem
        title="Конфиденциальность"
        description="Управляйте настройками приватности"
        buttonText="Настроить"
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
