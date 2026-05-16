import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { login } from '../api/auth';
import { parseJWT, isTokenExpired, getUserRoles } from '../utils/jwt';
import { useUser } from '../contexts/UserContext';
import { getErrorMessage } from '../utils/errorHandler';
import { usePageTitle } from '../hooks/usePageTitle';

interface AuthFieldProps {
  icon?: string;
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label?: string;
  trailing?: React.ReactNode;
  autoFocus?: boolean;
  error?: string;
  dark: boolean;
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
        <input
          type={type} placeholder={placeholder} value={value} onChange={onChange} autoFocus={autoFocus}
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
          }}
        />
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

const Stepper: React.FC<{ dark: boolean }> = ({ dark }) => {
  const steps = ['Email', 'Вход', 'Готово'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginBottom: 20 }}>
      {steps.map((s, i) => (
        <React.Fragment key={s}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 99,
            background: i <= 1 ? 'rgba(234,179,8,0.12)' : dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
            color: i <= 1 ? '#EAB308' : dark ? '#A39E93' : '#78716C',
            fontFamily: '"Noto Sans"', fontSize: 11, fontWeight: 600,
          }}>
            <span style={{ width: 16, height: 16, borderRadius: 99, background: i <= 1 ? '#EAB308' : 'transparent', border: i <= 1 ? 'none' : `1px solid ${dark ? '#3D2F28' : '#E7E5E4'}`, color: '#1A1412', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700 }}>
              {i < 1 ? '✓' : i + 1}
            </span>
            {s}
          </span>
          {i < steps.length - 1 && <span style={{ width: 16, height: 1, background: dark ? '#3D2F28' : '#E7E5E4' }} />}
        </React.Fragment>
      ))}
    </div>
  );
};

const LoginPage: React.FC = () => {
  usePageTitle('Вход');
  const navigate = useNavigate();
  const location = useLocation();
  const { updateUserFromToken } = useUser();
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/shops';
  const passedEmail = (location.state as { email?: string } | null)?.email || '';

  const [email, setEmail] = useState(passedEmail);
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dark, setDark] = useState(true);
  const [emailValidDebounced, setEmailValidDebounced] = useState(false);

  // Дебаунс валидации email — обновляем индикатор через 400ms после последнего ввода
  useEffect(() => {
    const t = setTimeout(() => {
      setEmailValidDebounced(/\S+@\S+\.\S+/.test(email.trim()));
    }, 400);
    return () => clearTimeout(t);
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email.trim()) { setError('Введите email'); return; }
    if (!password) { setError('Введите пароль'); return; }
    setIsLoading(true);
    try {
      const response = await login({ email, password });
      if (!response.data?.accessToken) throw new Error('Токен не получен от сервера');
      const { accessToken, refreshToken } = response.data;
      if (isTokenExpired(accessToken)) throw new Error('Токен истёк');
      parseJWT(accessToken);
      getUserRoles(accessToken);
      localStorage.setItem('accessToken', accessToken);
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
      updateUserFromToken(accessToken);
      navigate(from, { replace: true });
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'login'));
    } finally {
      setIsLoading(false);
    }
  };

  const bg = dark ? '#1A1412' : '#FFFCF7';
  const cardBg = dark ? 'rgba(45,36,31,0.6)' : '#fff';
  const cardBorder = dark ? '#3D2F28' : '#E7E5E4';
  const textPrimary = dark ? '#fff' : '#1C1917';
  const textMuted = dark ? '#A39E93' : '#78716C';
  const gold = dark ? '#EAB308' : '#D4A84B';

  const PwdToggle = (
    <button type="button" onClick={() => setShowPwd(s => !s)} aria-label={showPwd ? 'Скрыть пароль' : 'Показать пароль'}
      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
      <span className="material-symbols-rounded" style={{ fontSize: 20, color: textMuted, lineHeight: 1 }}>
        {showPwd ? 'visibility_off' : 'visibility'}
      </span>
    </button>
  );

  return (
    <div style={{ minHeight: '100vh', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', transition: 'background .3s' }}>
      {/* Dotted pattern (dark only) */}
      {dark && <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(#2D241F 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.6, pointerEvents: 'none' }} />}
      {/* Gold glows */}
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

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <div style={{ width: 36, height: 36, borderRadius: 11, background: dark ? '#1A1412' : '#F5F5F4', border: `1px solid ${cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="/logo-mark.svg" alt="" style={{ width: 18, height: 18, filter: 'brightness(0) saturate(100%) invert(73%) sepia(76%) saturate(657%) hue-rotate(11deg) brightness(94%) contrast(94%)' }} />
            </div>
            <span style={{ fontFamily: '"RF Dewi Expanded","Sora",system-ui', fontWeight: 700, letterSpacing: '-0.025em', fontSize: 18, color: textPrimary }}>
              Coffee<span style={{ color: '#EAB308' }}>Peek</span>
            </span>
          </div>

          {passedEmail && <Stepper dark={dark} />}

          {passedEmail && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '4px 10px', borderRadius: 99, background: 'rgba(34,197,94,.14)', color: dark ? '#22C55E' : '#15803D', fontFamily: '"Noto Sans"', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' as const }}>
              <span className="material-symbols-rounded star-filled" style={{ fontSize: 14, lineHeight: 1 }}>check_circle</span>
              Аккаунт найден
            </span>
          )}

          <h1 style={{ margin: passedEmail ? '14px 0 0' : '0 0 4px', fontFamily: '"RF Dewi Expanded","Sora",system-ui', fontWeight: 700, fontSize: 26, letterSpacing: '-0.02em', color: textPrimary }}>
            {passedEmail ? 'С возвращением!' : 'Вход в аккаунт'}
          </h1>

          {!passedEmail && (
            <p style={{ margin: '0 0 20px', fontFamily: '"Noto Sans"', fontSize: 14, color: textMuted, lineHeight: 1.5 }}>
              Войдите в свой аккаунт CoffeePeek.
            </p>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: passedEmail ? 20 : 0 }}>
            <AuthField
              icon="mail"
              type="email"
              placeholder="name@example.com"
              label="Email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(null); }}
              dark={dark}
              trailing={emailValidDebounced ? (
                <span className="material-symbols-rounded star-filled"
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: '#22C55E', lineHeight: 1, pointerEvents: 'none' }}>
                  check_circle
                </span>
              ) : undefined}
            />

            <AuthField icon="lock" type={showPwd ? 'text' : 'password'} placeholder="Пароль" label="Пароль"
              value={password} onChange={e => setPassword(e.target.value)} trailing={PwdToggle} error={error || undefined} dark={dark} />

            <div style={{ textAlign: 'right', marginTop: -6 }}>
              <a style={{ fontFamily: '"Noto Sans"', fontSize: 13, color: gold, fontWeight: 600, cursor: 'pointer' }}>Забыли пароль?</a>
            </div>

            <button type="submit" disabled={isLoading || !password}
              style={{ width: '100%', height: 48, borderRadius: 12, background: gold, color: '#1A1412', border: 'none', fontFamily: '"RF Dewi Expanded","Sora"', fontWeight: 600, fontSize: 15, cursor: isLoading || !password ? 'not-allowed' : 'pointer', opacity: !password ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 6px -4px rgba(180,140,75,.2), 0 10px 15px -3px rgba(180,140,75,.2)', transition: 'opacity .2s' }}>
              {isLoading ? (
                <><span style={{ width: 14, height: 14, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: 99, display: 'inline-block', animation: 'spin 1s linear infinite' }} />Входим…</>
              ) : 'Войти'}
            </button>
          </form>

          <div style={{ marginTop: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button type="button" onClick={() => navigate(passedEmail ? '/register' : '/')}
              style={{ background: 'none', border: 'none', color: textMuted, fontFamily: '"Noto Sans"', fontSize: 13, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 14, lineHeight: 1 }}>arrow_back</span> Назад
            </button>
            <button type="button" onClick={() => navigate('/register')}
              style={{ background: 'none', border: 'none', color: gold, fontFamily: '"Noto Sans"', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              Создать аккаунт
            </button>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
};

export default LoginPage;
