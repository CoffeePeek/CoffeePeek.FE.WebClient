
import React, { useState, useEffect } from 'react';
import { VerificationStep, UserState } from '../types';
import { Icons } from './constants';
import Button from './components/Button';
import Input from './components/Input';
import OTPInput from './components/OTPInput';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ErrorPage from './pages/ErrorPage';
import ModeratorPanel from './components/ModeratorPanel';
import AdminPanel from './components/AdminPanel';
import CoffeeShopList from './components/CoffeeShopList';
import MapPage from './components/MapPage';
import Header from './components/Header';
import SettingsPage from './pages/SettingsPage';
import CoffeeShopPage from './pages/CoffeeShopPage';
import CreateReviewPage from './pages/CreateReviewPage';
import CreateCoffeeShopPage from './pages/CreateCoffeeShopPage';
import { UserProvider, useUser } from './contexts/UserContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import { ToastProvider, useToast } from './contexts/ToastContext';
import { parseJWT, isTokenExpired } from './utils/jwt';

type AppPage = 'landing' | 'login' | 'register' | 'verification' | 'dashboard' | 'coffeeshops' | 'moderation' | 'map' | 'jobs' | 'settings' | 'error';

const AppContent: React.FC = () => {
  const { user, isLoading, updateUserFromToken, logout } = useUser();
  const { theme } = useTheme();
  const [page, setPage] = useState<AppPage>('landing');
  const [step, setStep] = useState<VerificationStep>(VerificationStep.LANDING);
  const [userState, setUserState] = useState<UserState>({ email: '', code: '' });
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [timer, setTimer] = useState(59);
  
  // Add navigation state
  const [currentPage, setCurrentPage] = useState<string>('home');
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [creatingReviewForShopId, setCreatingReviewForShopId] = useState<string | null>(null);
  const [isCreatingCoffeeShop, setIsCreatingCoffeeShop] = useState(false);
  
  // Toast для уведомлений
  const { showServerError } = useToast();
  
  // Инициализируем глобальный обработчик ошибок
  useEffect(() => {
    import('./utils/globalErrorHandler').then(({ setGlobalErrorHandler }) => {
      setGlobalErrorHandler(() => {
        showServerError();
      });
    });
  }, [showServerError]);
  
  // Error state
  const [errorCode, setErrorCode] = useState<number | string>(404);
  const [errorTitle, setErrorTitle] = useState<string | undefined>(undefined);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  
  // Function to show error page
  const showError = (code: number | string, title?: string, message?: string) => {
    setErrorCode(code);
    setErrorTitle(title);
    setErrorMessage(message);
    setPage('error');
  };
  
  const handleNavigate = (pageName: string) => {
    setCurrentPage(pageName);
    setSelectedShopId(null); // Сбрасываем выбранную кофейню при навигации
    setSelectedUserId(null); // Сбрасываем выбранного пользователя
    setCreatingReviewForShopId(null); // Сбрасываем создание отзыва
    
    // Navigate to appropriate page
    if (['coffeeshops', 'moderation', 'map', 'jobs', 'settings'].includes(pageName)) {
      if (!user) {
        setPage('login');
        return;
      }
      setPage('dashboard');
    }
  };

  const handleShopSelect = (shopId: string) => {
    setSelectedShopId(shopId);
    setSelectedUserId(null); // Сбрасываем выбранного пользователя
  };

  const handleBackToShops = () => {
    setSelectedShopId(null);
    setSelectedUserId(null);
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId);
    setSelectedShopId(null); // Сбрасываем выбранную кофейню
  };

  const handleBackFromUser = () => {
    setSelectedUserId(null);
  };

  const handleCreateReview = (shopId: string) => {
    setCreatingReviewForShopId(shopId);
    setSelectedShopId(null);
    setSelectedUserId(null);
  };

  const handleBackFromCreateReview = () => {
    setCreatingReviewForShopId(null);
  };

  const handleReviewCreated = () => {
    const shopId = creatingReviewForShopId;
    setCreatingReviewForShopId(null);
    if (shopId) {
      setSelectedShopId(shopId); // Вернуться к странице кофейни
    }
  };

  const handleCreateCoffeeShop = () => {
    setIsCreatingCoffeeShop(true);
    setSelectedShopId(null);
    setSelectedUserId(null);
    setCreatingReviewForShopId(null);
  };

  const handleBackFromCreateCoffeeShop = () => {
    setIsCreatingCoffeeShop(false);
  };
  
  const handleLogout = () => {
    logout();
    setCurrentPage('home');
    setPage('landing');
  };

  
  // Переключаемся на dashboard когда пользователь загружен
  useEffect(() => {
    if (user && (page === 'landing' || page === 'verification')) {
      // Set current page to coffeeshops when user is logged in
      setCurrentPage('coffeeshops');
      setPage('dashboard');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Используем user.id вместо всего объекта user

  // Переключаемся на dashboard когда пользователь загружен
  useEffect(() => {
    if (user && (page === 'landing' || page === 'verification')) {
      // Set current page to coffeeshops when user is logged in
      setCurrentPage('coffeeshops');
      setPage('dashboard');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Используем user.id вместо всего объекта user

  useEffect(() => {
    const API_BASE_URL = import.meta.env.VITE_API_URL;
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
      setUserState(prev => ({ ...prev, token }));
      setStep(VerificationStep.LINK_PROCESSING);

      setIsFormLoading(true);

      const queryParams = new URLSearchParams({
        token: token
      }).toString();

      fetch(`${API_BASE_URL}/api/user/confirm-email?${queryParams}`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })
        .then(async (res) => {
          if (res.ok) {
            setStep(VerificationStep.SUCCESS);
          } else {
            const errorText = await res.text();
            if (errorText.includes("expired")) {
              setStep(VerificationStep.EXPIRED);
            } else {
              setStep(VerificationStep.ERROR);
            }
          }
        })
        .catch(err => {
          console.error('Network error', err);
          setStep(VerificationStep.ERROR);
          // Optionally show error page for critical errors
          // showError(500, 'Ошибка сети', 'Не удалось подключиться к серверу. Проверьте подключение к интернету.');
        })
        .finally(() => setIsFormLoading(false));
    }
  }, []);

  useEffect(() => {
    let interval: any;
    if (step === VerificationStep.ENTER_CODE && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleSendCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userState.email) return;
    setIsFormLoading(true);
    setTimeout(() => {
      setIsFormLoading(false);
      setStep(VerificationStep.ENTER_CODE);
      setTimer(59);
    }, 1200);
  };

  const handleVerify = (code?: string) => {
    const verificationCode = code || userState.code;
    if (verificationCode.length !== 6) return;
    setIsFormLoading(true);
    setTimeout(() => {
      setIsFormLoading(false);
      setStep(VerificationStep.SUCCESS);
    }, 1500);
  };

  const handleLoginSuccess = (accessToken: string, refreshToken?: string) => {
    updateUserFromToken(accessToken);
    setPage('dashboard');
  };

  // Если пользователь авторизован и на dashboard, показываем соответствующий контент
  if (page === 'dashboard' && user) {
    const bgClass = theme === 'dark' ? 'bg-[#1A1412]' : 'bg-white';
    const textClass = theme === 'dark' ? 'text-white' : 'text-gray-900';
    
    return (
      <div className={`min-h-screen ${bgClass}`}>
        <Header 
          currentPage={currentPage} 
          onNavigate={handleNavigate} 
          onLogout={handleLogout} 
        />
        <div className={`pt-16 min-h-screen ${bgClass}`}>
          {isCreatingCoffeeShop ? (
            <CreateCoffeeShopPage
              onBack={handleBackFromCreateCoffeeShop}
            />
          ) : creatingReviewForShopId ? (
            <CreateReviewPage
              shopId={creatingReviewForShopId}
              onBack={handleBackFromCreateReview}
              onReviewCreated={handleReviewCreated}
            />
        
          ) : selectedShopId ? (
            <CoffeeShopPage 
              shopId={selectedShopId} 
              onBack={handleBackToShops}
              onUserSelect={handleUserSelect}
              onCreateReview={handleCreateReview}
            />
          ) : (
            <>
              {currentPage === 'coffeeshops' || currentPage === 'home' ? (
                <CoffeeShopList onShopSelect={handleShopSelect} />
              ) : null}
              {currentPage === 'moderation' && user.isAdmin ? <ModeratorPanel /> : null}
              {currentPage === 'admin' && user.isAdmin ? <AdminPanel /> : null}
              {currentPage === 'map' ? <MapPage /> : null}
              {currentPage === 'jobs' ? <div className={`p-6 ${textClass}`}>Работа (в разработке)</div> : null}
              {currentPage === 'settings' ? (
                <SettingsPage 
                  onCreateCoffeeShop={handleCreateCoffeeShop}
                  onLogout={handleLogout}
                />
              ) : null}
            </>
          )}
        </div>
      </div>
    );
  }

  // Обработка страницы ошибки
  if (page === 'error') {
    return (
      <ErrorPage 
        errorCode={errorCode}
        title={errorTitle}
        message={errorMessage}
        onGoHome={() => {
          setPage('landing');
          setErrorCode(404);
          setErrorTitle(undefined);
          setErrorMessage(undefined);
        }}
      />
    );
  }

  // Обработка страниц логина/регистрации
  if (page === 'login') {
    return <LoginPage onLoginSuccess={handleLoginSuccess} onSwitchToRegister={() => setPage('register')} />;
  }

  if (page === 'register') {
    return (
      <RegisterPage 
        onRegisterSuccess={() => setPage('login')} 
        onSwitchToLogin={() => setPage('login')} 
      />
    );
  }

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

  // Landing Page (The "Plug")
  if (step === VerificationStep.LANDING) {
    const features = [
      {
        icon: <Icons.Map />,
        title: 'Карта кофеен',
        description: 'Найдите лучшие кофейни поблизости с подробной информацией и отзывами'
      },
      {
        icon: <Icons.Briefcase />,
        title: 'Поиск работы',
        description: 'Вакансии в кофейной индустрии для бариста, обжарщиков и других специалистов'
      },
      {
        icon: <Icons.Tool />,
        title: 'Инструменты',
        description: 'Подробные описания всех инструментов для приготовления кофе'
      },
      {
        icon: <Icons.CheckIn />,
        title: 'Чекины и отзывы',
        description: 'Оценивайте кофейни, оставляйте отзывы и делитесь впечатлениями'
      },
      {
        icon: <Icons.Star />,
        title: 'Рейтинги',
        description: 'Система оценок и рекомендаций на основе ваших предпочтений'
      },
      {
        icon: <Icons.Coffee />,
        title: 'Сообщество',
        description: 'Общайтесь с другими любителями кофе и делитесь опытом'
      }
    ];

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#1A1412] relative overflow-hidden">
        <div className="absolute inset-0 bg-pattern opacity-10 pointer-events-none" />
        <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[80%] bg-[#EAB308]/5 blur-[120px] rounded-full" />

        <div className="z-10 text-center max-w-5xl w-full animate-in fade-in zoom-in-95 duration-1000">
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#2D241F] border border-[#3D2F28] text-[#EAB308] text-sm font-medium mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#EAB308] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#EAB308]"></span>
              </span>
              CoffeePeek — ваш проводник в мире кофе
            </div>

            <h1 className="text-5xl lg:text-7xl font-bold text-white mb-6 tracking-tighter leading-tight">
              Добро пожаловать в <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#EAB308] to-[#FACC15]">CoffeePeek</span>
            </h1>

            <p className="text-[#A39E93] text-lg lg:text-xl mb-8 max-w-3xl mx-auto leading-relaxed">
              Удобный инструмент для любителей кофе. Откройте для себя лучшие кофейни, найдите работу в кофейной индустрии, 
              изучайте инструменты приготовления и делитесь впечатлениями с единомышленниками.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Button className="sm:w-64 py-5 text-lg" onClick={() => setPage('login')}>
                Войти
              </Button>
              <Button variant="secondary" className="sm:w-64 py-5 text-lg" onClick={() => setPage('register')}>
                Зарегистрироваться
              </Button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-[#2D241F]/60 backdrop-blur-sm border border-[#3D2F28] rounded-2xl p-6 hover:border-[#EAB308]/30 transition-all duration-300 hover:transform hover:scale-[1.02]"
              >
                <div className="flex items-center justify-center w-12 h-12 bg-[#EAB308]/10 rounded-xl mb-4 text-[#EAB308]">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-[#A39E93] text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Additional Info */}
          <div className="mt-12 pt-8 border-t border-[#3D2F28]">
            <p className="text-[#A39E93] text-sm max-w-2xl mx-auto">
              Присоединяйтесь к сообществу кофеманов, делитесь опытом, открывайте новые места и развивайтесь в кофейной индустрии вместе с CoffeePeek.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 lg:p-8 bg-[#1A1412] relative overflow-hidden">
      <div className="absolute inset-0 bg-pattern opacity-20 pointer-events-none hidden lg:block" />
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#EAB308]/5 blur-[120px] rounded-full hidden lg:block" />

      <div className="w-full max-w-md lg:max-w-lg xl:max-w-xl mx-auto z-10">
        <div className="relative bg-[#1A1412]/80 backdrop-blur-xl border-0 lg:border lg:border-[#3D2F28] lg:rounded-[32px] lg:p-12 lg:shadow-2xl lg:shadow-black/50 transition-all duration-500">

          {(step !== VerificationStep.SUCCESS && step !== VerificationStep.LINK_PROCESSING) && (
            <button
              onClick={() => setStep(VerificationStep.LANDING)}
              className="absolute left-0 lg:left-8 top-0 lg:top-8 text-[#A39E93] hover:text-[#EAB308] p-2 transition-all hover:translate-x-[-4px]"
            >
              <Icons.Back />
            </button>
          )}

          <div className="pt-8 lg:pt-0">
            {step === VerificationStep.ENTER_EMAIL && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {renderHeader()}
                <div className="text-center mb-10">
                  <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3 tracking-tight">Join CoffeePeek</h1>
                  <p className="text-[#A39E93] lg:text-lg">Enter your email to join the exclusive waitlist.</p>
                </div>

                <form onSubmit={handleSendCode} className="space-y-6 lg:space-y-8">
                  <Input
                    label="Email address"
                    placeholder="name@example.com"
                    type="email"
                    required
                    autoFocus
                    value={userState.email}
                    onChange={e => setUserState({ ...userState, email: e.target.value })}
                    icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>}
                  />
                  <Button type="submit" isLoading={isFormLoading} className="lg:py-5 lg:text-lg">
                    Request Access
                  </Button>
                </form>
              </div>
            )}

            {step === VerificationStep.ENTER_CODE && (
              <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="text-center mb-10">
                  <h1 className="text-3xl lg:text-4xl font-bold text-white mb-3 tracking-tight">Verify Identity</h1>
                  <p className="text-[#A39E93] lg:text-lg">A 6-digit code was sent to <span className="text-[#EAB308] font-semibold">{userState.email}</span></p>
                </div>
                <div className="space-y-10">
                  <div className="flex flex-col items-center">
                    <OTPInput length={6} onComplete={handleVerify} />
                  </div>
                  <div className="space-y-4">
                    <Button onClick={() => handleVerify()} isLoading={isFormLoading} disabled={userState.code.length < 6 && !isFormLoading} className="lg:py-5 lg:text-lg">
                      Confirm Code
                    </Button>
                    <div className="text-center pt-2">
                      {timer > 0 ? (
                        <p className="text-sm lg:text-base text-[#5C544F]">Resend in <span className="text-[#A39E93] font-medium">{timer}s</span></p>
                      ) : (
                        <button onClick={() => setTimer(59)} className="text-sm lg:text-base text-[#EAB308] font-medium hover:underline">Resend code</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === VerificationStep.LINK_PROCESSING && (
              <div className="text-center animate-in fade-in duration-500 py-12">
                <div className="w-16 h-16 border-4 border-[#EAB308] border-t-transparent rounded-full animate-spin mx-auto mb-8" />
                <h1 className="text-3xl font-bold text-white mb-3">Verifying Secure Link</h1>
                <p className="text-[#A39E93]">Please wait while we confirm your credentials...</p>
                <p className="text-[#5C544F] text-sm mt-4 font-mono truncate px-4">UID: {userState.userId}</p>
              </div>
            )}

            {step === VerificationStep.SUCCESS && (
              <div className="text-center animate-in zoom-in-95 duration-700 pt-10 lg:pt-6">
                <div className="flex flex-col items-center">
                  <div className="w-24 h-24 lg:w-32 lg:h-32 bg-[#EAB308]/10 rounded-full flex items-center justify-center mb-8 animate-bounce duration-[2000ms] border border-[#EAB308]/20 shadow-lg shadow-[#EAB308]/5">
                    <Icons.Check />
                  </div>
                  <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">Verified!</h1>
                  <p className="text-[#A39E93] text-lg lg:text-xl max-w-[320px] mx-auto leading-relaxed">
                    Account confirmed. You're now on the priority list.
                  </p>
                  <div className="w-full mt-12">
                    <Button onClick={() => window.location.href = '/'} className="lg:py-5 lg:text-lg">
                      Enter Application
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <UserProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </UserProvider>
    </ThemeProvider>
  );
};

export default App;
