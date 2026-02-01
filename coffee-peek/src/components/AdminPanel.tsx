import React, { useState, useEffect } from 'react';
import { changeUserRole, invalidateCache, getCacheCategories, InvalidateCacheResponse, CacheService } from '../api/admin';
import Button from './Button';
import Input from './Input';
import { useUser } from '../contexts/UserContext';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/theme';
import { TokenManager } from '../api/core/httpClient';

const AdminPanel: React.FC = () => {
  const { user } = useUser();
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);

  // State for change role
  const [userIdOfChange, setUserIdOfChange] = useState('');
  const [roleId, setRoleId] = useState('');
  const [isChangingRole, setIsChangingRole] = useState(false);
  const [roleChangeMessage, setRoleChangeMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // State for cache service selection
  const [selectedService, setSelectedService] = useState<CacheService>('account');

  // State for cache invalidation
  const [cacheCategory, setCacheCategory] = useState<string>('');
  const [invalidateAll, setInvalidateAll] = useState(false);
  const [isInvalidatingCache, setIsInvalidatingCache] = useState(false);
  const [cacheMessage, setCacheMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // State for cache categories (per service)
  const [cacheCategories, setCacheCategories] = useState<Record<string, Record<string, string>>>({
    'account': {},
    'shops': {},
    'jobs': {},
  });
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);

  useEffect(() => {
    loadCacheCategories();
  }, [selectedService]);

  const getAccessToken = (): string => {
    const token = TokenManager.getAccessToken();
    if (!token) {
      throw new Error('Токен доступа не найден');
    }
    return token;
  };

  const loadCacheCategories = async () => {
    try {
      setIsLoadingCategories(true);
      const token = getAccessToken();
      const response = await getCacheCategories(token, selectedService);
      if (response.success && response.data) {
        setCacheCategories(prev => ({
          ...prev,
          [selectedService]: response.data || {},
        }));
      }
    } catch (error: any) {
      console.error('Ошибка при загрузке категорий кэша:', error);
      setCacheMessage({ type: 'error', text: `Ошибка: ${error.message || 'Не удалось загрузить категории кэша'}` });
    } finally {
      setIsLoadingCategories(false);
    }
  };

  const handleChangeRole = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userIdOfChange.trim() || !roleId.trim()) {
      setRoleChangeMessage({ type: 'error', text: 'Заполните все поля' });
      return;
    }

    try {
      setIsChangingRole(true);
      setRoleChangeMessage(null);
      const token = getAccessToken();
      await changeUserRole(token, userIdOfChange.trim(), roleId.trim());
      setRoleChangeMessage({ type: 'success', text: 'Роль пользователя успешно изменена' });
      setUserIdOfChange('');
      setRoleId('');
    } catch (error: any) {
      console.error('Ошибка при изменении роли:', error);
      setRoleChangeMessage({ type: 'error', text: `Ошибка: ${error.message || 'Не удалось изменить роль'}` });
    } finally {
      setIsChangingRole(false);
    }
  };

  const handleInvalidateCache = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!invalidateAll && !cacheCategory.trim()) {
      setCacheMessage({ type: 'error', text: 'Выберите категорию или установите "Инвалидировать весь кэш"' });
      return;
    }

    try {
      setIsInvalidatingCache(true);
      setCacheMessage(null);
      const token = getAccessToken();
      const response = await invalidateCache(
        token,
        selectedService,
        invalidateAll ? undefined : cacheCategory.trim() || undefined,
        invalidateAll
      );

      if (response.success) {
        const serviceCategories = cacheCategories[selectedService] || {};
        const message = invalidateAll
          ? `Весь кэш сервиса "${selectedService}" успешно инвалидирован`
          : `Кэш категории "${serviceCategories[cacheCategory] || cacheCategory}" сервиса "${selectedService}" успешно инвалидирован`;
        setCacheMessage({ type: 'success', text: message });
        setCacheCategory('');
        setInvalidateAll(false);
      }
    } catch (error: any) {
      console.error('Ошибка при инвалидации кэша:', error);
      setCacheMessage({ type: 'error', text: `Ошибка: ${error.message || 'Не удалось инвалидировать кэш'}` });
    } finally {
      setIsInvalidatingCache(false);
    }
  };

  if (!user?.isAdmin) {
    return (
      <div className={`p-6 ${themeClasses.text.primary}`}>
        <p>У вас нет прав доступа к админ-панели.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className={`text-3xl font-bold ${themeClasses.text.primary} mb-2`}>Админ панель</h1>
        <p className={themeClasses.text.secondary}>Управление системой и пользователями</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Изменение роли пользователя */}
        <div className={`${themeClasses.bg.card} border ${themeClasses.border.default} rounded-2xl p-6`}>
          <h2 className={`text-xl font-semibold ${themeClasses.text.primary} mb-4`}>
            🔐 Изменение роли пользователя
          </h2>

          <form onSubmit={handleChangeRole} className="space-y-4">
            <div>
              <Input
                type="text"
                value={userIdOfChange}
                onChange={(e) => setUserIdOfChange(e.target.value)}
                placeholder="ID пользователя (GUID)"
                label="ID пользователя"
                className="w-full"
              />
            </div>

            <div>
              <Input
                type="text"
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                placeholder="ID роли (GUID)"
                label="ID роли"
                className="w-full"
              />
            </div>

            {roleChangeMessage && (
              <div className={`p-3 rounded-lg ${roleChangeMessage.type === 'success'
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                {roleChangeMessage.text}
              </div>
            )}

            <Button
              type="submit"
              isLoading={isChangingRole}
              className="w-full"
            >
              Изменить роль
            </Button>
          </form>
        </div>

        {/* Инвалидация кэша */}
        <div className={`${themeClasses.bg.card} border ${themeClasses.border.default} rounded-2xl p-6`}>
          <h2 className={`text-xl font-semibold ${themeClasses.text.primary} mb-4`}>
            🗑️ Инвалидация кэша
          </h2>

          <form onSubmit={handleInvalidateCache} className="space-y-4">
            <div>
              <label className={`block text-sm font-medium ${themeClasses.text.secondary} mb-2`}>
                Сервис
              </label>
              <select
                value={selectedService}
                onChange={(e) => {
                  setSelectedService(e.target.value as CacheService);
                  setCacheCategory('');
                  setInvalidateAll(false);
                }}
                className={`w-full px-4 py-2 ${themeClasses.bg.primary} border ${themeClasses.border.default} rounded-lg ${themeClasses.text.primary} focus:outline-none focus:ring-2 focus:ring-[#EAB308]/50`}
              >
                <option value="account">Admin Account (accountService)</option>
                <option value="shops">Admin Shops</option>
                <option value="jobs">Admin Jobs</option>
              </select>
            </div>

            <div>
              <label className={`flex items-center gap-2 cursor-pointer`}>
                <input
                  type="checkbox"
                  checked={invalidateAll}
                  onChange={(e) => {
                    setInvalidateAll(e.target.checked);
                    if (e.target.checked) {
                      setCacheCategory('');
                    }
                  }}
                  className="w-4 h-4 rounded border-gray-300 text-[#EAB308] focus:ring-[#EAB308]"
                />
                <span className={themeClasses.text.secondary}>Инвалидировать весь кэш</span>
              </label>
            </div>

            {!invalidateAll && (
              <div>
                <label className={`block text-sm font-medium ${themeClasses.text.secondary} mb-2`}>
                  Категория кэша
                </label>
                <select
                  value={cacheCategory}
                  onChange={(e) => setCacheCategory(e.target.value)}
                  className={`w-full px-4 py-2 ${themeClasses.bg.primary} border ${themeClasses.border.default} rounded-lg ${themeClasses.text.primary} focus:outline-none focus:ring-2 focus:ring-[#EAB308]/50`}
                  disabled={isLoadingCategories}
                >
                  <option value="">Выберите категорию</option>
                  {Object.entries(cacheCategories[selectedService] || {}).map(([key, description]) => (
                    <option key={key} value={key}>
                      {key} - {description}
                    </option>
                  ))}
                </select>
                {isLoadingCategories && (
                  <p className={`text-xs ${themeClasses.text.secondary} mt-1`}>Загрузка категорий...</p>
                )}
              </div>
            )}

            {cacheMessage && (
              <div className={`p-3 rounded-lg ${cacheMessage.type === 'success'
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-red-500/20 text-red-400 border border-red-500/30'
                }`}>
                {cacheMessage.text}
              </div>
            )}

            <Button
              type="submit"
              isLoading={isInvalidatingCache}
              className="w-full"
            >
              Инвалидировать кэш
            </Button>
          </form>
        </div>
      </div>

      {/* Информация о категориях кэша */}
      <div className={`mt-6 ${themeClasses.bg.card} border ${themeClasses.border.default} rounded-2xl p-6`}>
        <div className="flex items-center justify-between mb-4">
          <h2 className={`text-xl font-semibold ${themeClasses.text.primary}`}>
            📋 Доступные категории кэша
          </h2>
          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value as CacheService)}
            className={`px-4 py-2 ${themeClasses.bg.primary} border ${themeClasses.border.default} rounded-lg ${themeClasses.text.primary} focus:outline-none focus:ring-2 focus:ring-[#EAB308]/50 text-sm`}
          >
            <option value="account">Admin Account</option>
            <option value="shops">Admin Shops</option>
            <option value="jobs">Admin Jobs</option>
          </select>
        </div>

        {isLoadingCategories ? (
          <p className={themeClasses.text.secondary}>Загрузка...</p>
        ) : Object.keys(cacheCategories[selectedService] || {}).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(cacheCategories[selectedService] || {}).map(([key, description]) => (
              <div
                key={key}
                className={`p-4 ${themeClasses.bg.tertiary} border ${themeClasses.border.default} rounded-lg`}
              >
                <h3 className={`font-semibold ${themeClasses.text.primary} mb-1`}>{key}</h3>
                <p className={`text-sm ${themeClasses.text.secondary}`}>{description}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className={themeClasses.text.secondary}>Категории кэша для выбранного сервиса не загружены</p>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;
