import WobbleRing from '../components/WobbleRing';
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { VerificationStep, UserState } from '../types';
import { Icons } from '../constants';
import Button from '../components/Button';
import Input from '../components/Input';
import OTPInput from '../components/OTPInput';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/theme';
import { usePageTitle } from '../hooks/usePageTitle';
import { logger } from '../utils/logger';
import { LEGAL_ROUTES } from '../constants/legalRoutes';
import {
  usePublicStats,
  formatStatCount,
  formatStatCompact,
  formatStatRating,
} from '../hooks/queries/usePublicStats';
import { AppIcon, StarIcon } from '../components/icons';
import type { IconProps } from '@phosphor-icons/react';
import { Compass, Flask, ChatCircleText, TrendUp, UsersThree, Heart } from '@/components/Icon';
import LandingMapWidget from '../components/LandingMapWidget';
import ThemeToggle from '../components/ThemeToggle';

const LandingPage: React.FC = () => {
  usePageTitle('Главная');
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  const [step, setStep] = useState<VerificationStep>(VerificationStep.LANDING);
  const { data: publicStats, isLoading: isStatsLoading } = usePublicStats(
    step === VerificationStep.LANDING,
  );
  const [userState, setUserState] = useState<UserState>({ email: '', code: '' });
  const [isFormLoading, setIsFormLoading] = useState(false);
  const [timer, setTimer] = useState(59);

  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    const API_BASE_URL = import.meta.env.VITE_API_URL;
    const token = searchParams.get('token');

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
          logger.error('Network error', err);
          setStep(VerificationStep.ERROR);
        })
        .finally(() => setIsFormLoading(false));
    }
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
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
        <span className={`text-xl lg:text-2xl font-extrabold tracking-[-0.045em] font-display ${themeClasses.text.primary}`}>Coffee</span>
        <span className={`text-xl lg:text-2xl font-bold tracking-tight font-display ${themeClasses.primary.text}`}>Peek</span>
      </div>
    </div>
  );

  if (step === VerificationStep.LANDING) {
    const features: { Icon: React.ComponentType<IconProps>; title: string; desc: string }[] = [
      { Icon: Compass,        title: 'Карта кофеен',    desc: 'Найди лучшие кофейни поблизости с подробной информацией, фото и живыми отзывами.' },
      { Icon: Flask,          title: 'Инструменты',     desc: 'Подробные описания всех инструментов и методов приготовления кофе.' },
      { Icon: ChatCircleText, title: 'Чек-ины и отзывы', desc: 'Оценивай кофейни, оставляй отзывы и делись впечатлениями с друзьями.' },
      { Icon: TrendUp,        title: 'Рейтинги',        desc: 'Персональная система оценок и рекомендаций на основе твоих предпочтений.' },
      { Icon: UsersThree,     title: 'Сообщество',      desc: 'Общайся с другими любителями кофе, делись опытом и находи единомышленников.' },
      { Icon: Heart,          title: 'Избранное',       desc: 'Сохраняй любимые кофейни на устройстве и быстро возвращайся к ним.' },
    ];

    const navTabs = [
      { label: 'Кофейни', href: '/shops' },
      { label: 'Карта',   href: '/dashboard?page=map' },
    ];
    const footerCols = [
      { t: 'Продукт', items: ['Кофейни', 'Карта'] },
      { t: 'Помощь',  items: ['Условия', 'Политика'] },
    ];
    const footerLinks: Record<string, string> = {
      Кофейни: '/shops',
      Карта: '/dashboard?page=map',
      Условия: LEGAL_ROUTES.terms,
      Политика: LEGAL_ROUTES.privacy,
    };

    const statsMobile = [
      {
        value: publicStats ? formatStatCount(publicStats.totalCoffeeShops) : '—',
        label: 'Кофеен',
      },
      {
        value: publicStats ? formatStatCompact(publicStats.totalReviews) : '—',
        label: 'Отзывов',
      },
      {
        value: publicStats ? formatStatCompact(publicStats.totalCheckIns) : '—',
        label: 'Чек-инов',
      },
      {
        value: publicStats ? formatStatRating(publicStats.averageRating) : '—',
        label: 'Средняя оценка',
        isRating: true,
      },
    ];

    const statsDesktop = [
      {
        value: publicStats ? formatStatCount(publicStats.totalCoffeeShops) : '—',
        label: 'кофеен на карте',
      },
      {
        value: publicStats ? formatStatCompact(publicStats.totalReviews) : '—',
        label: 'отзывов',
      },
      {
        value: publicStats ? formatStatCompact(publicStats.totalCheckIns) : '—',
        label: 'чек-инов',
      },
      {
        value: publicStats ? formatStatRating(publicStats.averageRating) : '—',
        label: 'средняя оценка',
        isRating: true,
      },
    ];

    return (
      <div className="min-h-screen bg-[#1A1412] relative overflow-x-clip text-white">
        {/* Dotted background */}
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#2D241F 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.55 }} />
        {/* Gold glows — kept inside the box so overflow clip doesn't leave a 1px edge in Firefox */}
        <div className="absolute pointer-events-none" style={{ top: -80, left: '50%', transform: 'translateX(-50%)', width: 720, height: 480, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(234,179,8,0.12), transparent 60%)', filter: 'blur(60px)' }} />
        <div className="absolute pointer-events-none" style={{ bottom: -40, right: -40, width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(180,140,75,0.10), transparent 60%)', filter: 'blur(60px)' }} />

        <div className="relative">
          {/* ── Nav desktop ─────────────────────────────────────── */}
          <header className="sticky top-0 z-50 hidden lg:block h-[72px] border-b border-[#3D2F28]" style={{ background: 'rgba(45,36,31,0.92)', transform: 'translateZ(0)' }}>
            <div className="max-w-[1280px] mx-auto px-8 h-full flex items-center justify-between gap-6">
              <button type="button" onClick={() => navigate('/')} className="logo-btn flex items-center gap-3 cursor-pointer">
                <div className="w-[38px] h-[38px] rounded-xl bg-[#1A1412] border border-[#3D2F28] flex items-center justify-center">
                  <img src="/logo-mark.svg" alt="" className="w-5 h-5" style={{ filter: 'brightness(0) saturate(100%) invert(73%) sepia(76%) saturate(657%) hue-rotate(11deg) brightness(94%) contrast(94%)' }} />
                </div>
                <span className="font-display font-extrabold tracking-[-0.02em] text-[20px] text-white">
                  Coffee<span className="text-[#EAB308]">Peek</span>
                </span>
              </button>
              <nav className="flex gap-1">
                {navTabs.map(({ label, href }) => (
                  <button key={label} onClick={() => navigate(href)}
                    className="font-display font-medium text-sm px-[14px] py-2 rounded-[10px] text-[#A39E93] hover:text-white transition-colors bg-transparent border border-transparent">
                    {label}
                  </button>
                ))}
              </nav>
              <div className="flex items-center gap-[10px]">
                <ThemeToggle size={40} />
                <button onClick={() => navigate('/login')}
                  className="px-4 py-[9px] rounded-[10px] bg-transparent border border-[#3D2F28] text-white font-display font-semibold text-[13px] hover:border-[#EAB308]/40 transition-colors">
                  Войти
                </button>
                <button onClick={() => navigate('/register')}
                  className="px-4 py-[9px] rounded-[10px] bg-[#EAB308] text-[#1A1412] border-none font-display font-semibold text-[13px] hover:bg-[#FACC15] transition-colors"
                  style={{ boxShadow: '0 4px 6px -4px rgba(180,140,75,.2), 0 10px 15px -3px rgba(180,140,75,.2)' }}>
                  Создать аккаунт
                </button>
              </div>
            </div>
          </header>

          {/* ── Top bar mobile ───────────────────────────────────── */}
          <div className="lg:hidden flex items-center justify-between px-5 pt-[60px] pb-0">
            <button type="button" onClick={() => navigate('/')} className="logo-btn flex items-center gap-[10px] cursor-pointer">
              <div className="w-9 h-9 rounded-xl bg-[#1A1412] border border-[#3D2F28] flex items-center justify-center">
                <img src="/logo-mark.svg" alt="" className="w-[18px] h-[18px]" style={{ filter: 'brightness(0) saturate(100%) invert(73%) sepia(76%) saturate(657%) hue-rotate(11deg) brightness(94%) contrast(94%)' }} />
              </div>
              <span className="font-display font-extrabold tracking-[-0.02em] text-[17px] text-white">
                Coffee<span className="text-[#EAB308]">Peek</span>
              </span>
            </button>
            <div className="flex items-center gap-2">
              <ThemeToggle size={36} />
              <button onClick={() => navigate('/login')}
              className="px-[14px] py-[7px] rounded-full bg-white/[0.04] border border-[#3D2F28] text-white font-display font-semibold text-[12px]">
                Войти
              </button>
            </div>
          </div>

          {/* ── Hero ─────────────────────────────────────────────── */}
          <section className="max-w-[1280px] mx-auto px-5 lg:px-8 pt-10 lg:pt-16 pb-9 relative">
            <div className="lg:grid lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:items-center">
              {/* Left: text */}
              <div className="text-center lg:text-left">
                {/* Badge */}
                <span className="inline-flex items-center gap-2 px-[14px] py-[6px] rounded-full text-[#EAB308] font-body font-bold text-[10px] lg:text-[12px] uppercase tracking-[.06em] border border-[#EAB308]/20"
                  style={{ background: 'rgba(234,179,8,.10)' }}>
                  <span className="w-[6px] h-[6px] lg:w-[7px] lg:h-[7px] rounded-full bg-[#22C55E]" />
                  Ваш проводник в мире кофе
                </span>

                {/* H1 */}
                <h1 className="mt-5 lg:mt-6 font-display font-black leading-[0.95] tracking-[-0.035em] text-white">
                  <span className="block font-body font-medium text-[13px] lg:text-[28px] tracking-[0.01em] text-[#A39E93] normal-case mb-2 lg:mb-3">
                    Добро пожаловать в
                  </span>
                  <span className="block text-[54px] lg:text-[88px] text-[#EAB308] tracking-[-0.045em]">CoffeePeek</span>
                </h1>

                {/* Description */}
                <p className="mt-5 lg:mt-6 mx-auto lg:mx-0 max-w-[320px] lg:max-w-[520px] font-body text-[14px] lg:text-[17px] leading-[1.55] text-[#A39E93]">
                  Удобный инструмент для любителей кофе. Открой для себя лучшие кофейни, оставляй отзывы и делись впечатлениями с единомышленниками.
                </p>

                {/* CTAs */}
                <div className="mt-[26px] lg:mt-8 flex flex-col lg:flex-row lg:inline-flex gap-[10px]">
                  <button onClick={() => navigate('/register')}
                    className="h-[52px] px-7 rounded-[14px] bg-[#EAB308] text-[#1A1412] border-none font-display font-bold text-[15px] inline-flex items-center justify-center gap-2 hover:bg-[#FACC15] active:scale-[0.98] transition-all"
                    style={{ boxShadow: '0 4px 6px -4px rgba(180,140,75,.3), 0 10px 25px -3px rgba(234,179,8,.25)' }}>
                    <AppIcon name="arrow_forward" size={18} />
                    Создать аккаунт
                  </button>
                  <button onClick={() => navigate('/login')}
                    className="h-[52px] px-[26px] rounded-[14px] text-white font-display font-semibold text-[15px] inline-flex items-center justify-center gap-2 border border-[#3D2F28] hover:border-[#EAB308]/40 active:scale-[0.98] transition-all"
                    style={{ background: 'rgba(255,255,255,0.04)' }}>
                    <AppIcon name="login" size={18} />
                    Войти
                  </button>
                </div>
              </div>

              {/* Right: live map preview (desktop only) */}
              <div className="hidden lg:block">
                <LandingMapWidget />
              </div>
            </div>

            {/* Stats strip */}
            <div className="mt-8 lg:mt-16 rounded-[16px] lg:rounded-[20px] px-4 py-4 lg:px-8 lg:py-6 border border-[#3D2F28]"
              style={{ background: 'rgba(45,36,31,0.55)', backdropFilter: 'blur(12px)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}>
              {/* Mobile: 2x2 grid */}
              <div className="grid grid-cols-2 gap-4 lg:hidden">
                {statsMobile.map(({ value, label, isRating }) => (
                  <div key={label}>
                    <div className={`font-display font-bold text-[22px] tracking-[-0.02em] text-white leading-none inline-flex items-center gap-1.5 ${isStatsLoading ? 'animate-pulse opacity-40' : ''}`}>
                      {isRating && value !== '—' && <StarIcon filled size={18} className="text-[#EAB308]" />}
                      {value}
                    </div>
                    <div className="mt-1 font-body text-[10px] text-[#A39E93] uppercase tracking-[.04em]">{label}</div>
                  </div>
                ))}
              </div>
              {/* Desktop: row */}
              <div className="hidden lg:flex items-center justify-between gap-8">
                {statsDesktop.map(({ value, label, isRating }, i) => (
                  <React.Fragment key={label}>
                    <div className="text-left">
                      <div className={`font-display font-bold text-[32px] tracking-[-0.02em] text-white leading-none inline-flex items-center gap-2 ${isStatsLoading ? 'animate-pulse opacity-40' : ''}`}>
                        {isRating && value !== '—' && <StarIcon filled size={22} className="text-[#EAB308]" />}
                        {value}
                      </div>
                      <div className="mt-[6px] font-body text-[12px] text-[#A39E93] uppercase tracking-[.04em]">{label}</div>
                    </div>
                    {i < statsDesktop.length - 1 && <div className="w-px h-9 bg-[#3D2F28]" />}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </section>

          {/* ── Features ─────────────────────────────────────────── */}
          <section className="max-w-[1280px] mx-auto px-5 lg:px-8 pt-9 lg:pt-10 pb-4">
            <div className="flex items-end justify-between mb-4 lg:mb-6">
              <div>
                <span className="font-body font-bold text-[10px] lg:text-[12px] uppercase tracking-[.08em] text-[#EAB308]">Что внутри</span>
                <h2 className="mt-2 font-display font-bold text-[22px] lg:text-[36px] tracking-[-0.025em] text-white">Всё для жизни вокруг кофе</h2>
              </div>
              <button className="hidden lg:inline-flex items-center gap-[6px] px-4 py-[10px] rounded-xl border border-[#3D2F28] text-white font-display font-semibold text-[13px] bg-transparent hover:border-[#EAB308]/40 transition-colors">
                Все возможности <AppIcon name="arrow_forward" size={14} />
              </button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-[10px] lg:gap-4">
              {features.map(({ Icon, title, desc }, i) => (
                <article key={title}
                  className="relative rounded-[18px] lg:rounded-[20px] p-4 lg:p-[22px] border border-[#3D2F28] transition-all duration-200 hover:-translate-y-[2px] cursor-pointer group"
                  style={{ background: '#2D241F', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)' }}>
                  {(i === 0 || i === 4) && (
                    <div className="absolute top-[-30px] right-[-30px] w-[120px] h-[120px] rounded-full pointer-events-none"
                      style={{ background: 'radial-gradient(circle, rgba(234,179,8,0.12), transparent 60%)' }} />
                  )}
                  <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl lg:rounded-[14px] flex items-center justify-center border border-[rgba(180,140,75,.25)]"
                    style={{ background: 'rgba(180,140,75,.14)' }}>
                    <Icon size={22} color="#EAB308" className="lg:w-6 lg:h-6" />
                  </div>
                  <h3 className="mt-[14px] lg:mt-[18px] mb-1 font-display font-bold text-[15px] lg:text-[18px] tracking-[-0.01em] text-white">{title}</h3>
                  <p className="font-body text-[12px] lg:text-[13px] leading-[1.5] text-[#A39E93]">{desc}</p>
                  <div className="mt-[14px] hidden lg:inline-flex items-center gap-1 font-display font-semibold text-[12px] text-[#EAB308] opacity-60 group-hover:opacity-100 transition-opacity">
                    Подробнее <AppIcon name="arrow_forward" size={14} />
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* ── CTA Banner ───────────────────────────────────────── */}
          <section className="max-w-[1280px] mx-auto px-5 lg:px-8 pt-[30px] lg:pt-14 pb-6">
            <div className="relative overflow-hidden rounded-[18px] lg:rounded-[24px] p-5 lg:px-12 lg:py-9 border border-[rgba(180,140,75,.35)] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6"
              style={{ background: 'linear-gradient(135deg, #2D241F 0%, rgba(180,140,75,0.18) 100%)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)' }}>
              <div className="absolute top-[-80px] right-[-80px] w-[320px] h-[320px] rounded-full pointer-events-none lg:block hidden"
                style={{ background: 'radial-gradient(circle, rgba(234,179,8,0.18), transparent 60%)', filter: 'blur(40px)' }} />
              <div className="absolute top-[-50px] right-[-50px] w-[200px] h-[200px] rounded-full pointer-events-none lg:hidden"
                style={{ background: 'radial-gradient(circle, rgba(234,179,8,0.20), transparent 60%)' }} />
              <div className="relative">
                <span className="font-body font-bold text-[10px] lg:text-[11px] uppercase tracking-[.08em] text-[#EAB308]">Присоединяйся к сообществу</span>
                <h2 className="mt-[6px] font-display font-bold text-[20px] lg:text-[32px] tracking-[-0.02em] text-white leading-[1.15]">
                  Делись опытом и открывай<br className="hidden lg:block" />новые кофейни рядом с тобой.
                </h2>
              </div>
              <button onClick={() => navigate('/register')}
                className="relative h-12 lg:h-[56px] px-6 lg:px-8 rounded-xl lg:rounded-[14px] bg-[#EAB308] text-[#1A1412] border-none font-display font-bold text-[14px] lg:text-[15px] inline-flex items-center justify-center gap-[8px] lg:gap-[10px] whitespace-nowrap hover:bg-[#FACC15] active:scale-[0.98] transition-all"
                style={{ boxShadow: '0 4px 6px -4px rgba(180,140,75,.4), 0 10px 25px -3px rgba(234,179,8,.35)' }}>
                <AppIcon name="rocket_launch" size={18} />
                Создать аккаунт
              </button>
            </div>
          </section>

          {/* ── Footer desktop ───────────────────────────────────── */}
          <footer className="max-w-[1280px] mx-auto px-8 pt-10 pb-12 hidden lg:block">
            <div className="flex items-start justify-between gap-6 pb-7 border-b border-[#3D2F28]">
              <div className="max-w-[320px]">
                <div className="flex items-center gap-[10px]">
                  <div className="w-8 h-8 rounded-[10px] bg-[#1A1412] border border-[#3D2F28] flex items-center justify-center">
                    <img src="/logo-mark.svg" alt="" className="w-[17px] h-[17px]" style={{ filter: 'brightness(0) saturate(100%) invert(73%) sepia(76%) saturate(657%) hue-rotate(11deg) brightness(94%) contrast(94%)' }} />
                  </div>
                  <span className="font-display font-bold text-[17px] text-white">Coffee<span className="text-[#EAB308]">Peek</span></span>
                </div>
                <p className="mt-3 font-body text-[13px] text-[#A39E93] leading-[1.55]">
                  Проводник в мире кофе. Карта, отзывы, инструменты и сообщество — в одном приложении.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-14">
                {footerCols.map((col) => (
                  <div key={col.t}>
                    <div className="font-body font-bold text-[11px] uppercase tracking-[.08em] text-[#A39E93] mb-3">{col.t}</div>
                    <div className="flex flex-col gap-2">
                      {col.items.map((item) => {
                        const href = footerLinks[item];
                        if (!href) {
                          return (
                            <span key={item} className="font-body text-[13px] text-[#A39E93]">{item}</span>
                          );
                        }
                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() => navigate(href)}
                            className="font-body text-[13px] text-white text-left cursor-pointer hover:text-[#EAB308] transition-colors"
                          >
                            {item}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-[18px] flex items-center justify-between font-body text-[12px] text-[#5C544F]">
              <span>© 2026 CoffeePeek</span>
              <div className="flex items-center gap-[14px]">
                <span className="inline-flex items-center gap-[5px]"><AppIcon name="language" size={14} />Русский</span>
                <span>Минск</span>
                <span>·</span>
                <span className="text-[#22C55E] inline-flex items-center gap-1">
                  <AppIcon name="circle" filled size={8} color="#22C55E" />
                  Все системы работают
                </span>
              </div>
            </div>
          </footer>

          {/* ── Footer mobile ────────────────────────────────────── */}
          <div className="lg:hidden px-5 pt-7 pb-10 mt-2 border-t border-[#3D2F28] text-center font-body text-[11px] text-[#5C544F] leading-[1.7]">
            © 2026 CoffeePeek
            <br />
            <span className="text-[#22C55E] inline-flex items-center justify-center gap-1">
              <AppIcon name="circle" filled size={8} color="#22C55E" />
              Все системы работают
            </span>
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
      {theme === 'dark' && <div className="absolute inset-0 bg-pattern opacity-20 pointer-events-none hidden lg:block" />}
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
                  <h1 className={`text-3xl lg:text-4xl font-bold font-display ${textPrimary} mb-3 tracking-tight`}>Join CoffeePeek</h1>
                  <p className={`font-body ${textSecondary} lg:text-lg`}>Enter your email to join the exclusive waitlist.</p>
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
                  <h1 className={`text-3xl lg:text-4xl font-bold font-display ${textPrimary} mb-3 tracking-tight`}>Verify Identity</h1>
                  <p className={`font-body ${textSecondary} lg:text-lg`}>A 6-digit code was sent to <span className={`${themeClasses.primary.text} font-semibold`}>{userState.email}</span></p>
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
                        <p className={`font-body text-sm lg:text-base ${textTertiary}`}>Resend in <span className={`${textSecondary} font-medium`}>{timer}s</span></p>
                      ) : (
                        <button onClick={() => setTimer(59)} className={`font-body text-sm lg:text-base ${themeClasses.primary.text} font-medium`}>Resend code</button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === VerificationStep.LINK_PROCESSING && (
              <div className="text-center animate-in fade-in duration-500 py-12">
                <WobbleRing size={56} className="mx-auto mb-8" />
                <h1 className={`text-3xl font-bold font-display ${textPrimary} mb-3`}>Verifying Secure Link</h1>
                <p className={`font-body ${textSecondary}`}>Please wait while we confirm your credentials...</p>
                <p className={`${textTertiary} text-sm mt-4 font-mono truncate px-4`}>UID: {userState.userId}</p>
              </div>
            )}

            {step === VerificationStep.SUCCESS && (
              <div className="text-center animate-in zoom-in-95 duration-700 pt-10 lg:pt-6">
                <div className="flex flex-col items-center">
                  <div className={`w-24 h-24 lg:w-32 lg:h-32 ${themeClasses.primary.bgLight} rounded-full flex items-center justify-center mb-8 animate-bounce duration-[2000ms] border ${themeClasses.primary.borderLighter} shadow-lg ${themeClasses.primary.shadow}`}>
                    <Icons.Check />
                  </div>
                  <h1 className={`text-4xl lg:text-5xl font-bold font-display ${textPrimary} mb-4 tracking-tight`}>Verified!</h1>
                  <p className={`font-body ${textSecondary} text-lg lg:text-xl max-w-[320px] mx-auto leading-relaxed`}>
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

