import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
import {
  getProfile, UserProfile,
  updateUsername, updateEmail, updateAbout, updateAvatar, resendEmailConfirmation,
  changePassword,
} from '../api/auth';
import { getAvatarUploadUrl } from '../api/photos';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS } from '../constants/colors';
import { getErrorMessage, getPasswordErrorMessage } from '../utils/errorHandler';
import { TokenManager } from '../api/core/httpClient';
import { logger } from '../utils/logger';
import { usePageTitle } from '../hooks/usePageTitle';
import WobbleRing from '../components/WobbleRing';
import { MobileAppDownload } from '../components/mobile-app';
import {
  Coffee, SignOut, Camera, PencilSimple, Check,
  ChatCircleText, Storefront, Sun, Moon, CheckCircle, Envelope,
  ArrowClockwise, X, MapPin, Lock,
} from '@/components/Icon';

const styles = `
  .settings-page { --settings-max: 820px; }
  .settings-wrap { width: min(var(--settings-max), calc(100vw - 32px)); margin: 0 auto; }
  .settings-card { border-radius: 14px; overflow: hidden; }
  .settings-profile-head { display: grid; grid-template-columns: auto 1fr auto; gap: 18px; align-items: start; padding: 22px; }
  .settings-info-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; padding: 14px 28px 22px 130px; }
  .settings-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; padding: 18px 28px; }
  .settings-row { display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 20px; padding: 20px 28px; }
  .settings-actions { display: flex; justify-content: flex-end; gap: 10px; padding: 18px 16px 0; }
  .settings-release-card { margin-top: 28px; padding: 22px; }
  @media (max-width: 720px) {
    .settings-wrap { width: min(100%, calc(100vw - 24px)); }
    .settings-profile-head { grid-template-columns: auto 1fr; gap: 14px; padding: 18px; }
    .settings-edit-action { grid-column: 1 / -1; width: 100%; justify-content: stretch !important; }
    .settings-edit-action > button { flex: 1; }
    .settings-info-grid { grid-template-columns: 1fr; padding: 0 18px 18px; }
    .settings-stats { grid-template-columns: 1fr; padding: 14px 18px; }
    .settings-row { grid-template-columns: 1fr; padding: 18px; }
    .settings-row-action { width: 100%; justify-content: center; }
    .settings-actions { flex-direction: column; padding: 18px 0 0; }
    .settings-actions button { width: 100%; }
    .settings-release-card { margin-top: 20px; padding: 18px; }
  }
`;

const SettingsPage: React.FC = () => {
  usePageTitle('Настройки');
  const { user, isLoading: userLoading, updateUserProfile, logout } = useUser();
  const userId = user?.id;
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';

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

  const gold = COLORS.primary;
  const goldWarm = '#D4A84B';
  const bg = isDark ? '#1A1412' : '#F5F4F2';
  const surface = isDark ? '#2D241F' : '#fff';
  const softSurface = isDark ? 'rgba(255,255,255,0.04)' : '#F9F8F7';
  const border = isDark ? '#3D2F28' : '#E7E5E4';
  const textPrimary = isDark ? '#fff' : '#1C1917';
  const textMuted = isDark ? '#A39E93' : '#78716C';

  const loadProfile = useCallback(async () => {
    if (userId === undefined) return;
    try {
      setIsLoading(true);
      const token = TokenManager.getAccessToken();
      if (!token) throw new Error('Токен доступа отсутствует');
      const response = await getProfile();
      setProfile(response.data);
      updateUserProfile(response.data);
      setError(null);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      logger.error('Error loading profile:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, updateUserProfile]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

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
        updateUserProfile(refreshed.data);
      }
      if (emailChanged) setPendingEmailConfirmation(editValues.email);
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
  }, [profile, editValues, originalValues, selectedAvatarFile, updateUserProfile]);

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

  if (userLoading || isLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg }}>
        <WobbleRing size={48} />
      </div>
    );
  }

  return (
    <div className="settings-page" style={{ minHeight: '100vh', background: bg }}>
      <style>{styles}</style>

      <div style={{ borderBottom: `1px solid ${border}`, background: isDark ? 'rgba(45,36,31,0.7)' : surface, backdropFilter: 'blur(12px)' }}>
        <div className="settings-wrap" style={{ height: 48, display: 'flex', alignItems: 'center', gap: 12 }}>
          <h1 style={{ margin: 0, fontFamily: '"RF Dewi Expanded"', fontWeight: 700, fontSize: 18, color: textPrimary }}>Настройки</h1>
          {saveSuccess && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 99, background: 'rgba(34,197,94,.14)', color: '#15803D', fontFamily: '"RF Dewi Expanded"', fontSize: 12, fontWeight: 700 }}>
              <CheckCircle size={14} />
              Сохранено
            </span>
          )}
        </div>
      </div>

      <main className="settings-wrap" style={{ padding: '14px 0 44px' }}>
        {error && (
          <Notice tone="error" border={border} onClose={() => setError(null)}>
            {error}
          </Notice>
        )}

        {pendingEmailConfirmation && !isEditing && (
          <EmailNotice
            email={pendingEmailConfirmation}
            isResending={isResending}
            resendSuccess={resendSuccess}
            onResend={handleResendConfirmation}
            onClose={() => setPendingEmailConfirmation(null)}
            border={border}
          />
        )}

        {profile && (
          <ProfileCard
            profile={profile}
            isEditing={isEditing}
            editValues={editValues}
            isSaving={isSaving}
            selectedAvatarFile={selectedAvatarFile}
            avatarPreview={avatarPreview}
            surface={surface}
            softSurface={softSurface}
            border={border}
            textPrimary={textPrimary}
            textMuted={textMuted}
            gold={gold}
            goldWarm={goldWarm}
            theme={theme}
            onSetTheme={setTheme}
            onEditStart={handleEditStart}
            onEditCancel={handleEditCancel}
            onSave={handleSave}
            onInputChange={(field, value) => setEditValues(prev => ({ ...prev, [field]: value }))}
            onAvatarSelect={handleAvatarSelect}
            onOpenCheckIns={() => navigate('/check-ins')}
            onOpenReviews={() => navigate('/reviews')}
          />
        )}

        <AppDownloadSection surface={surface} border={border} textPrimary={textPrimary} textMuted={textMuted} />

        <div className="settings-actions">
          <ActionButton onClick={() => navigate('/coffee-shops/new')} border={border} background={surface} color={gold} icon={<Storefront size={15} color={gold} />}>
            Добавить кофейню
          </ActionButton>
          <ActionButton onClick={() => { logout(); navigate('/'); }} border={border} background={surface} color="#EF4444" icon={<SignOut size={15} color="#EF4444" />}>
            Выйти
          </ActionButton>
        </div>
      </main>
    </div>
  );
};

const Notice: React.FC<{ children: React.ReactNode; tone: 'error' | 'warning'; border: string; onClose: () => void }> = ({ children, tone, border, onClose }) => (
  <div style={{ marginBottom: 12, padding: '12px 14px', borderRadius: 12, background: tone === 'error' ? 'rgba(239,68,68,0.08)' : 'rgba(234,179,8,0.08)', border: `1px solid ${tone === 'error' ? 'rgba(239,68,68,0.2)' : border}`, display: 'flex', gap: 10, alignItems: 'center' }}>
    <p style={{ flex: 1, margin: 0, fontFamily: '"RF Dewi Expanded"', fontSize: 13, color: tone === 'error' ? '#EF4444' : '#EAB308' }}>{children}</p>
    <button type="button" onClick={onClose} style={{ border: 'none', background: 'transparent', padding: 2, cursor: 'pointer', color: '#A39E93' }}><X size={16} /></button>
  </div>
);

const EmailNotice: React.FC<{ email: string; isResending: boolean; resendSuccess: boolean; border: string; onResend: () => void; onClose: () => void }> = ({ email, isResending, resendSuccess, border, onResend, onClose }) => (
  <div style={{ marginBottom: 12, padding: '13px 14px', borderRadius: 12, background: 'rgba(234,179,8,0.08)', border: `1px solid ${border}`, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
    <Envelope size={17} color="#EAB308" style={{ flexShrink: 0, marginTop: 2 }} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ margin: '0 0 8px', fontFamily: '"RF Dewi Expanded"', fontSize: 12, color: '#EAB308', lineHeight: 1.55 }}>Письмо отправлено на <strong>{email}</strong>. Старый email активен до подтверждения.</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <button onClick={onResend} disabled={isResending} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 8, border: '1px solid rgba(234,179,8,0.4)', background: 'rgba(234,179,8,0.12)', color: '#EAB308', fontFamily: '"RF Dewi Expanded"', fontWeight: 600, fontSize: 12, cursor: isResending ? 'not-allowed' : 'pointer', opacity: isResending ? 0.6 : 1 }}>
          <ArrowClockwise size={14} />
          {isResending ? 'Отправляем...' : 'Отправить повторно'}
        </button>
        {resendSuccess && <span style={{ fontFamily: '"RF Dewi Expanded"', fontSize: 12, color: '#22C55E', display: 'inline-flex', alignItems: 'center', gap: 4 }}><CheckCircle size={14} />Письмо отправлено</span>}
      </div>
    </div>
    <button onClick={onClose} style={{ background: 'none', border: 'none', padding: 2, cursor: 'pointer', color: '#A39E93', flexShrink: 0 }}><X size={18} /></button>
  </div>
);

interface ProfileCardProps {
  profile: UserProfile;
  isEditing: boolean;
  editValues: Record<string, string>;
  isSaving: boolean;
  selectedAvatarFile: File | null;
  avatarPreview: string | null;
  surface: string;
  softSurface: string;
  border: string;
  textPrimary: string;
  textMuted: string;
  gold: string;
  goldWarm: string;
  theme: string;
  onSetTheme: (theme: 'dark' | 'light') => void;
  onEditStart: () => void;
  onEditCancel: () => void;
  onSave: () => void;
  onInputChange: (field: string, value: string) => void;
  onAvatarSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onOpenCheckIns: () => void;
  onOpenReviews: () => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({
  profile, isEditing, editValues, isSaving, selectedAvatarFile, avatarPreview,
  surface, softSurface, border, textPrimary, textMuted, gold, goldWarm,
  theme, onSetTheme, onEditStart, onEditCancel, onSave, onInputChange, onAvatarSelect, onOpenCheckIns, onOpenReviews,
}) => {
  const displayAvatar = avatarPreview || profile.avatarUrl;
  const memberSince = profile.createdAtUtc ? new Date(profile.createdAtUtc).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  const roleLabel = (profile.roles ?? []).includes('Admin') ? 'Администратор' : 'Ценитель кофе';

  return (
    <section className="settings-card" style={{ border: `1px solid ${border}`, background: surface }}>
      <div className="settings-profile-head">
        <div style={{ position: 'relative', width: 74, height: 74, flexShrink: 0 }}>
          <div style={{ width: 74, height: 74, borderRadius: 99, border: `2px solid ${border}`, overflow: 'hidden', background: displayAvatar ? 'transparent' : `${gold}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {displayAvatar ? <img src={displayAvatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontFamily: '"RF Dewi Expanded"', fontWeight: 800, fontSize: 26, color: goldWarm }}>{profile.userName?.[0]?.toUpperCase() ?? 'U'}</span>}
          </div>
          {isEditing && (
            <label style={{ position: 'absolute', bottom: -2, right: -2, width: 28, height: 28, borderRadius: 99, background: gold, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: `2px solid ${surface}` }}>
              <input type="file" accept="image/*" onChange={onAvatarSelect} disabled={isSaving} style={{ display: 'none' }} />
              <Camera size={14} color="#1A1412" />
            </label>
          )}
        </div>

        <div style={{ minWidth: 0 }}>
          {isEditing ? (
            <input value={editValues.userName ?? ''} onChange={e => onInputChange('userName', e.target.value)} disabled={isSaving} style={inputStyle(border, textPrimary, softSurface)} />
          ) : (
            <h2 style={{ margin: 0, fontFamily: '"RF Dewi Expanded"', fontWeight: 800, fontSize: 22, color: textPrimary, letterSpacing: '-0.01em', overflowWrap: 'anywhere' }}>{profile.userName}</h2>
          )}
          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 9px', borderRadius: 99, background: `${gold}12`, border: `1px solid ${gold}26` }}>
              <Coffee size={12} color={goldWarm} />
              <span style={{ fontFamily: '"RF Dewi Expanded"', fontWeight: 700, fontSize: 10, color: goldWarm, letterSpacing: '.05em', textTransform: 'uppercase' }}>{roleLabel}</span>
            </span>
          </div>
          {memberSince && <p style={{ margin: '8px 0 0', fontFamily: '"RF Dewi Expanded"', fontSize: 12, color: textMuted }}>С {memberSince}</p>}
          {isEditing && selectedAvatarFile && <p style={{ margin: '8px 0 0', fontFamily: '"RF Dewi Expanded"', fontSize: 11, color: textMuted, overflowWrap: 'anywhere' }}>Выбран файл: {selectedAvatarFile.name}</p>}
        </div>

        <div className="settings-edit-action" style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          {!isEditing ? (
            <ButtonLike onClick={onEditStart} border={border} color={textPrimary} background="transparent" icon={<PencilSimple size={15} />}>Изменить</ButtonLike>
          ) : (
            <>
              <ButtonLike onClick={onEditCancel} border={border} color={textPrimary} background="transparent" disabled={isSaving}>Отмена</ButtonLike>
              <ButtonLike onClick={onSave} border={gold} color="#1A1412" background={gold} disabled={isSaving} icon={isSaving ? <WobbleRing size={14} color="#1A1412" /> : <Check size={14} />}>{isSaving ? 'Сохранение' : 'Сохранить'}</ButtonLike>
            </>
          )}
        </div>
      </div>

      <div className="settings-info-grid">
        <InfoField label="Email" value={profile.email || '—'} isEditing={isEditing} input={<input type="email" value={editValues.email ?? ''} onChange={e => onInputChange('email', e.target.value)} disabled={isSaving} style={inputStyle(border, textPrimary, softSurface)} />} textPrimary={textPrimary} textMuted={textMuted} />
        <InfoField label="О себе" value={profile.about || 'Не указано'} isEditing={isEditing} input={<textarea value={editValues.about ?? ''} onChange={e => onInputChange('about', e.target.value)} disabled={isSaving} placeholder="Расскажите немного о себе..." style={{ ...inputStyle(border, textPrimary, softSurface), height: 72, paddingTop: 10, resize: 'vertical' }} />} textPrimary={profile.about ? textPrimary : textMuted} textMuted={textMuted} />
      </div>

      <Divider border={border} />
      <div className="settings-stats">
        <StatItem icon={<MapPin size={17} color={goldWarm} />} value={profile.checkInCount ?? 0} label="Чекинов" onClick={onOpenCheckIns} gold={gold} textPrimary={textPrimary} textMuted={textMuted} />
        <StatItem icon={<ChatCircleText size={17} color={goldWarm} />} value={profile.reviewCount ?? 0} label="Отзывов" onClick={onOpenReviews} gold={gold} textPrimary={textPrimary} textMuted={textMuted} />
        <StatItem icon={<Storefront size={17} color={goldWarm} />} value={profile.addedShopsCount ?? 0} label="Добавлено" gold={gold} textPrimary={textPrimary} textMuted={textMuted} />
      </div>

      <Divider border={border} />
      <SecurityRow border={border} textPrimary={textPrimary} textMuted={textMuted} softSurface={softSurface} />
      <Divider border={border} />
      <AppearanceRow border={border} textPrimary={textPrimary} textMuted={textMuted} gold={gold} theme={theme} onSetTheme={onSetTheme} />
    </section>
  );
};

function inputStyle(border: string, textPrimary: string, background: string): React.CSSProperties {
  return {
    width: '100%', minHeight: 38, borderRadius: 9, border: `1px solid ${border}`,
    background, color: textPrimary, fontFamily: '"RF Dewi Expanded"', fontSize: 13,
    padding: '0 12px', outline: 'none', boxSizing: 'border-box',
  };
}

const InfoField: React.FC<{ label: string; value: string; isEditing: boolean; input: React.ReactNode; textPrimary: string; textMuted: string }> = ({ label, value, isEditing, input, textPrimary, textMuted }) => (
  <div style={{ minWidth: 0 }}>
    <p style={{ margin: '0 0 6px', fontFamily: '"RF Dewi Expanded"', fontSize: 10, fontWeight: 700, color: textMuted, letterSpacing: '.06em', textTransform: 'uppercase' }}>{label}</p>
    {isEditing ? input : <p style={{ margin: 0, fontFamily: '"RF Dewi Expanded"', fontSize: 13, color: textPrimary, overflowWrap: 'anywhere', lineHeight: 1.45 }}>{value}</p>}
  </div>
);

const Divider: React.FC<{ border: string }> = ({ border }) => <div style={{ height: 1, background: border, margin: '0 22px' }} />;

const StatItem: React.FC<{ icon: React.ReactNode; value: number; label: string; gold: string; textPrimary: string; textMuted: string; onClick?: () => void }> = ({ icon, value, label, gold, textPrimary, textMuted, onClick }) => (
  <button type="button" onClick={onClick} disabled={!onClick} style={{ border: 'none', background: 'transparent', padding: 0, display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', cursor: onClick ? 'pointer' : 'default', minWidth: 0 }}>
    <span style={{ width: 30, height: 30, borderRadius: 9, background: `${gold}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{icon}</span>
    <span style={{ minWidth: 0 }}>
      <span style={{ display: 'block', fontFamily: '"RF Dewi Expanded"', fontWeight: 800, fontSize: 16, color: textPrimary, lineHeight: 1 }}>{value}</span>
      <span style={{ display: 'block', marginTop: 2, fontFamily: '"RF Dewi Expanded"', fontSize: 11, color: textMuted }}>{label}{onClick ? ' →' : ''}</span>
    </span>
  </button>
);

const SecurityRow: React.FC<{ border: string; textPrimary: string; textMuted: string; softSurface: string }> = ({ border, textPrimary, textMuted, softSurface }) => {
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const gold = '#EAB308';

  const handleSave = async () => {
    setError('');
    setSuccess('');
    if (newPassword.length < 8) { setError('Новый пароль должен содержать минимум 8 символов'); return; }
    if (newPassword !== confirmPassword) { setError('Пароли не совпадают'); return; }
    setIsSaving(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setSuccess('Пароль изменён. Текущая сессия остаётся активной.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setOpen(false);
    } catch (err) {
      setError(getPasswordErrorMessage(err) ?? getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <div className="settings-row">
        <div style={{ minWidth: 0 }}>
          <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontFamily: '"RF Dewi Expanded"', fontWeight: 700, fontSize: 15, color: textPrimary }}><Lock size={15} />Пароль</h3>
          <p style={{ margin: '5px 0 0', fontFamily: '"RF Dewi Expanded"', fontSize: 12, color: success ? '#22C55E' : textMuted, lineHeight: 1.45 }}>{success || 'Смена пароля не разлогинивает текущую сессию'}</p>
        </div>
        <ButtonLike className="settings-row-action" onClick={() => { setOpen((v) => !v); setError(''); setSuccess(''); }} border={border} color={textPrimary} background="transparent">{open ? 'Отмена' : 'Изменить'}</ButtonLike>
      </div>

      {open && (
        <div style={{ padding: '0 28px 20px', display: 'grid', gridTemplateColumns: '1fr', gap: 10 }}>
          <input type="password" placeholder="Текущий пароль" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} style={inputStyle(border, textPrimary, softSurface)} />
          <input type="password" placeholder="Новый пароль" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} style={inputStyle(border, textPrimary, softSurface)} />
          <input type="password" placeholder="Повторите новый пароль" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={inputStyle(border, textPrimary, softSurface)} />
          {error && <p style={{ margin: 0, fontFamily: '"RF Dewi Expanded"', fontSize: 12, color: '#EF4444' }}>{error}</p>}
          <ButtonLike onClick={handleSave} disabled={isSaving || !currentPassword || newPassword.length < 8} border={gold} color="#1A1412" background={gold}>{isSaving ? 'Сохраняем...' : 'Сохранить пароль'}</ButtonLike>
        </div>
      )}
    </div>
  );
};

const AppearanceRow: React.FC<{ border: string; textPrimary: string; textMuted: string; gold: string; theme: string; onSetTheme: (theme: 'dark' | 'light') => void }> = ({ border, textPrimary, textMuted, gold, theme, onSetTheme }) => (
  <div className="settings-row">
    <div style={{ minWidth: 0 }}>
      <h3 style={{ margin: 0, fontFamily: '"RF Dewi Expanded"', fontWeight: 700, fontSize: 15, color: textPrimary }}>Внешний вид</h3>
      <p style={{ margin: '5px 0 0', fontFamily: '"RF Dewi Expanded"', fontSize: 12, color: textMuted }}>Выберите тему оформления</p>
    </div>
    <div className="settings-row-action" style={{ display: 'flex', gap: 10 }}>
      {[
        { value: 'light' as const, label: 'Светлая тема', Icon: Sun, bg: '#FFFFFF', color: '#1C1917' },
        { value: 'dark' as const, label: 'Тёмная тема', Icon: Moon, bg: '#2D241F', color: '#FFFFFF' },
      ].map(opt => {
        const active = theme === opt.value;
        return (
          <button key={opt.value} type="button" aria-label={opt.label} onClick={() => onSetTheme(opt.value)} style={{ width: 48, height: 38, borderRadius: 9, border: `1px solid ${active ? gold : border}`, background: active ? `${gold}12` : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <span style={{ width: 32, height: 28, borderRadius: 8, background: opt.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${border}` }}><opt.Icon size={16} color={opt.color} /></span>
          </button>
        );
      })}
    </div>
  </div>
);

const AppDownloadSection: React.FC<{ surface: string; border: string; textPrimary: string; textMuted: string }> = ({ surface, border, textPrimary, textMuted }) => (
  <section className="settings-release-card" style={{ borderRadius: 14, border: `1px solid ${border}`, background: surface }}>
    <h3 style={{ margin: '0 0 4px', fontFamily: '"RF Dewi Expanded"', fontWeight: 700, fontSize: 16, color: textPrimary }}>Мобильное приложение</h3>
    <p style={{ margin: '0 0 16px', fontFamily: '"RF Dewi Expanded"', fontSize: 13, color: textMuted, lineHeight: 1.45 }}>Android доступен для тестирования, iOS уже в разработке</p>
    <MobileAppDownload variant="compact" />
  </section>
);

const ButtonLike: React.FC<{ children: React.ReactNode; border: string; color: string; background: string; icon?: React.ReactNode; disabled?: boolean; className?: string; onClick: () => void }> = ({ children, border, color, background, icon, disabled, className = '', onClick }) => (
  <button type="button" className={className} onClick={onClick} disabled={disabled} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, minHeight: 36, padding: '8px 14px', borderRadius: 9, border: `1px solid ${border}`, background, color, fontFamily: '"RF Dewi Expanded"', fontWeight: 700, fontSize: 13, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1, whiteSpace: 'nowrap' }}>
    {icon}
    {children}
  </button>
);

const ActionButton: React.FC<{ children: React.ReactNode; border: string; background: string; color: string; icon: React.ReactNode; onClick: () => void }> = ({ children, border, background, color, icon, onClick }) => (
  <button type="button" onClick={onClick} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 38, padding: '9px 14px', borderRadius: 9, border: `1px solid ${border}`, background, color, fontFamily: '"RF Dewi Expanded"', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
    {icon}
    {children}
  </button>
);

export default SettingsPage;
