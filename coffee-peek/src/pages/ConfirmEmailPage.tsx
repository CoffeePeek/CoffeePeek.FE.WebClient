import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { confirmEmail } from '../api/auth';
import { usePageTitle } from '../hooks/usePageTitle';

const ConfirmEmailPage: React.FC = () => {
  usePageTitle('Подтверждение email');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setStatus('error');
      return;
    }
    confirmEmail(token)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, []);

  useEffect(() => {
    if (status !== 'success') return;
    if (countdown <= 0) {
      navigate('/login');
      return;
    }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [status, countdown, navigate]);

  const gold = '#EAB308';
  const cardBorder = '#3D2F28';
  const textPrimary = '#fff';
  const textMuted = '#A39E93';

  return (
    <div style={{ minHeight: '100vh', background: '#1A1412', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(#2D241F 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.6, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: -120, left: -120, width: 480, height: 480, borderRadius: '50%', background: 'radial-gradient(circle, rgba(234,179,8,0.16), transparent 60%)', filter: 'blur(40px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -160, right: -160, width: 520, height: 520, borderRadius: '50%', background: 'radial-gradient(circle, rgba(180,140,75,0.10), transparent 60%)', filter: 'blur(40px)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 460, margin: '0 auto', padding: 16, position: 'relative', zIndex: 2 }}>
        <div style={{ padding: 40, borderRadius: 24, background: 'rgba(45,36,31,0.6)', backdropFilter: 'blur(24px)', border: `1px solid ${cardBorder}`, boxShadow: '0 24px 48px -12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)', textAlign: 'center' }}>

          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 32 }}>
            <div style={{ width: 36, height: 36, borderRadius: 11, background: '#1A1412', border: `1px solid ${cardBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="/logo-mark.svg" alt="" style={{ width: 18, height: 18, filter: 'brightness(0) saturate(100%) invert(73%) sepia(76%) saturate(657%) hue-rotate(11deg) brightness(94%) contrast(94%)' }} />
            </div>
            <span style={{ fontFamily: '"RF Dewi Expanded","Sora",system-ui', fontWeight: 700, letterSpacing: '-0.025em', fontSize: 18, color: textPrimary }}>
              Coffee<span style={{ color: gold }}>Peek</span>
            </span>
          </div>

          {status === 'loading' && (
            <>
              <div style={{ width: 72, height: 72, borderRadius: 99, background: 'rgba(234,179,8,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <span style={{ width: 32, height: 32, border: '3px solid #EAB308', borderTopColor: 'transparent', borderRadius: 99, display: 'inline-block', animation: 'spin 1s linear infinite' }} />
              </div>
              <h1 style={{ margin: '0 0 8px', fontFamily: '"RF Dewi Expanded","Sora"', fontWeight: 700, fontSize: 24, color: textPrimary }}>
                Подтверждаем email…
              </h1>
              <p style={{ margin: 0, fontFamily: '"Noto Sans"', fontSize: 14, color: textMuted }}>Пожалуйста, подождите</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div style={{ width: 88, height: 88, borderRadius: 99, background: 'rgba(34,197,94,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <span className="material-symbols-rounded star-filled" style={{ fontSize: 56, color: '#22C55E', lineHeight: 1 }}>check_circle</span>
              </div>
              <h1 style={{ margin: '0 0 10px', fontFamily: '"RF Dewi Expanded","Sora"', fontWeight: 700, fontSize: 28, color: textPrimary }}>
                Email подтверждён
              </h1>
              <p style={{ margin: '0 0 28px', fontFamily: '"Noto Sans"', fontSize: 14, color: textMuted, lineHeight: 1.55 }}>
                Ваш аккаунт активирован.<br />
                Перенаправляем через {countdown} сек…
              </p>
              <button
                onClick={() => navigate('/login')}
                style={{ width: '100%', height: 48, borderRadius: 12, background: gold, color: '#1A1412', border: 'none', fontFamily: '"RF Dewi Expanded","Sora"', fontWeight: 600, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 6px -4px rgba(180,140,75,.2), 0 10px 15px -3px rgba(180,140,75,.2)' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 18, lineHeight: 1 }}>login</span>
                Войти
              </button>
            </>
          )}

          {status === 'error' && (
            <>
              <div style={{ width: 88, height: 88, borderRadius: 99, background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <span className="material-symbols-rounded star-filled" style={{ fontSize: 56, color: '#EF4444', lineHeight: 1 }}>cancel</span>
              </div>
              <h1 style={{ margin: '0 0 10px', fontFamily: '"RF Dewi Expanded","Sora"', fontWeight: 700, fontSize: 24, color: textPrimary }}>
                Ссылка недействительна
              </h1>
              <p style={{ margin: '0 0 28px', fontFamily: '"Noto Sans"', fontSize: 14, color: textMuted, lineHeight: 1.55 }}>
                Ссылка для подтверждения устарела или уже использована.<br />
                Запросите новую в настройках аккаунта.
              </p>
              <button
                onClick={() => navigate('/login')}
                style={{ width: '100%', height: 48, borderRadius: 12, background: 'transparent', color: textPrimary, border: `1px solid ${cardBorder}`, fontFamily: '"RF Dewi Expanded","Sora"', fontWeight: 600, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <span className="material-symbols-rounded" style={{ fontSize: 18, lineHeight: 1 }}>arrow_back</span>
                На страницу входа
              </button>
            </>
          )}
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  );
};

export default ConfirmEmailPage;
