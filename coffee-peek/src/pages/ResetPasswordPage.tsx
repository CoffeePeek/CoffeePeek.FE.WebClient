import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../api/auth';
import { TokenManager } from '../api/core/httpClient';
import { getErrorMessage, getPasswordErrorMessage } from '../utils/errorHandler';
import { usePageTitle } from '../hooks/usePageTitle';
import { AppIcon } from '../components/icons';
import LogoMark from '../components/LogoMark';
import Mascot from '../components/Mascot';

const ResetPasswordPage: React.FC = () => {
  usePageTitle('Новый пароль');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const gold = '#EAB308';
  const cardBorder = '#3D2F28';
  const textPrimary = '#fff';
  const textMuted = '#A39E93';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!token) {
      setError('Ссылка недействительна: отсутствует токен.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Пароль должен содержать минимум 8 символов');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    setIsLoading(true);
    try {
      await resetPassword({ token, newPassword });
      // After reset all sessions are cleared — force re-login
      TokenManager.clearTokens();
      setDone(true);
    } catch (err) {
      setError(getPasswordErrorMessage(err) ?? getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) {
    return (
      <div style={{ minHeight: '100dvh', background: '#1A1412', display: 'grid', placeItems: 'center', padding: 16 }}>
        <div style={{ maxWidth: 460, width: '100%', padding: 40, borderRadius: 24, background: 'rgba(45,36,31,0.6)', border: `1px solid ${cardBorder}`, textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }} aria-hidden>
            <Mascot pose="astonishment" size={140} />
          </div>
          <h1 style={{ margin: '0 0 10px', fontFamily: '"RF Dewi Expanded","Sora"', fontWeight: 700, fontSize: 24, color: textPrimary }}>Ссылка недействительна</h1>
          <p style={{ margin: '0 0 24px', fontFamily: '"Noto Sans"', fontSize: 14, color: textMuted }}>В ссылке нет токена сброса пароля.</p>
          <Link to="/forgot-password" style={{ color: gold, fontWeight: 600, textDecoration: 'none' }}>Запросить новую ссылку</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100dvh', background: '#1A1412', display: 'grid', placeItems: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(#2D241F 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.6, pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 460, margin: '0 auto', padding: 16, position: 'relative', zIndex: 2 }}>
        {!done && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: -40, position: 'relative', zIndex: 3 }} aria-hidden>
            <Mascot pose="laptop" size={128} eager />
          </div>
        )}
        <div style={{ padding: 40, paddingTop: done ? 40 : 48, borderRadius: 24, background: 'rgba(45,36,31,0.6)', backdropFilter: 'blur(24px)', border: `1px solid ${cardBorder}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 28 }}>
            <LogoMark size={36} />
            <span style={{ fontFamily: '"RF Dewi Expanded","Sora"', fontWeight: 700, fontSize: 18, color: textPrimary }}>
              Coffee<span style={{ color: gold }}>Peek</span>
            </span>
          </div>

          {done ? (
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', margin: '0 auto 12px' }} aria-hidden>
                <Mascot pose="happy" size={132} />
              </div>
              <h1 style={{ margin: '0 0 10px', fontFamily: '"RF Dewi Expanded","Sora"', fontWeight: 700, fontSize: 24, color: textPrimary }}>Пароль обновлён</h1>
              <p style={{ margin: '0 0 24px', fontFamily: '"Noto Sans"', fontSize: 14, color: textMuted, lineHeight: 1.55 }}>
                Все сессии сброшены. Войдите с новым паролем.
              </p>
              <button
                type="button"
                onClick={() => navigate('/login')}
                style={{ width: '100%', height: 48, borderRadius: 12, background: gold, color: '#1A1412', border: 'none', fontFamily: '"RF Dewi Expanded","Sora"', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}
              >
                Войти
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <h1 style={{ margin: '0 0 8px', fontFamily: '"RF Dewi Expanded","Sora"', fontWeight: 700, fontSize: 24, color: textPrimary, textAlign: 'center' }}>
                Новый пароль
              </h1>
              <p style={{ margin: '0 0 24px', fontFamily: '"Noto Sans"', fontSize: 14, color: textMuted, textAlign: 'center' }}>
                Придумайте новый пароль для входа
              </p>

              <label style={{ display: 'block', marginBottom: 14 }}>
                <div style={{ fontFamily: '"Noto Sans"', fontSize: 12, fontWeight: 600, color: textMuted, marginBottom: 6 }}>Новый пароль</div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Не менее 8 символов"
                    autoFocus
                    style={{
                      width: '100%', height: 50, borderRadius: 12, padding: '0 48px 0 16px',
                      border: `1px solid ${cardBorder}`, background: 'rgba(255,255,255,0.03)', color: textPrimary,
                      fontFamily: '"Noto Sans"', fontSize: 15, outline: 'none', boxSizing: 'border-box',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: textMuted }}
                    aria-label={showPwd ? 'Скрыть' : 'Показать'}
                  >
                    <AppIcon name={showPwd ? 'visibility_off' : 'visibility'} size={20} color="currentColor" />
                  </button>
                </div>
              </label>

              <label style={{ display: 'block', marginBottom: 16 }}>
                <div style={{ fontFamily: '"Noto Sans"', fontSize: 12, fontWeight: 600, color: textMuted, marginBottom: 6 }}>Повторите пароль</div>
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ещё раз"
                  style={{
                    width: '100%', height: 50, borderRadius: 12, padding: '0 16px',
                    border: `1px solid ${cardBorder}`, background: 'rgba(255,255,255,0.03)', color: textPrimary,
                    fontFamily: '"Noto Sans"', fontSize: 15, outline: 'none', boxSizing: 'border-box',
                  }}
                />
              </label>

              {error && (
                <p style={{ margin: '0 0 12px', fontFamily: '"Noto Sans"', fontSize: 13, color: '#EF4444' }}>{error}</p>
              )}

              <button
                type="submit"
                disabled={isLoading || newPassword.length < 8}
                style={{
                  width: '100%', height: 48, borderRadius: 12, background: gold, color: '#1A1412', border: 'none',
                  fontFamily: '"RF Dewi Expanded","Sora"', fontWeight: 600, fontSize: 15,
                  cursor: isLoading || newPassword.length < 8 ? 'not-allowed' : 'pointer',
                  opacity: newPassword.length < 8 ? 0.5 : 1,
                }}
              >
                {isLoading ? 'Сохраняем…' : 'Сохранить пароль'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
