import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { VerificationStep, UserState } from '../types';
import { Icons } from '../constants';
import Button from '../components/Button';
import Input from '../components/Input';
import OTPInput from '../components/OTPInput';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/theme';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  const [step, setStep] = useState<VerificationStep>(VerificationStep.LANDING);
  const [userState, setUserState] = useState<UserState>({ email: '', code: '' });
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [timer, setTimer] = useState(59);

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

  const renderHeader = () => (
    <div className="flex flex-col items-center mb-8 lg:mb-12">
      <div className={`w-16 h-16 lg:w-20 lg:h-20 ${themeClasses.bg.secondary} rounded-2xl flex items-center justify-center mb-6 border ${themeClasses.border.default} shadow-inner transform transition-transform hover:scale-105 duration-300`}>
        <Icons.Coffee />
      </div>
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl lg:text-2xl font-bold tracking-tight text-white">Coffee</span>
        <span className={`text-xl lg:text-2xl font-bold tracking-tight ${themeClasses.primary.text}`}>Peek</span>
      </div>
    </div>
  );

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

    const bgPrimary = themeClasses.bg.primary;
    const bgCard = themeClasses.bg.cardBackdrop;
    const borderCard = themeClasses.border.default;
    const textPrimary = themeClasses.text.primary;
    const textSecondary = themeClasses.text.secondary;
    const badgeBg = themeClasses.bg.badge;
    const badgeBorder = themeClasses.border.badge;
    const iconBg = themeClasses.effects.iconBg;
    const glowBg = themeClasses.effects.glow;

    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${bgPrimary} relative overflow-hidden`}>
        <div className="absolute inset-0 bg-pattern opacity-10 pointer-events-none" />
        <div className={`absolute top-[-20%] left-[-10%] w-[80%] h-[80%] ${glowBg} blur-[120px] rounded-full`} />

        {/* Кнопка переключения темы */}
        <button
          onClick={toggleTheme}
          className={`absolute top-6 right-6 z-20 ${badgeBg} ${badgeBorder} border rounded-full p-3 transition-all hover:scale-110 ${textPrimary}`}
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

        <div className="z-10 text-center max-w-5xl w-full animate-in fade-in zoom-in-95 duration-1000">
          <div className="mb-12">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${badgeBg} border ${badgeBorder} ${themeClasses.primary.text} text-sm font-medium mb-8`}>
              <span className="relative flex h-2 w-2">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${themeClasses.primary.bg} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${themeClasses.primary.bg}`}></span>
              </span>
              CoffeePeek — ваш проводник в мире кофе
            </div>

            <h1 className={`text-5xl lg:text-7xl font-bold ${textPrimary} mb-6 tracking-tighter leading-tight`}>
              Добро пожаловать в <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#EAB308] to-[#FACC15]">CoffeePeek</span>
            </h1>

            <p className={`${textSecondary} text-lg lg:text-xl mb-8 max-w-3xl mx-auto leading-relaxed`}>
              Удобный инструмент для любителей кофе. Откройте для себя лучшие кофейни, найдите работу в кофейной индустрии, 
              изучайте инструменты приготовления и делитесь впечатлениями с единомышленниками.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Button className="sm:w-64 py-5 text-lg" onClick={() => navigate('/login')}>
                Войти
              </Button>
              <Button variant="secondary" className="sm:w-64 py-5 text-lg" onClick={() => navigate('/register')}>
                Зарегистрироваться
              </Button>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {features.map((feature, index) => (
              <div
                key={index}
                className={`${bgCard} backdrop-blur-sm border ${borderCard} rounded-2xl p-6 ${themeClasses.border.activeHover} transition-all duration-300 hover:transform hover:scale-[1.02]`}
              >
                <div className={`flex items-center justify-center w-12 h-12 ${iconBg} rounded-xl mb-4 ${themeClasses.primary.text}`}>
                  {feature.icon}
                </div>
                <h3 className={`text-xl font-bold ${textPrimary} mb-2`}>{feature.title}</h3>
                <p className={`${textSecondary} text-sm leading-relaxed`}>{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Additional Info */}
          <div className={`mt-12 pt-8 border-t ${borderCard}`}>
            <p className={`${textSecondary} text-sm max-w-2xl mx-auto`}>
              Присоединяйтесь к сообществу кофеманов, делитесь опытом, открывайте новые места и развивайтесь в кофейной индустрии вместе с CoffeePeek.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const bgPrimary = themeClasses.bg.primary;
  const bgCard = themeClasses.bg.cardTransparent;
  const borderCard = themeClasses.border.default;
  const textPrimary = themeClasses.text.primary;
  const textSecondary = themeClasses.text.secondary;
  const textTertiary = themeClasses.text.tertiary;
  const glowBg = themeClasses.effects.glow;
  const shadowCard = themeClasses.effects.shadowCard;

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

          {(step !== VerificationStep.SUCCESS && step !== VerificationStep.LINK_PROCESSING) && (
            <button
              onClick={() => setStep(VerificationStep.LANDING)}
              className={`absolute left-0 lg:left-8 top-0 lg:top-8 ${textSecondary} ${themeClasses.primary.hover} p-2 transition-all hover:translate-x-[-4px]`}
            >
              <Icons.Back />
            </button>
          )}

          <div className="pt-8 lg:pt-0">
            {step === VerificationStep.ENTER_EMAIL && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {renderHeader()}
                <div className="text-center mb-10">
                  <h1 className={`text-3xl lg:text-4xl font-bold ${textPrimary} mb-3 tracking-tight`}>Join CoffeePeek</h1>
                  <p className={`${textSecondary} lg:text-lg`}>Enter your email to join the exclusive waitlist.</p>
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
                  <h1 className={`text-3xl lg:text-4xl font-bold ${textPrimary} mb-3 tracking-tight`}>Verify Identity</h1>
                  <p className={`${textSecondary} lg:text-lg`}>A 6-digit code was sent to <span className={`${themeClasses.primary.text} font-semibold`}>{userState.email}</span></p>
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
                        <p className={`text-sm lg:text-base ${textTertiary}`}>Resend in <span className={`${textSecondary} font-medium`}>{timer}s</span></p>
                      ) : (
                        <button onClick={() => setTimer(59)} className={`text-sm lg:text-base ${themeClasses.primary.text} font-medium hover:underline`}>Resend code</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === VerificationStep.LINK_PROCESSING && (
              <div className="text-center animate-in fade-in duration-500 py-12">
                <div className={`w-16 h-16 border-4 ${themeClasses.primary.border} border-t-transparent rounded-full animate-spin mx-auto mb-8`} />
                <h1 className={`text-3xl font-bold ${textPrimary} mb-3`}>Verifying Secure Link</h1>
                <p className={textSecondary}>Please wait while we confirm your credentials...</p>
                <p className={`${textTertiary} text-sm mt-4 font-mono truncate px-4`}>UID: {userState.userId}</p>
              </div>
            )}

            {step === VerificationStep.SUCCESS && (
              <div className="text-center animate-in zoom-in-95 duration-700 pt-10 lg:pt-6">
                <div className="flex flex-col items-center">
                  <div className={`w-24 h-24 lg:w-32 lg:h-32 ${themeClasses.primary.bgLight} rounded-full flex items-center justify-center mb-8 animate-bounce duration-[2000ms] border ${themeClasses.primary.borderLighter} shadow-lg ${themeClasses.primary.shadow}`}>
                    <Icons.Check />
                  </div>
                  <h1 className={`text-4xl lg:text-5xl font-bold ${textPrimary} mb-4 tracking-tight`}>Verified!</h1>
                  <p className={`${textSecondary} text-lg lg:text-xl max-w-[320px] mx-auto leading-relaxed`}>
                    Account confirmed. You're now on the priority list.
                  </p>
                  <div className="w-full mt-12">
                    <Button onClick={() => navigate('/login')} className="lg:py-5 lg:text-lg">
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

export default LandingPage;

