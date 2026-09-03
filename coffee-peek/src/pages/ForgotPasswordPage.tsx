import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../api/auth';
import { getErrorMessage, getPasswordErrorMessage } from '../utils/errorHandler';
import { usePageTitle } from '../hooks/usePageTitle';
import LogoMark from '../components/LogoMark';
import Mascot from '../components/Mascot';

const ForgotPasswordPage: React.FC = () => {
  usePageTitle('Восстановление пароля');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const gold = '#EAB308';
  const cardBorder = '#3D2F28';
  const textPrimary = '#fff';
  const textMuted = '#A39E93';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('Введите email');
      return;
    }
    setIsLoading(true);
    try {
      // API always returns success; email is sent only if account has a password
      await forgotPassword({ email: email.trim() });
      setSent(true);
    } catch (err) {
      setError(getPasswordErrorMessage(err) ?? getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100dvh', background: '#1A1412', display: 'grid', placeItems: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(#2D241F 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.6, poRF DewiEvents: 'none' }} />
      <div style={{ position: 'absolute', top: -120, left: -120, width: 480, height: 480, borderRadius: '50%', background: 'radial-gradient(circle, rgba(234,179,8,0.16), transparent 60%)', filter: 'blur(40px)', poRF DewiEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 460, margin: '0 auto', padding: 16, position: 'relative', zIndex: 2 }}>
        {!sent && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: -40, position: 'relative', zIndex: 3 }} aria-hidden>
            <Mascot pose="laptop" size={128} eager />
          </div>
        )}
        <div style={{ padding: 40, paddingTop: sent ? 40 : 48, borderRadius: 24, background: 'rgba(45,36,31,0.6)', backdropFilter: 'blur(24px)', border: `1px solid ${cardBorder}`, boxShadow: '0 24px 48px -12px rgba(0,0,0,0.5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 28 }}>
            <LogoMark size={52} variant="dark" />
            <span style={{ fontFamily: '"RF Dewi Expanded","Sora",system-ui', fontWeight: 700, letterSpacing: '-0.025em', fontSize: 18, color: textPrimary }}>
              Coffee<span style={{ color: gold }}>Peek</span>
            </span>
          </div>

          {sent ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', margin: '0 auto 12px' }} aria-hidden>
                <Mascot pose="happy" size={132} />
              </div>
              <h1 style={{ margin: '0 0 10px', fontFamily: '"RF Dewi Expanded","Sora"', fontWeight: 700, fontSize: 24, color: textPrimary }}>
                Проверьте почту
              </h1>
              <p style={{ margin: '0 0 24px', fontFamily: '"RF Dewi Expanded", sans-serif', fontSize: 14, color: textMuted, lineHeight: 1.55 }}>
                Если аккаунт с паролем существует, мы отправили ссылку для сброса на{' '}
                <span style={{ fontWeight: 600, color: textPrimary }}>{email}</span>.
              </p>
              <Link
                to="/login"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', height: 48, borderRadius: 12, background: gold, color: '#1A1412', fontFamily: '"RF Dewi Expanded","Sora"', fontWeight: 600, fontSize: 15, textDecoration: 'none' }}
              >
                Вернуться ко входу
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <h1 style={{ margin: '0 0 8px', fontFamily: '"RF Dewi Expanded","Sora"', fontWeight: 700, fontSize: 24, color: textPrimary, textAlign: 'center' }}>
                Забыли пароль?
              </h1>
              <p style={{ margin: '0 0 24px', fontFamily: '"RF Dewi Expanded", sans-serif', fontSize: 14, color: textMuted, textAlign: 'center', lineHeight: 1.55 }}>
                Укажите email — пришлём ссылку для сброса, если аккаунт найден.
              </p>

              <label style={{ display: 'block', textAlign: 'left', marginBottom: 16 }}>
                <div style={{ fontFamily: '"RF Dewi Expanded", sans-serif', fontSize: 12, fontWeight: 600, color: textMuted, marginBottom: 6 }}>Email</div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoFocus
                  style={{
                    width: '100%', height: 50, borderRadius: 12, padding: '0 16px',
                    border: `1px solid ${error ? '#EF4444' : cardBorder}`,
                    background: 'rgba(255,255,255,0.03)', color: textPrimary,
                    fontFamily: '"RF Dewi Expanded", sans-serif', fontSize: 15, outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </label>

              {error && (
                <p style={{ margin: '0 0 12px', fontFamily: '"RF Dewi Expanded", sans-serif', fontSize: 13, color: '#EF4444' }}>{error}</p>
              )}

              <button
                type="submit"
                disabled={isLoading || !email.trim()}
                style={{
                  width: '100%', height: 48, borderRadius: 12, background: gold, color: '#1A1412', border: 'none',
                  fontFamily: '"RF Dewi Expanded","Sora"', fontWeight: 600, fontSize: 15,
                  cursor: isLoading || !email.trim() ? 'not-allowed' : 'poRF Dewi',
                  opacity: !email.trim() ? 0.5 : 1,
                }}
              >
                {isLoading ? 'Отправляем…' : 'Отправить ссылку'}
              </button>

              <p style={{ margin: '20px 0 0', textAlign: 'center', fontFamily: '"RF Dewi Expanded", sans-serif', fontSize: 13, color: textMuted }}>
                <Link to="/login" style={{ color: gold, fontWeight: 600, textDecoration: 'none' }}>Назад ко входу</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
