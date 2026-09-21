import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  cancelAccountDeletionRequest,
  confirmAccountDeletion,
  type AccountDeletionReason,
} from '../api/auth';
import { useUser } from '../contexts/UserContext';
import { getErrorMessage } from '../utils/errorHandler';
import { usePageTitle } from '../hooks/usePageTitle';
import LogoMark from '../components/LogoMark';
import Mascot from '../components/Mascot';

const REASONS: { value: AccountDeletionReason; label: string }[] = [
  { value: 'PrivacyConcerns', label: 'Беспокойство о конфиденциальности' },
  { value: 'NoLongerUsing', label: 'Больше не пользуюсь сервисом' },
  { value: 'DuplicateAccount', label: 'Дублирующий аккаунт' },
  { value: 'UnsatisfactoryExperience', label: 'Неудовлетворительный опыт' },
  { value: 'Other', label: 'Другое' },
];

type PageStatus = 'form' | 'deleted' | 'cancelled' | 'missing-token';

const ConfirmAccountDeletionPage: React.FC = () => {
  usePageTitle('Подтверждение удаления аккаунта');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { clearSession } = useUser();
  const token = searchParams.get('token')?.trim() ?? '';

  const [reason, setReason] = useState<AccountDeletionReason | ''>('');
  const [otherReason, setOtherReason] = useState('');
  const [status, setStatus] = useState<PageStatus>(token ? 'form' : 'missing-token');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const gold = '#EAB308';
  const cardBorder = '#3D2F28';
  const textPrimary = '#fff';
  const textMuted = '#A39E93';

  const handleConfirm = async () => {
    setError('');
    if (!token) {
      setStatus('missing-token');
      return;
    }
    if (!reason) {
      setError('Выберите причину удаления.');
      return;
    }
    if (reason === 'Other' && !otherReason.trim()) {
      setError('Опишите причину в поле «Другое».');
      return;
    }
    if (reason === 'Other' && otherReason.trim().length > 500) {
      setError('Текст причины — не больше 500 символов.');
      return;
    }

    setIsSubmitting(true);
    try {
      await confirmAccountDeletion({
        token,
        reason,
        otherReason: reason === 'Other' ? otherReason : undefined,
      });
      clearSession();
      setStatus('deleted');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    setError('');
    if (!token) {
      setStatus('missing-token');
      return;
    }

    setIsSubmitting(true);
    try {
      await cancelAccountDeletionRequest(token);
      setStatus('cancelled');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100dvh', background: '#1A1412', display: 'grid', placeItems: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(#2D241F 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.6, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: -120, left: -120, width: 480, height: 480, borderRadius: '50%', background: 'radial-gradient(circle, rgba(234,179,8,0.16), transparent 60%)', filter: 'blur(40px)', pointerEvents: 'none' }} />

      <div style={{ width: '100%', maxWidth: 480, margin: '0 auto', padding: 16, position: 'relative', zIndex: 2 }}>
        <div style={{ padding: 40, borderRadius: 24, background: 'rgba(45,36,31,0.6)', backdropFilter: 'blur(24px)', border: `1px solid ${cardBorder}`, boxShadow: '0 24px 48px -12px rgba(0,0,0,0.5)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 28 }}>
            <LogoMark size={52} variant="dark" />
            <span style={{ fontFamily: '"Manrope"', fontWeight: 700, fontSize: 18, color: textPrimary }}>
              Coffee<span style={{ color: gold }}>Peek</span>
            </span>
          </div>

          {status === 'missing-token' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }} aria-hidden>
                <Mascot pose="astonishment" size={132} />
              </div>
              <h1 style={{ margin: '0 0 10px', fontFamily: '"Manrope"', fontWeight: 700, fontSize: 24, color: textPrimary }}>
                Ссылка недействительна
              </h1>
              <p style={{ margin: '0 0 24px', fontFamily: '"Manrope"', fontSize: 14, color: textMuted, lineHeight: 1.55 }}>
                В ссылке нет токена подтверждения удаления. Запросите новую из настроек аккаунта.
              </p>
              <Link to="/login" style={{ color: gold, fontWeight: 600, textDecoration: 'none' }}>
                На страницу входа
              </Link>
            </div>
          )}

          {status === 'deleted' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }} aria-hidden>
                <Mascot pose="happy" size={132} />
              </div>
              <h1 style={{ margin: '0 0 10px', fontFamily: '"Manrope"', fontWeight: 700, fontSize: 24, color: textPrimary }}>
                Аккаунт удалён
              </h1>
              <p style={{ margin: '0 0 24px', fontFamily: '"Manrope"', fontSize: 14, color: textMuted, lineHeight: 1.55 }}>
                Данные аккаунта удалены. Локальная сессия очищена.
              </p>
              <button
                type="button"
                onClick={() => navigate('/')}
                style={{ width: '100%', height: 48, borderRadius: 12, background: gold, color: '#1A1412', border: 'none', fontFamily: '"Manrope"', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}
              >
                На главную
              </button>
            </div>
          )}

          {status === 'cancelled' && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }} aria-hidden>
                <Mascot pose="happy" size={132} />
              </div>
              <h1 style={{ margin: '0 0 10px', fontFamily: '"Manrope"', fontWeight: 700, fontSize: 24, color: textPrimary }}>
                Аккаунт сохранён
              </h1>
              <p style={{ margin: '0 0 24px', fontFamily: '"Manrope"', fontSize: 14, color: textMuted, lineHeight: 1.55 }}>
                Запрос на удаление отменён. Вы можете продолжать пользоваться CoffeePeek.
              </p>
              <button
                type="button"
                onClick={() => navigate('/login')}
                style={{ width: '100%', height: 48, borderRadius: 12, background: gold, color: '#1A1412', border: 'none', fontFamily: '"Manrope"', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}
              >
                Войти
              </button>
            </div>
          )}

          {status === 'form' && (
            <>
              <h1 style={{ margin: '0 0 8px', fontFamily: '"Manrope"', fontWeight: 700, fontSize: 24, color: textPrimary, textAlign: 'center' }}>
                Удалить аккаунт?
              </h1>
              <p style={{ margin: '0 0 24px', fontFamily: '"Manrope"', fontSize: 14, color: textMuted, lineHeight: 1.55, textAlign: 'center' }}>
                Открытие этой страницы ничего не удаляет. Подтвердите действие или отмените запрос.
              </p>

              <fieldset style={{ border: 'none', margin: 0, padding: 0 }}>
                <legend style={{ marginBottom: 12, fontFamily: '"Manrope"', fontWeight: 600, fontSize: 13, color: textPrimary }}>
                  Почему вы уходите?
                </legend>
                <div style={{ display: 'grid', gap: 8 }}>
                  {REASONS.map((item) => (
                    <label
                      key={item.value}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '12px 14px',
                        borderRadius: 12,
                        border: `1px solid ${reason === item.value ? gold : cardBorder}`,
                        background: reason === item.value ? 'rgba(234,179,8,0.08)' : 'rgba(255,255,255,0.03)',
                        cursor: 'pointer',
                        fontFamily: '"Manrope"',
                        fontSize: 14,
                        color: textPrimary,
                      }}
                    >
                      <input
                        type="radio"
                        name="deletion-reason"
                        value={item.value}
                        checked={reason === item.value}
                        onChange={() => setReason(item.value)}
                        style={{ accentColor: gold }}
                      />
                      {item.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              {reason === 'Other' && (
                <div style={{ marginTop: 14 }}>
                  <label htmlFor="other-reason" style={{ display: 'block', marginBottom: 8, fontFamily: '"Manrope"', fontSize: 12, color: textMuted }}>
                    Другое (до 500 символов)
                  </label>
                  <textarea
                    id="other-reason"
                    value={otherReason}
                    onChange={(e) => setOtherReason(e.target.value.slice(0, 500))}
                    rows={4}
                    maxLength={500}
                    placeholder="Расскажите подробнее…"
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      borderRadius: 12,
                      border: `1px solid ${cardBorder}`,
                      background: 'rgba(255,255,255,0.04)',
                      color: textPrimary,
                      padding: '12px 14px',
                      fontFamily: '"Manrope"',
                      fontSize: 14,
                      resize: 'vertical',
                    }}
                  />
                  <p style={{ margin: '6px 0 0', fontFamily: '"Manrope"', fontSize: 11, color: textMuted, textAlign: 'right' }}>
                    {otherReason.length}/500
                  </p>
                </div>
              )}

              {error && (
                <p style={{ margin: '14px 0 0', fontFamily: '"Manrope"', fontSize: 13, color: '#EF4444', lineHeight: 1.45 }}>
                  {error}
                </p>
              )}

              <div style={{ display: 'grid', gap: 10, marginTop: 24 }}>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => { void handleConfirm(); }}
                  style={{
                    width: '100%',
                    height: 48,
                    borderRadius: 12,
                    background: '#EF4444',
                    color: '#fff',
                    border: 'none',
                    fontFamily: '"Manrope"',
                    fontWeight: 600,
                    fontSize: 15,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting ? 0.7 : 1,
                  }}
                >
                  {isSubmitting ? 'Отправляем…' : 'Да, удалить'}
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => { void handleCancel(); }}
                  style={{
                    width: '100%',
                    height: 48,
                    borderRadius: 12,
                    background: 'transparent',
                    color: textPrimary,
                    border: `1px solid ${cardBorder}`,
                    fontFamily: '"Manrope"',
                    fontWeight: 600,
                    fontSize: 15,
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    opacity: isSubmitting ? 0.7 : 1,
                  }}
                >
                  Нет, сохранить
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConfirmAccountDeletionPage;
