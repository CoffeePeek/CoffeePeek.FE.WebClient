import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import {
  getProfile, UserProfile,
  updateUsername, updateEmail, updateAbout, updateAvatar, resendEmailConfirmation,
} from '../api/auth';
import { getAvatarUploadUrl } from '../api/photos';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS } from '../constants/colors';
import { getErrorMessage } from '../utils/errorHandler';
import { TokenManager } from '../api/core/httpClient';
import { logger } from '../utils/logger';
import { usePageTitle } from '../hooks/usePageTitle';
import WobbleRing from '../components/WobbleRing';

// ── Section types ────────────────────────────────────────────────────
type Section = 'profile' | 'security' | 'appearance' | 'cafes';

const NAV_ITEMS: { id: Section; label: string; icon: string }[] = [
  { id: 'profile',    label: 'Профиль',      icon: 'person'     },
  { id: 'security',   label: 'Безопасность', icon: 'lock'       },
  { id: 'appearance', label: 'Внешний вид',  icon: 'palette'    },
  { id: 'cafes',      label: 'Кофейни',      icon: 'local_cafe' },
];

// ── Main component ───────────────────────────────────────────────────
const SettingsPage: React.FC = () => {
  usePageTitle('Настройки');
  const { user, isLoading: userLoading, logout } = useUser();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  const [activeSection, setActiveSection] = useState<Section>('profile');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [originalValues, setOriginalValues] = useState<Record<string, string>>({});
  const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [pendingEmailConfirmation, setPendingEmailConfirmation] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  // Colors
  const gold = COLORS.primary;
  const goldWarm = '#D4A84B';
  const bg = isDark ? '#1A1412' : '#F5F4F2';
  const surface = isDark ? '#2D241F' : '#fff';
  const border = isDark ? '#3D2F28' : '#E7E5E4';
  const textPrimary = isDark ? '#fff' : '#1C1917';
  const textMuted = isDark ? '#A39E93' : '#78716C';

  // ── Data loading ──────────────────────────────────────────────────
  const loadProfile = useCallback(async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const token = TokenManager.getAccessToken();
      if (!token) throw new Error('Токен доступа отсутствует');
      const response = await getProfile();
      setProfile(response.data);
      setError(null);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      logger.error('Error loading profile:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  // ── Edit handlers ─────────────────────────────────────────────────
  const handleEditStart = useCallback(() => {
    if (!profile) return;
    const original = { userName: profile.userName || '', email: profile.email || '', about: profile.about || '' };
    setOriginalValues(original);
    setEditValues(original);
    setSelectedAvatarFile(null);
    setAvatarPreview(null);
    setIsEditing(true);
    setError(null);
    setSaveSuccess(false);
    setPendingEmailConfirmation(null);
  }, [profile]);

  const handleEditCancel = useCallback(() => {
    setEditValues({});
    setOriginalValues({});
    setSelectedAvatarFile(null);
    setAvatarPreview(null);
    setIsEditing(false);
    setError(null);
  }, []);

  const handleAvatarSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Выберите изображение'); return; }
    if (file.size > 5 * 1024 * 1024) { setError('Размер файла не должен превышать 5MB'); return; }
    setSelectedAvatarFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleSave = useCallback(async () => {
    if (!profile) return;
    const userName = editValues.userName?.trim() || '';
    const email = editValues.email?.trim() || '';
    if (!userName) { setError('Имя пользователя не может быть пустым'); return; }
    if (!email) { setError('Email не может быть пустым'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Введите корректный email'); return; }

    try {
      setIsSaving(true);
      setError(null);
      const updates: Promise<unknown>[] = [];
      const emailChanged = editValues.email !== originalValues.email;
      if (editValues.userName !== originalValues.userName) updates.push(updateUsername({ username: editValues.userName }));
      if (emailChanged) updates.push(updateEmail({ email: editValues.email }));
      if (editValues.about !== originalValues.about) updates.push(updateAbout({ about: editValues.about || '' }));

      if (selectedAvatarFile) {
        const uploadUrlResponse = await getAvatarUploadUrl({ fileName: selectedAvatarFile.name, contentType: selectedAvatarFile.type, sizeBytes: selectedAvatarFile.size });
        if (!uploadUrlResponse.success || !uploadUrlResponse.data) throw new Error('Ошибка при получении URL для загрузки аватара');
        const { uploadUrl, storageKey } = uploadUrlResponse.data;
        const uploadRes = await fetch(uploadUrl, { method: 'PUT', body: selectedAvatarFile, headers: { 'Content-Type': selectedAvatarFile.type } });
        if (!uploadRes.ok) throw new Error('Ошибка загрузки аватара');
        updates.push(updateAvatar({ uploadedPhoto: { fileName: selectedAvatarFile.name, contentType: selectedAvatarFile.type, storageKey, size: selectedAvatarFile.size } }));
      }

      if (updates.length > 0) {
        await Promise.all(updates);
        const refreshed = await getProfile();
        setProfile(refreshed.data);
      }
      if (emailChanged) {
        setPendingEmailConfirmation(editValues.email);
      }
      setIsEditing(false);
      setEditValues({});
      setOriginalValues({});
      setSelectedAvatarFile(null);
      setAvatarPreview(null);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      logger.error('Error updating profile:', err);
    } finally {
      setIsSaving(false);
    }
  }, [profile, editValues, originalValues, selectedAvatarFile]);

  const handleResendConfirmation = useCallback(async () => {
    setIsResending(true);
    setResendSuccess(false);
    try {
      await resendEmailConfirmation();
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 4000);
    } catch (err: unknown) {
      logger.error('Error resending confirmation:', err);
    } finally {
      setIsResending(false);
    }
  }, []);

  // ── Loading state ─────────────────────────────────────────────────
  if (userLoading || isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg }}>
        <WobbleRing size={48} />
      </div>
    );
  }

  const displayAvatar = avatarPreview || profile?.avatarUrl;
  const displayName = profile?.userName || user?.email?.split('@')[0] || 'Пользователь';

  // ── Section content renderer ──────────────────────────────────────
  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return profile ? (
          <ProfileSection
            profile={profile}
            isEditing={isEditing}
            editValues={editValues}
            isSaving={isSaving}
            selectedAvatarFile={selectedAvatarFile}
            avatarPreview={avatarPreview}
            isDark={isDark}
            surface={surface}
            border={border}
            textPrimary={textPrimary}
            textMuted={textMuted}
            gold={gold}
            goldWarm={goldWarm}
            onEditStart={handleEditStart}
            onEditCancel={handleEditCancel}
            onSave={handleSave}
            onInputChange={(field, value) => setEditValues(prev => ({ ...prev, [field]: value }))}
            onAvatarSelect={handleAvatarSelect}
          />
        ) : null;
      case 'security':
        return <SecuritySection isDark={isDark} surface={surface} border={border} textPrimary={textPrimary} textMuted={textMuted} />;
      case 'appearance':
        return <AppearanceSection isDark={isDark} surface={surface} border={border} textPrimary={textPrimary} textMuted={textMuted} gold={gold} theme={theme} onToggleTheme={toggleTheme} />;
      case 'cafes':
        return <CafesSection isDark={isDark} surface={surface} border={border} textPrimary={textPrimary} textMuted={textMuted} gold={gold} onAdd={() => navigate('/coffee-shops/new')} onBrowse={() => navigate('/shops')} />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: bg }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

      {/* ── Page title bar ──────────────────────────────────────── */}
      <div style={{ borderBottom: `1px solid ${border}`, background: isDark ? 'rgba(45,36,31,0.7)' : surface, backdropFilter: 'blur(12px)' }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8" style={{ height: 56, display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 style={{ margin: 0, fontFamily: '"RF Dewi Expanded","Sora"', fontWeight: 700, fontSize: 18, color: textPrimary, letterSpacing: '-0.01em' }}>Настройки</h1>
          {saveSuccess && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 99, background: 'rgba(34,197,94,.14)', color: '#15803D', fontFamily: '"Noto Sans"', fontSize: 12, fontWeight: 700 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 14, lineHeight: 1 }}>check_circle</span>
              Сохранено
            </span>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Error banner */}
        {error && (
          <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 12, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <p style={{ margin: 0, fontFamily: '"Noto Sans"', fontSize: 14, color: '#EF4444' }}>{error}</p>
          </div>
        )}

        {/* Pending email confirmation banner */}
        {pendingEmailConfirmation && !isEditing && (
          <div style={{ marginBottom: 16, padding: '14px 16px', borderRadius: 12, background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.28)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#EAB308', lineHeight: 1, flexShrink: 0, marginTop: 2 }}>mail</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: '0 0 10px', fontFamily: '"Noto Sans"', fontSize: 13, color: '#EAB308', lineHeight: 1.6 }}>
                Письмо отправлено на{' '}
                <strong>{pendingEmailConfirmation}</strong>.<br />
                Старый email активен до подтверждения.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <button
                  onClick={handleResendConfirmation}
                  disabled={isResending}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(234,179,8,0.4)', background: 'rgba(234,179,8,0.12)', color: '#EAB308', fontFamily: '"Noto Sans"', fontWeight: 600, fontSize: 12, cursor: isResending ? 'not-allowed' : 'pointer', opacity: isResending ? 0.6 : 1 }}>
                  {isResending
                    ? <><span style={{ width: 12, height: 12, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: 99, display: 'inline-block', animation: 'spin 1s linear infinite' }} />Отправляем…</>
                    : <><span className="material-symbols-rounded" style={{ fontSize: 14, lineHeight: 1 }}>refresh</span>Отправить повторно</>
                  }
                </button>
                {resendSuccess && (
                  <span style={{ fontFamily: '"Noto Sans"', fontSize: 12, color: '#22C55E', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <span className="material-symbols-rounded" style={{ fontSize: 14, lineHeight: 1 }}>check_circle</span>
                    Письмо отправлено
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => setPendingEmailConfirmation(null)}
              style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: '#A39E93', flexShrink: 0 }}>
              <span className="material-symbols-rounded" style={{ fontSize: 18, lineHeight: 1 }}>close</span>
            </button>
          </div>
        )}

        {/* ── Mobile: horizontal tabs ──────────────────────────── */}
        <div className="lg:hidden overflow-x-auto no-scrollbar" style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', gap: 8, minWidth: 'max-content' }}>
            {NAV_ITEMS.map(item => {
              const active = activeSection === item.id;
              return (
                <button key={item.id} onClick={() => setActiveSection(item.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 99, border: '1px solid',
                  background: active ? `${gold}14` : 'transparent',
                  color: active ? gold : textMuted,
                  borderColor: active ? `${gold}50` : border,
                  fontFamily: '"Noto Sans"', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 15, lineHeight: 1 }}>{item.icon}</span>
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Layout ──────────────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row lg:items-start gap-5 lg:gap-6">

          {/* Sidebar (desktop only) */}
          <aside className="hidden lg:block" style={{ width: 220, flexShrink: 0 }}>

            {/* Profile mini card */}
            <div style={{ padding: '14px', borderRadius: 16, border: `1px solid ${border}`, background: surface, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 42, height: 42, borderRadius: 99, flexShrink: 0, overflow: 'hidden', background: displayAvatar ? 'transparent' : `${gold}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {displayAvatar
                  ? <img src={displayAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontFamily: '"RF Dewi Expanded","Sora"', fontWeight: 800, fontSize: 17, color: goldWarm }}>{displayName[0]?.toUpperCase()}</span>
                }
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ margin: 0, fontFamily: '"RF Dewi Expanded","Sora"', fontWeight: 700, fontSize: 13, color: textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</p>
                {profile?.createdAtUtc && (
                  <p style={{ margin: 0, fontFamily: '"Noto Sans"', fontSize: 11, color: textMuted }}>с {new Date(profile.createdAtUtc).getFullYear()}</p>
                )}
              </div>
            </div>

            {/* Nav */}
            <nav style={{ borderRadius: 16, border: `1px solid ${border}`, background: surface, overflow: 'hidden', marginBottom: 12 }}>
              {NAV_ITEMS.map((item, i) => {
                const active = activeSection === item.id;
                return (
                  <button key={item.id} onClick={() => setActiveSection(item.id)} style={{
                    width: '100%', padding: '11px 14px', textAlign: 'left', border: 'none',
                    borderBottom: i < NAV_ITEMS.length - 1 ? `1px solid ${border}` : 'none',
                    background: active ? `${gold}10` : 'transparent',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, transition: 'background .15s',
                  }}>
                    <span className="material-symbols-rounded" style={{ fontSize: 18, color: active ? gold : textMuted, lineHeight: 1 }}>{item.icon}</span>
                    <span style={{ fontFamily: '"Noto Sans"', fontWeight: 600, fontSize: 14, color: active ? gold : textPrimary, flex: 1 }}>{item.label}</span>
                    {active && <span className="material-symbols-rounded" style={{ fontSize: 16, color: gold, lineHeight: 1 }}>chevron_right</span>}
                  </button>
                );
              })}
            </nav>

            {/* Logout */}
            <button onClick={() => { logout(); navigate('/'); }}
              style={{ width: '100%', padding: '11px 14px', textAlign: 'left', background: surface, border: `1px solid ${border}`, borderRadius: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, transition: 'background .15s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.06)')}
              onMouseLeave={e => (e.currentTarget.style.background = surface)}>
              <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#EF4444', lineHeight: 1 }}>logout</span>
              <span style={{ fontFamily: '"Noto Sans"', fontWeight: 600, fontSize: 14, color: '#EF4444' }}>Выйти</span>
            </button>
          </aside>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Profile section ──────────────────────────────────────────────────

interface ProfileSectionProps {
  profile: UserProfile;
  isEditing: boolean;
  editValues: Record<string, string>;
  isSaving: boolean;
  selectedAvatarFile: File | null;
  avatarPreview: string | null;
  isDark: boolean;
  surface: string;
  border: string;
  textPrimary: string;
  textMuted: string;
  gold: string;
  goldWarm: string;
  onEditStart: () => void;
  onEditCancel: () => void;
  onSave: () => void;
  onInputChange: (field: string, value: string) => void;
  onAvatarSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({
  profile, isEditing, editValues, isSaving, selectedAvatarFile, avatarPreview,
  isDark, surface, border, textPrimary, textMuted, gold, goldWarm,
  onEditStart, onEditCancel, onSave, onInputChange, onAvatarSelect,
}) => {
  const displayAvatar = avatarPreview || profile.avatarUrl;
  const memberSince = profile.createdAtUtc ? new Date(profile.createdAtUtc).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : '';

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 40, borderRadius: 10, border: `1px solid ${border}`,
    background: isDark ? 'rgba(255,255,255,0.05)' : '#F9F8F7',
    color: textPrimary, fontFamily: '"Noto Sans"', fontSize: 14,
    padding: '0 14px', outline: 'none', boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontFamily: '"Noto Sans"', fontSize: 11, fontWeight: 700,
    color: textMuted, letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: 6,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Avatar + name card */}
      <div style={{ padding: '24px', borderRadius: 20, border: `1px solid ${border}`, background: surface }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>

          {/* Avatar */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ width: 88, height: 88, borderRadius: 99, border: `3px solid ${isDark ? '#3D2F28' : '#E7E5E4'}`, overflow: 'hidden', background: displayAvatar ? 'transparent' : `${gold}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {displayAvatar
                ? <img src={displayAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontFamily: '"RF Dewi Expanded","Sora"', fontWeight: 800, fontSize: 32, color: goldWarm }}>{profile.userName?.[0]?.toUpperCase() ?? 'U'}</span>
              }
            </div>
            {isEditing && (
              <label style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 99, background: gold, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: `2px solid ${surface}` }}>
                <input type="file" accept="image/*" onChange={onAvatarSelect} disabled={isSaving} style={{ display: 'none' }} />
                <span className="material-symbols-rounded" style={{ fontSize: 14, color: '#1A1412', lineHeight: 1 }}>photo_camera</span>
              </label>
            )}
          </div>

          {/* Name + badge */}
          <div style={{ flex: 1, minWidth: 160 }}>
            <h2 style={{ margin: 0, fontFamily: '"RF Dewi Expanded","Sora"', fontWeight: 700, fontSize: 22, color: textPrimary, letterSpacing: '-0.01em' }}>{profile.userName}</h2>
            <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 99, background: `${gold}15`, border: `1px solid ${gold}30` }}>
                <span className="material-symbols-rounded" style={{ fontSize: 13, color: goldWarm, lineHeight: 1 }}>local_cafe</span>
                <span style={{ fontFamily: '"Noto Sans"', fontWeight: 700, fontSize: 11, color: goldWarm, letterSpacing: '.05em', textTransform: 'uppercase' }}>Ценитель кофе</span>
              </span>
              {memberSince && (
                <span style={{ fontFamily: '"Noto Sans"', fontSize: 12, color: textMuted }}>С {memberSince}</span>
              )}
            </div>
          </div>

          {/* Edit / Save buttons */}
          <div style={{ flexShrink: 0, display: 'flex', gap: 8 }}>
            {!isEditing ? (
              <button onClick={onEditStart} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: `1px solid ${border}`, background: 'transparent', color: textPrimary, fontFamily: '"Noto Sans"', fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all .15s' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 16, lineHeight: 1 }}>edit</span>
                Изменить
              </button>
            ) : (
              <>
                <button onClick={onEditCancel} disabled={isSaving} style={{ padding: '8px 14px', borderRadius: 10, border: `1px solid ${border}`, background: 'transparent', color: textPrimary, fontFamily: '"Noto Sans"', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                  Отмена
                </button>
                <button onClick={onSave} disabled={isSaving} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 10, border: 'none', background: gold, color: '#1A1412', fontFamily: '"RF Dewi Expanded","Sora"', fontWeight: 700, fontSize: 13, cursor: isSaving ? 'not-allowed' : 'pointer', opacity: isSaving ? 0.7 : 1 }}>
                  {isSaving
                    ? <><WobbleRing size={16} color="#1A1412" />Сохранение…</>
                    : <><span className="material-symbols-rounded" style={{ fontSize: 15, lineHeight: 1 }}>check</span>Сохранить</>
                  }
                </button>
              </>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${border}`, display: 'flex', gap: 24, flexWrap: 'wrap' }}>
          {[
            { icon: 'shopping_cart_checkout', value: profile.checkInCount ?? 0, label: 'Посещений' },
            { icon: 'rate_review',           value: profile.reviewCount ?? 0,   label: 'Отзывов'   },
            { icon: 'add_business',          value: profile.addedShopsCount ?? 0, label: 'Добавлено' },
          ].map(stat => (
            <div key={stat.label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${gold}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-rounded" style={{ fontSize: 18, color: goldWarm, lineHeight: 1 }}>{stat.icon}</span>
              </div>
              <div>
                <p style={{ margin: 0, fontFamily: '"RF Dewi Expanded","Sora"', fontWeight: 700, fontSize: 18, color: textPrimary, lineHeight: 1 }}>{stat.value}</p>
                <p style={{ margin: 0, fontFamily: '"Noto Sans"', fontSize: 11, color: textMuted, marginTop: 2 }}>{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Editable fields */}
      <div style={{ padding: '24px', borderRadius: 20, border: `1px solid ${border}`, background: surface }}>
        <h3 style={{ margin: '0 0 20px', fontFamily: '"RF Dewi Expanded","Sora"', fontWeight: 700, fontSize: 16, color: textPrimary }}>Личная информация</h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, 1fr)', gap: 16 }} className="sm:!grid-cols-2">
          {/* Username */}
          <div>
            <label style={labelStyle}>Имя пользователя</label>
            {isEditing
              ? <input value={editValues.userName ?? ''} onChange={e => onInputChange('userName', e.target.value)} disabled={isSaving} style={inputStyle} />
              : <p style={{ margin: 0, fontFamily: '"Noto Sans"', fontSize: 14, color: textPrimary }}>{profile.userName || '—'}</p>
            }
          </div>

          {/* Email */}
          <div>
            <label style={labelStyle}>Email</label>
            {isEditing
              ? <input type="email" value={editValues.email ?? ''} onChange={e => onInputChange('email', e.target.value)} disabled={isSaving} style={inputStyle} />
              : <p style={{ margin: 0, fontFamily: '"Noto Sans"', fontSize: 14, color: textPrimary }}>{profile.email || '—'}</p>
            }
          </div>
        </div>

        {/* About */}
        <div style={{ marginTop: 16 }}>
          <label style={labelStyle}>О себе</label>
          {isEditing
            ? <textarea value={editValues.about ?? ''} onChange={e => onInputChange('about', e.target.value)} disabled={isSaving} placeholder="Расскажите немного о себе…" style={{ ...inputStyle, height: 'auto', minHeight: 90, padding: '10px 14px', resize: 'vertical' }} />
            : <p style={{ margin: 0, fontFamily: '"Noto Sans"', fontSize: 14, color: profile.about ? textPrimary : textMuted }}>{profile.about || 'Не указано'}</p>
          }
        </div>

        {isEditing && selectedAvatarFile && (
          <p style={{ margin: '12px 0 0', fontFamily: '"Noto Sans"', fontSize: 12, color: textMuted }}>Выбран файл: {selectedAvatarFile.name}</p>
        )}
      </div>
    </div>
  );
};

// ── Security section ─────────────────────────────────────────────────

const SecuritySection: React.FC<{ isDark: boolean; surface: string; border: string; textPrimary: string; textMuted: string }> = ({
  isDark, surface, border, textPrimary, textMuted,
}) => (
  <div style={{ padding: '24px', borderRadius: 20, border: `1px solid ${border}`, background: surface }}>
    <h3 style={{ margin: '0 0 4px', fontFamily: '"RF Dewi Expanded","Sora"', fontWeight: 700, fontSize: 16, color: textPrimary }}>Безопасность</h3>
    <p style={{ margin: '0 0 24px', fontFamily: '"Noto Sans"', fontSize: 14, color: textMuted }}>Управляйте паролем и настройками входа</p>

    <div style={{ padding: '16px', borderRadius: 14, border: `1px solid ${isDark ? '#3D2F28' : '#E7E5E4'}`, background: isDark ? 'rgba(255,255,255,0.03)' : '#F9F8F7', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
      <div>
        <p style={{ margin: 0, fontFamily: '"Noto Sans"', fontWeight: 600, fontSize: 14, color: textPrimary }}>Пароль</p>
        <p style={{ margin: '3px 0 0', fontFamily: '"Noto Sans"', fontSize: 12, color: textMuted }}>Последнее изменение — неизвестно</p>
      </div>
      <button style={{ padding: '8px 16px', borderRadius: 10, border: `1px solid ${isDark ? '#3D2F28' : '#E7E5E4'}`, background: 'transparent', color: textPrimary, fontFamily: '"Noto Sans"', fontWeight: 600, fontSize: 14, cursor: 'pointer', whiteSpace: 'nowrap' }}>
        Изменить
      </button>
    </div>
  </div>
);

// ── Appearance section ───────────────────────────────────────────────

const AppearanceSection: React.FC<{
  isDark: boolean; surface: string; border: string; textPrimary: string; textMuted: string;
  gold: string; theme: string; onToggleTheme: () => void;
}> = ({ isDark, surface, border, textPrimary, textMuted, gold, theme, onToggleTheme }) => (
  <div style={{ padding: '24px', borderRadius: 20, border: `1px solid ${border}`, background: surface }}>
    <h3 style={{ margin: '0 0 4px', fontFamily: '"RF Dewi Expanded","Sora"', fontWeight: 700, fontSize: 16, color: textPrimary }}>Внешний вид</h3>
    <p style={{ margin: '0 0 24px', fontFamily: '"Noto Sans"', fontSize: 14, color: textMuted }}>Выберите тему оформления</p>

    {/* Theme toggle cards */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      {[
        { value: 'light', label: 'Светлая', icon: 'light_mode',  preview: 'rgba(250,250,249,1)', accent: '#1C1917' },
        { value: 'dark',  label: 'Тёмная',  icon: 'dark_mode',   preview: '#2D241F',             accent: '#fff'    },
      ].map(opt => {
        const active = theme === opt.value;
        return (
          <button key={opt.value} onClick={onToggleTheme}
            style={{ padding: '20px 16px', borderRadius: 16, border: `2px solid ${active ? gold : border}`, background: active ? `${gold}10` : (isDark ? 'rgba(255,255,255,0.03)' : '#F9F8F7'), cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, transition: 'all .2s' }}>
            <div style={{ width: 52, height: 36, borderRadius: 10, background: opt.preview, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0,0,0,0.08)' }}>
              <span className="material-symbols-rounded" style={{ fontSize: 22, color: opt.accent, lineHeight: 1 }}>{opt.icon}</span>
            </div>
            <span style={{ fontFamily: '"Noto Sans"', fontWeight: 600, fontSize: 13, color: active ? gold : textPrimary }}>{opt.label}</span>
            {active && <span className="material-symbols-rounded" style={{ fontSize: 16, color: gold, lineHeight: 1, marginTop: -4 }}>check_circle</span>}
          </button>
        );
      })}
    </div>
  </div>
);

// ── Cafes section ────────────────────────────────────────────────────

const CafesSection: React.FC<{
  isDark: boolean; surface: string; border: string; textPrimary: string; textMuted: string;
  gold: string; onAdd: () => void; onBrowse: () => void;
}> = ({ isDark, surface, border, textPrimary, textMuted, gold, onAdd, onBrowse }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <div style={{ padding: '24px', borderRadius: 20, border: `1px solid ${border}`, background: surface }}>
      <h3 style={{ margin: '0 0 4px', fontFamily: '"RF Dewi Expanded","Sora"', fontWeight: 700, fontSize: 16, color: textPrimary }}>Добавить кофейню</h3>
      <p style={{ margin: '0 0 20px', fontFamily: '"Noto Sans"', fontSize: 14, color: textMuted }}>Отправьте новую кофейню на проверку модераторами</p>
      <button onClick={onAdd} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, border: 'none', background: gold, color: '#1A1412', fontFamily: '"RF Dewi Expanded","Sora"', fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'opacity .15s' }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
        <span className="material-symbols-rounded" style={{ fontSize: 18, lineHeight: 1 }}>add_business</span>
        Добавить кофейню
      </button>
    </div>

    <div style={{ padding: '24px', borderRadius: 20, border: `1px solid ${border}`, background: surface }}>
      <h3 style={{ margin: '0 0 4px', fontFamily: '"RF Dewi Expanded","Sora"', fontWeight: 700, fontSize: 16, color: textPrimary }}>Каталог кофеен</h3>
      <p style={{ margin: '0 0 20px', fontFamily: '"Noto Sans"', fontSize: 14, color: textMuted }}>Исследуйте все кофейни в каталоге</p>
      <button onClick={onBrowse} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, border: `1px solid ${isDark ? '#3D2F28' : '#E7E5E4'}`, background: 'transparent', color: textPrimary, fontFamily: '"Noto Sans"', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
        <span className="material-symbols-rounded" style={{ fontSize: 18, lineHeight: 1 }}>coffee</span>
        Открыть каталог
      </button>
    </div>
  </div>
);

export default SettingsPage;
