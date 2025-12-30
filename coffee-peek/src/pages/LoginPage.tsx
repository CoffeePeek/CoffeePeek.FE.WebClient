import React, { useState } from 'react';
import { login } from '../api/auth';
import { parseJWT, isTokenExpired, getUserRoles } from '../utils/jwt';
import Button from '../components/Button';
import Input from '../components/Input';
import { Icons } from '../constants';

interface LoginPageProps {
  onLoginSuccess: (accessToken: string, refreshToken?: string) => void;
  onSwitchToRegister: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onSwitchToRegister }) => {
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
      console.log('Login response:', response);
      
      // Проверяем наличие токена в ответе
      if (!response.data?.accessToken) {
        console.error('No accessToken in response:', response);
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
      
      console.log('Login successful. Claims:', claims);
      console.log('User roles:', roles);

      // Сохраняем токены
      localStorage.setItem('accessToken', accessToken);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }

      // Вызываем callback для успешного входа
      // Обновляем контекст пользователя через window.location для перезагрузки
      onLoginSuccess(accessToken, refreshToken);
    } catch (err: any) {
      setError(err.message || 'Ошибка при входе. Проверьте email и пароль.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const renderHeader = () => (
    <div className="flex flex-col items-center mb-8 lg:mb-12">
      <div className="w-16 h-16 lg:w-20 lg:h-20 bg-[#2D241F] rounded-2xl flex items-center justify-center mb-6 border border-[#3D2F28] shadow-inner transform transition-transform hover:scale-105 duration-300">
        <Icons.Coffee />
      </div>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl lg:text-2xl font-bold tracking-tight text-white">Coffee</span>
        <span className="text-xl lg:text-2xl font-bold tracking-tight text-[#EAB308]">Peek</span>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 lg:p-8 bg-[#1A1412] relative overflow-hidden">
      <div className="absolute inset-0 bg-pattern opacity-20 pointer-events-none hidden lg:block" />
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#EAB308]/5 blur-[120px] rounded-full hidden lg:block" />

      <div className="w-full max-w-md lg:max-w-lg xl:max-w-xl mx-auto z-10">
        <div className="relative bg-[#1A1412]/80 backdrop-blur-xl border-0 lg:border lg:border-[#3D2F28] lg:rounded-[32px] lg:p-12 lg:shadow-2xl lg:shadow-black/50 transition-all duration-500">
          <div className="pt-8 lg:pt-0">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              {renderHeader()}
              
              <div className="text-center mb-10">
                <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3 tracking-tight">Вход</h1>
                <p className="text-[#A39E93] lg:text-lg">Войдите в свой аккаунт</p>
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

                <Button type="submit" isLoading={isLoading} className="lg:py-5 lg:text-lg">
                  Войти
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-[#A39E93] text-sm">
                  Нет аккаунта?{' '}
                  <button
                    type="button"
                    onClick={onSwitchToRegister}
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

