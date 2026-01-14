import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register, checkEmailExists } from '../api/auth';
import Button from '../components/Button';
import Input from '../components/Input';
import { Icons } from '../constants';
import { getErrorMessage } from '../utils/errorHandler';

type RegisterStep = 'email' | 'registration';

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<RegisterStep>('email');
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleEmailCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError('Введите email');
      return;
    }

    // Простая валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Введите корректный email');
      return;
    }

    setIsLoading(true);

    try {
      const response = await checkEmailExists(email);
      console.log('Email check response:', response);

      if (response.data) {
        setError(null);
        setSuccessMessage('Пользователь с таким email уже существует. Перенаправление на страницу входа...');
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      } else {
        setStep('registration');
      }
    } catch (err: any) {
      const errorMessage = getErrorMessage(err, 'register');
      setError(errorMessage);
      console.error('Email check error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    if (password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }

    setIsLoading(true);

    try {
      const response = await register({ 
        email, 
        password,
        userName: userName || undefined,
      });
      
      console.log('Register response:', response);
      
      if (!response.isSuccess) {
        throw new Error(response.message || 'Ошибка при регистрации');
      }
      
      console.log('Registration successful:', response.message);

      setSuccessMessage(response.message || 'Регистрация успешна! Теперь вы можете войти в систему.');
      
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      const errorMessage = getErrorMessage(err, 'register');
      setError(errorMessage);
      console.error('Registration error:', err);
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
                <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3 tracking-tight">
                  {step === 'email' ? 'Проверка email' : 'Регистрация'}
                </h1>
                <p className="text-[#A39E93] lg:text-lg">
                  {step === 'email' 
                    ? 'Введите email для проверки' 
                    : 'Завершите регистрацию'}
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {successMessage && (
                <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-2xl">
                  <p className="text-green-400 text-sm">{successMessage}</p>
                  {step === 'email' && (
                    <p className="text-green-400/70 text-xs mt-2">Перенаправление на страницу входа...</p>
                  )}
                  {step === 'registration' && (
                    <p className="text-green-400/70 text-xs mt-2">Перенаправление на страницу входа...</p>
                  )}
                </div>
              )}

              {step === 'email' ? (
                <form onSubmit={handleEmailCheck} className="space-y-6 lg:space-y-8">
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

                  <div className="flex justify-center">
                    <Button type="submit" isLoading={isLoading} className="lg:py-5 lg:text-lg">
                      Продолжить
                    </Button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-6 lg:space-y-8">
                  <div className="mb-4">
                    <p className="text-[#A39E93] text-sm mb-2">Email: <span className="text-white font-medium">{email}</span></p>
                    <button
                      type="button"
                      onClick={() => {
                        setStep('email');
                        setError(null);
                        setSuccessMessage(null);
                      }}
                      className="text-[#EAB308] text-sm hover:underline"
                    >
                      Изменить email
                    </button>
                  </div>
                  <Input
                    label="Имя пользователя"
                    placeholder="John Doe"
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    icon={
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    }
                  />
                  
                  <Input
                    label="Пароль"
                    placeholder="••••••••"
                    type="password"
                    required
                    autoFocus
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    icon={
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    }
                  />

                  <Input
                    label="Подтвердите пароль"
                    placeholder="••••••••"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    icon={
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    }
                  />

                  <div className="flex justify-center">
                    <Button type="submit" isLoading={isLoading} className="lg:py-5 lg:text-lg">
                      Зарегистрироваться
                    </Button>
                  </div>
                </form>
              )}

              <div className="mt-6 text-center">
                <p className="text-[#A39E93] text-sm flex items-center justify-center gap-2">
                  Уже есть аккаунт?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="text-[#EAB308] font-medium hover:underline"
                  >
                    Войти
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

export default RegisterPage;

