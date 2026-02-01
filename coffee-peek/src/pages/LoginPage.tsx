import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { login } from '../api/auth';
import { parseJWT, isTokenExpired, getUserRoles } from '../utils/jwt';
import { useUser } from '../contexts/UserContext';
import Button from '../components/Button';
import Input from '../components/Input';
import { Icons } from '../constants';
import { getErrorMessage } from '../utils/errorHandler';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/theme';
import { usePageTitle } from '../hooks/usePageTitle';
import { logger } from '../utils/logger';

const LoginPage: React.FC = () => {
  usePageTitle('Вход');
  const navigate = useNavigate();
  const location = useLocation();
  const { updateUserFromToken } = useUser();
  const { theme, toggleTheme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/shops';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await login({ email, password });
      
      // Логируем ответ для отладки
      logger.log('Login response:', response);
      
      // Проверяем наличие токена в ответе
      if (!response.data?.accessToken) {
        logger.error('No accessToken in response:', response);
        throw new Error('Токен не получен от сервера');
      }
      
      const { accessToken, refreshToken } = response.data;
      
      // Проверяем токен перед сохранением
      if (isTokenExpired(accessToken)) {
        throw new Error('Токен истёк');
      }

      // Парсим claims из токена
      const claims = parseJWT(accessToken);
      const roles = getUserRoles(accessToken);
      
      logger.log('Login successful. Claims:', claims);
      logger.log('User roles:', roles);

      // Сохраняем токены
      localStorage.setItem('accessToken', accessToken);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }

      // Обновляем контекст пользователя
      updateUserFromToken(accessToken);
      
      // Перенаправляем на страницу, с которой пришли, или на shops
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(getErrorMessage(err, 'login'));
      logger.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const bgPrimary = theme === 'dark' ? 'bg-[#1A1412]' : 'bg-white';
  const bgCard = theme === 'dark' ? 'bg-[#1A1412]/80' : 'bg-white/90';
  const borderCard = theme === 'dark' ? 'border-[#3D2F28]' : 'border-gray-200';
  const textPrimary = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const textSecondary = theme === 'dark' ? 'text-[#A39E93]' : 'text-gray-600';
  const glowBg = theme === 'dark' ? 'bg-[#EAB308]/5' : 'bg-[#EAB308]/10';
  const shadowCard = theme === 'dark' ? 'shadow-black/50' : 'shadow-gray-200/50';
  const headerBg = theme === 'dark' ? 'bg-[#2D241F]' : 'bg-gray-100';
  const headerBorder = theme === 'dark' ? 'border-[#3D2F28]' : 'border-gray-200';

  const renderHeader = () => (
    <div className="flex flex-col items-center mb-8 lg:mb-12">
      <div className={`w-16 h-16 lg:w-20 lg:h-20 ${headerBg} rounded-2xl flex items-center justify-center mb-6 border ${headerBorder} shadow-inner transform transition-transform hover:scale-105 duration-300`}>
        <Icons.Coffee />
      </div>
      <div className="flex items-center gap-2 mb-1">
        <span className={`text-xl lg:text-2xl font-bold tracking-tight ${textPrimary}`}>Coffee</span>
        <span className="text-xl lg:text-2xl font-bold tracking-tight text-[#EAB308]">Peek</span>
      </div>
    </div>
  );

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-4 lg:p-8 ${bgPrimary} relative overflow-hidden`}>
      <div className="absolute inset-0 bg-pattern opacity-20 pointer-events-none hidden lg:block" />
      <div className={`absolute top-[-10%] left-[-10%] w-[60%] h-[60%] ${glowBg} blur-[120px] rounded-full hidden lg:block`} />

      {/* Кнопка переключения темы */}
      <button
        onClick={toggleTheme}
        className={`absolute top-6 right-6 z-20 ${themeClasses.bg.card} ${themeClasses.border.default} border rounded-full p-3 transition-all hover:scale-110 ${textPrimary}`}
        aria-label="Переключить тему"
      >
        {theme === 'dark' ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="4"></circle>
            <path d="M12 2v2"></path>
            <path d="M12 20v2"></path>
            <path d="m4.93 4.93 1.41 1.41"></path>
            <path d="m17.66 17.66 1.41 1.41"></path>
            <path d="M2 12h2"></path>
            <path d="M20 12h2"></path>
            <path d="m6.34 17.66-1.41 1.41"></path>
            <path d="m19.07 4.93-1.41 1.41"></path>
          </svg>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        )}
      </button>

      <div className="w-full max-w-md lg:max-w-lg xl:max-w-xl mx-auto z-10">
        <div className={`relative ${bgCard} backdrop-blur-xl border-0 lg:border lg:${borderCard} lg:rounded-[32px] lg:p-12 lg:shadow-2xl lg:${shadowCard} transition-all duration-500`}>
          <div className="pt-8 lg:pt-0">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {renderHeader()}
              
              <div className="text-center mb-10">
                <h1 className={`text-3xl lg:text-4xl font-bold ${textPrimary} mb-3 tracking-tight`}>Вход</h1>
                <p className={`${textSecondary} lg:text-lg`}>Войдите в свой аккаунт</p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6 lg:space-y-8">
                <Input
                  label="Email"
                  placeholder="name@example.com"
                  type="email"
                  required
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="20" height="16" x="2" y="4" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  }
                />
                
                <Input
                  label="Пароль"
                  placeholder="••••••••"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  }
                />

                <div className="flex justify-center">
                  <Button type="submit" isLoading={isLoading} className="w-full sm:w-64 py-3 lg:py-4 lg:text-lg">
                    Войти
                  </Button>
                </div>
              </form>

              <div className="mt-6 text-center">
                <p className={`${textSecondary} text-sm`}>
                  Нет аккаунта?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/register')}
                    className="text-[#EAB308] font-medium hover:underline"
                  >
                    Зарегистрироваться
                  </button>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

