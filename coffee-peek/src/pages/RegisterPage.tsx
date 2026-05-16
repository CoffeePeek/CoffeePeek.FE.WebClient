import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { register, checkEmailExists } from '../api/auth';
import { getErrorMessage } from '../utils/errorHandler';
import { usePageTitle } from '../hooks/usePageTitle';
import { logger } from '../utils/logger';

type RegisterStep = 'email' | 'registration' | 'success';

// ── Auth field ─────────────────────────────────────────────────────
interface AuthFieldProps {
  icon?: string; type?: string; placeholder?: string;
  value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label?: string; trailing?: React.ReactNode; autoFocus?: boolean;
  error?: string; dark: boolean;
}

const AuthField: React.FC<AuthFieldProps> = ({ icon, type = 'text', placeholder, value, onChange, label, trailing, autoFocus, error, dark }) => {
  const [focused, setFocused] = useState(false);
  return (
    <label style={{ display: 'block', textAlign: 'left' }}>
      {label && <div style={{ fontFamily: '"Noto Sans",system-ui', fontSize: 12, fontWeight: 600, color: dark ? '#A39E93' : '#78716C', marginBottom: 6 }}>{label}</div>}
      <div style={{ position: 'relative' }}>
        {icon && (
          <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }}>
            <span className="material-symbols-rounded" style={{ fontSize: 20, color: dark ? '#D4A84B' : '#D4A84B', lineHeight: 1, verticalAlign: 'middle' }}>{icon}</span>
          </span>
        )}
        <input type={type} placeholder={placeholder} value={value} onChange={onChange} autoFocus={autoFocus}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            width: '100%', height: 50, borderRadius: 12,
            border: `1px solid ${error ? '#EF4444' : focused ? '#D4A84B' : dark ? '#3D2F28' : 'rgba(158,123,54,.4)'}`,
            background: dark ? 'rgba(255,255,255,0.03)' : '#fff',
            boxShadow: focused ? '0 0 0 4px rgba(234,179,8,0.08)' : 'none',
            padding: `0 ${trailing ? 44 : 16}px 0 ${icon ? 46 : 16}px`,
            fontSize: 15, fontFamily: '"Noto Sans",system-ui',
            color: dark ? '#fff' : '#1C1917',
            outline: 'none', boxSizing: 'border-box', transition: 'all .15s',
          }} />
        {trailing}
      </div>
      {error && (
        <div style={{ fontFamily: '"Noto Sans"', fontSize: 12, color: '#EF4444', marginTop: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
          <span className="material-symbols-rounded" style={{ fontSize: 14, lineHeight: 1 }}>error</span>{error}
        </div>
      )}
    </label>
  );
};

// ── Stepper ─────────────────────────────────────────────────────────
const Stepper: React.FC<{ step: 'email' | 'register'; dark: boolean }> = ({ step, dark }) => {
  const steps = ['Email', 'Регистрация', 'Готово'];
  const idx = step === 'email' ? 0 : 1;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 99, background: i <= idx ? 'rgba(234,179,8,0.12)' : dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)', color: i <= idx ? '#EAB308' : dark ? '#A39E93' : '#78716C', fontFamily: '"Noto Sans"', fontSize: 11, fontWeight: 600 }}>
            <span style={{ width: 16, height: 16, borderRadius: 99, background: i <= idx ? '#EAB308' : 'transparent', border: i <= idx ? 'none' : `1px solid ${dark ? '#3D2F28' : '#E7E5E4'}`, color: '#1A1412', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700 }}>
              {i < idx ? '✓' : i + 1}
            </span>
            {s}
          </span>
          {i < steps.length - 1 && <span style={{ width: 16, height: 1, background: dark ? '#3D2F28' : '#E7E5E4' }} />}
        </React.Fragment>
      ))}
    </div>
  );
};

// ── Password strength bar ────────────────────────────────────────────
const StrengthBar: React.FC<{ password: string; dark: boolean }> = ({ password, dark }) => {
  if (!password) return null;
  const score = (password.length >= 6 ? 1 : 0) + (/\d/.test(password) ? 1 : 0) + (/[A-ZА-Я]/.test(password) ? 1 : 0);
  const colors = ['#EF4444', '#EAB308', '#22C55E'];
  const labels = ['слабый', 'средний', 'надёжный'];
  return (
    <div style={{ display: 'flex', gap: 4, marginTop: 8, alignItems: 'center' }}>
      {[0,1,2].map(i => (
        <div key={i} style={{ flex: 1, height: 4, borderRadius: 99, background: i < score ? colors[score - 1] : dark ? '#3D2F28' : '#E7E5E4' }} />
      ))}
      <span style={{ fontFamily: '"Noto Sans"', fontSize: 11, color: dark ? '#A39E93' : '#78716C', marginLeft: 8 }}>{labels[score - 1] || ''}</span>
    </div>
  );
};

// ── Main component ───────────────────────────────────────────────────
const RegisterPage: React.FC = () => {
  usePageTitle('Регистрация');
  const navigate = useNavigate();
  const [step, setStep] = useState<RegisterStep>('email');
  const [userName, setUserName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [agreeToPrivacy, setAgreeToPrivacy] = useState(false);
  const [dark, setDark] = useState(true);

  const emailValid = /\S+@\S+\.\S+/.test(email.trim());
  const canRegister = userName.trim().length >= 2 && password.length >= 6 && agreeToPrivacy;

  const handleEmailCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!emailValid) { setError('Введите корректный email'); return; }
    setIsLoading(true);
    try {
      const response = await checkEmailExists(email.trim());
      if (response.data?.exists) {
        navigate('/login', { state: { email: email.trim() } });
      } else {
        setStep('registration');
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'register'));
      logger.error('Email check error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!agreeToPrivacy) { setError('Необходимо согласиться с условиями'); return; }
    if (password.length < 6) { setError('Пароль должен содержать минимум 6 символов'); return; }
    setIsLoading(true);
    try {
      localStorage.setItem('privacyConsent', 'accepted');
      localStorage.setItem('privacyConsentDate', new Date().toISOString());
      const response = await register({ email, password, userName: userName || undefined });
      if (!response.isSuccess) throw new Error(response.message || 'Ошибка при регистрации');
      setStep('success');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'register'));
      logger.error('Registration error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Derived colours
  const bg = dark ? '#1A1412' : '#FFFCF7';
  const cardBg = dark ? 'rgba(45,36,31,0.6)' : '#fff';
  const cardBorder = dark ? '#3D2F28' : '#E7E5E4';
  const textPrimary = dark ? '#fff' : '#1C1917';
  const textMuted = dark ? '#A39E93' : '#78716C';
  const gold = dark ? '#EAB308' : '#D4A84B';

  const PwdToggle = (
    <button type="button" onClick={() => setShowPwd(s => !s)} aria-label={showPwd ? 'Скрыть пароль' : 'Показать пароль'}
      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
      <span className="material-symbols-rounded" style={{ fontSize: 20, color: textMuted, lineHeight: 1 }}>{showPwd ? 'visibility_off' : 'visibility'}</span>
    </button>
  );

  return (
    <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', transition: 'background .3s' }}>
      {/* Dotted pattern */}
      {dark && <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(#2D241F 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.6, pointerEvents: 'none' }} />}
      {/* Glows */}
      <div style={{ position: 'absolute', top: -120, left: -120, width: 480, height: 480, borderRadius: '50%', background: `radial-gradient(circle, rgba(234,179,8,${dark ? '0.16' : '0.08'}), transparent 60%)`, filter: 'blur(40px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -160, right: -160, width: 520, height: 520, borderRadius: '50%', background: `radial-gradient(circle, rgba(180,140,75,${dark ? '0.10' : '0.06'}), transparent 60%)`, filter: 'blur(40px)', pointerEvents: 'none' }} />

      {/* Theme toggle */}
      <button onClick={() => setDark(d => !d)} aria-label="Переключить тему"
        style={{ position: 'absolute', top: 20, right: 20, zIndex: 10, width: 40, height: 40, borderRadius: 99, background: cardBg, border: `1px solid ${cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: dark ? 'blur(12px)' : 'none', transition: 'all .3s' }}>
        <span className="material-symbols-rounded" style={{ fontSize: 20, color: textPrimary, lineHeight: 1 }}>
          {dark ? 'light_mode' : 'dark_mode'}
        </span>
      </button>

      {/* Card */}
      <div style={{ width: '100%', maxWidth: 460, margin: '0 auto', padding: '16px', position: 'relative', zIndex: 2 }}>
        <div style={{ padding: 40, borderRadius: 24, background: cardBg, backdropFilter: dark ? 'blur(24px)' : 'none', border: `1px solid ${cardBorder}`, boxShadow: dark ? '0 24px 48px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)' : '0 8px 32px rgba(0,0,0,0.08)', transition: 'all .3s' }}>

          {/* Success screen */}
          {step === 'success' ? (
            <div style={{ textAlign: 'center', padding: '8px 0' }}>
              <div style={{ width: 88, height: 88, borderRadius: 99, background: dark ? 'rgba(234,179,8,0.12)' : 'rgba(234,179,8,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
                <span className="material-symbols-rounded star-filled" style={{ fontSize: 52, color: gold, lineHeight: 1 }}>mark_email_read</span>
              </div>
              <h1 style={{ margin: '24px 0 10px', fontFamily: '"RF Dewi Expanded","Sora"', fontWeight: 700, fontSize: 26, letterSpacing: '-0.02em', color: textPrimary }}>Проверьте почту</h1>
              <p style={{ margin: '0 0 28px', fontFamily: '"Noto Sans"', fontSize: 14, color: textMuted, lineHeight: 1.6 }}>
                Мы отправили ссылку на{' '}
                <span style={{ color: textPrimary, fontWeight: 600 }}>{email}</span>.<br />
                Перейдите по ссылке чтобы активировать аккаунт.<br />
                <span style={{ fontSize: 12 }}>Ссылка действует 10 минут.</span>
              </p>
              <button
                onClick={() => navigate('/login')}
                style={{ width: '100%', height: 48, borderRadius: 12, background: gold, color: '#1A1412', border: 'none', fontFamily: '"RF Dewi Expanded","Sora"', fontWeight: 600, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 6px -4px rgba(180,140,75,.2), 0 10px 15px -3px rgba(180,140,75,.2)' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 18, lineHeight: 1 }}>login</span>
                На страницу входа
              </button>
            </div>
          ) : (
            <>
              {/* Logo */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                <div style={{ width: 36, height: 36, borderRadius: 11, background: dark ? '#1A1412' : '#F5F5F4', border: `1px solid ${cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src="/logo-mark.svg" alt="" style={{ width: 18, height: 18, filter: 'brightness(0) saturate(100%) invert(73%) sepia(76%) saturate(657%) hue-rotate(11deg) brightness(94%) contrast(94%)' }} />
                </div>
                <span style={{ fontFamily: '"RF Dewi Expanded","Sora",system-ui', fontWeight: 700, letterSpacing: '-0.025em', fontSize: 18, color: textPrimary }}>
                  Coffee<span style={{ color: '#EAB308' }}>Peek</span>
                </span>
              </div>

              <Stepper step={step === 'email' ? 'email' : 'register'} dark={dark} />

              {step === 'email' ? (
                <>
                  <h1 style={{ margin: 0, fontFamily: '"RF Dewi Expanded","Sora"', fontWeight: 700, fontSize: 26, letterSpacing: '-0.02em', color: textPrimary }}>Введите email</h1>
                  <p style={{ margin: '8px 0 24px', fontFamily: '"Noto Sans"', fontSize: 14, color: textMuted, lineHeight: 1.5 }}>
                    Мы проверим, есть ли у вас уже аккаунт CoffeePeek.
                  </p>
                  <form onSubmit={handleEmailCheck} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <AuthField icon="mail" type="email" placeholder="name@example.com" autoFocus value={email} onChange={e => setEmail(e.target.value)} error={error || undefined} dark={dark} />
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: textMuted, fontSize: 11, fontFamily: '"Noto Sans"', margin: '2px 0' }}>
                      <div style={{ flex: 1, height: 1, background: cardBorder }} />ИЛИ<div style={{ flex: 1, height: 1, background: cardBorder }} />
                    </div>
                    <button type="button" onClick={() => navigate('/login')}
                      style={{ width: '100%', height: 48, borderRadius: 12, background: dark ? 'rgba(255,255,255,0.04)' : '#F9F8F6', color: textPrimary, border: `1px solid ${cardBorder}`, fontFamily: '"RF Dewi Expanded","Sora"', fontWeight: 600, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                      <span className="material-symbols-rounded" style={{ fontSize: 18, lineHeight: 1 }}>public</span>
                      Войти через Google
                    </button>
                    <button type="submit" disabled={!emailValid || isLoading}
                      style={{ width: '100%', height: 48, borderRadius: 12, background: gold, color: '#1A1412', border: 'none', fontFamily: '"RF Dewi Expanded","Sora"', fontWeight: 600, fontSize: 15, cursor: !emailValid || isLoading ? 'not-allowed' : 'pointer', opacity: !emailValid ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 6px -4px rgba(180,140,75,.2), 0 10px 15px -3px rgba(180,140,75,.2)' }}>
                      {isLoading ? <><span style={{ width: 14, height: 14, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: 99, display: 'inline-block', animation: 'spin 1s linear infinite' }} />Проверяем…</> : 'Продолжить'}
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 10px', borderRadius: 99, background: 'rgba(180,140,75,.18)', color: gold, fontFamily: '"Noto Sans"', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
                    <span className="material-symbols-rounded" style={{ fontSize: 14, lineHeight: 1 }}>auto_awesome</span> Новый профиль
                  </span>
                  <h1 style={{ margin: '14px 0 0', fontFamily: '"RF Dewi Expanded","Sora"', fontWeight: 700, fontSize: 26, letterSpacing: '-0.02em', color: textPrimary }}>Создайте аккаунт</h1>
                  <div style={{ margin: '8px 0 22px', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 12, background: dark ? 'rgba(255,255,255,0.03)' : '#F9F8F6', border: `1px solid ${cardBorder}` }}>
                    <span className="material-symbols-rounded" style={{ fontSize: 16, color: '#D4A84B', lineHeight: 1 }}>mail</span>
                    <span style={{ fontFamily: '"Noto Sans"', fontSize: 13, color: textPrimary, flex: 1 }}>{email}</span>
                    <button type="button" onClick={() => setStep('email')} style={{ background: 'none', border: 'none', color: gold, fontFamily: '"Noto Sans"', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Изменить</button>
                  </div>
                  <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <AuthField icon="person" placeholder="Как вас зовут?" label="Имя" autoFocus value={userName} onChange={e => setUserName(e.target.value)} dark={dark} />
                    <div>
                      <AuthField icon="lock" type={showPwd ? 'text' : 'password'} placeholder="Не менее 6 символов" label="Пароль"
                        value={password} onChange={e => setPassword(e.target.value)} trailing={PwdToggle} error={error || undefined} dark={dark} />
                      <StrengthBar password={password} dark={dark} />
                    </div>
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                      <input type="checkbox" checked={agreeToPrivacy} onChange={e => setAgreeToPrivacy(e.target.checked)} style={{ marginTop: 2, width: 18, height: 18, accentColor: gold }} />
                      <span style={{ fontFamily: '"Noto Sans"', fontSize: 12, color: textMuted, lineHeight: 1.45 }}>
                        Я принимаю <span style={{ color: gold, fontWeight: 600 }}>Условия использования</span> и даю согласие на обработку персональных данных.
                      </span>
                    </label>
                    <button type="submit" disabled={isLoading || !canRegister}
                      style={{ width: '100%', height: 48, borderRadius: 12, background: gold, color: '#1A1412', border: 'none', fontFamily: '"RF Dewi Expanded","Sora"', fontWeight: 600, fontSize: 15, cursor: isLoading || !canRegister ? 'not-allowed' : 'pointer', opacity: !canRegister ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 6px -4px rgba(180,140,75,.2), 0 10px 15px -3px rgba(180,140,75,.2)' }}>
                      {isLoading ? <><span style={{ width: 14, height: 14, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: 99, display: 'inline-block', animation: 'spin 1s linear infinite' }} />Создаём…</> : 'Создать аккаунт'}
                    </button>
                  </form>
                </>
              )}

              <div style={{ marginTop: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button type="button" onClick={() => step === 'registration' ? setStep('email') : navigate('/')}
                  style={{ background: 'none', border: 'none', color: textMuted, fontFamily: '"Noto Sans"', fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 14, lineHeight: 1 }}>arrow_back</span> Назад
                </button>
                <button type="button" onClick={() => navigate('/login')}
                  style={{ background: 'none', border: 'none', color: gold, fontFamily: '"Noto Sans"', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Уже есть аккаунт
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
};

export default RegisterPage;
