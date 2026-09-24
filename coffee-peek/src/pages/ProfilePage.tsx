import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getProfile, updateAbout, updateAvatar, updateEmail, updateUsername, type UserProfile,
} from '../api/auth';
import { getAvatarUploadUrl } from '../api/photos';
import WobbleRing from '../components/WobbleRing';
import { useLocalFavorites } from '../hooks/useLocalFavorites';
import { usePageTitle } from '../hooks/usePageTitle';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { logger } from '../utils/logger';
import { getErrorMessage } from '../utils/errorHandler';
import {
  CaretRight,
  ChatCircleText,
  Heart,
  MapPin,
  NotePencil,
  PencilSimple,
  SignOut,
} from '@/components/Icon';

const ProfilePage: React.FC = () => {
  usePageTitle('Профиль');
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { logout, updateUserProfile } = useUser();
  const { favoriteIds } = useLocalFavorites();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draft, setDraft] = useState({ userName: '', email: '', about: '' });
  const [avatar, setAvatar] = useState<File | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    getProfile()
      .then(response => { if (!cancelled) setProfile(response.data); })
      .catch(error => logger.error('Error loading profile:', error))
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const isDark = theme === 'dark';
  const colors: ProfileColors = {
    bg: isDark ? '#171210' : '#F5F4F2',
    surface: isDark ? '#2B211C' : '#FFFFFF',
    border: isDark ? '#46362F' : '#E7E5E4',
    text: isDark ? '#FFFFFF' : '#1C1917',
    muted: isDark ? '#A39E93' : '#78716C',
    gold: '#EAB308',
  };

  if (isLoading) {
    return <div className="flex min-h-[70vh] items-center justify-center" style={{ background: colors.bg }}><WobbleRing size={48} /></div>;
  }

  if (!profile) {
    return <div className="flex min-h-[70vh] items-center justify-center px-6 text-center" style={{ background: colors.bg, color: colors.text }}>Не удалось загрузить профиль</div>;
  }

  const initial = profile.userName?.[0]?.toUpperCase() ?? '?';
  const startEditing = () => {
    setDraft({ userName: profile.userName, email: profile.email, about: profile.about ?? '' });
    setAvatar(null);
    setError('');
    setIsEditing(true);
  };
  const cancelEditing = () => {
    setAvatar(null);
    setError('');
    setIsEditing(false);
  };
  const saveProfile = async () => {
    if (!draft.userName.trim() || !/^\S+@\S+\.\S+$/.test(draft.email)) return setError('Проверьте имя и email');
    if (avatar && (!avatar.type.startsWith('image/') || avatar.size > 5 * 1024 * 1024)) return setError('Выберите изображение размером до 5 МБ');
    setIsSaving(true);
    try {
      const updates: Promise<unknown>[] = [];
      if (draft.userName.trim() !== profile.userName) updates.push(updateUsername({ username: draft.userName.trim() }));
      if (draft.email.trim() !== profile.email) updates.push(updateEmail({ email: draft.email.trim() }));
      if (draft.about.trim() !== (profile.about ?? '')) updates.push(updateAbout({ about: draft.about.trim() }));
      if (avatar) {
        const upload = await getAvatarUploadUrl({ fileName: avatar.name, contentType: avatar.type, sizeBytes: avatar.size });
        if (!upload.data) throw new Error('Не удалось подготовить загрузку фотографии');
        const response = await fetch(upload.data.uploadUrl, { method: 'PUT', headers: { 'Content-Type': avatar.type }, body: avatar });
        if (!response.ok) throw new Error('Не удалось загрузить фотографию');
        updates.push(updateAvatar({ uploadedPhoto: { fileName: avatar.name, contentType: avatar.type, storageKey: upload.data.storageKey, size: avatar.size } }));
      }
      await Promise.all(updates);
      const next = (await getProfile()).data;
      setProfile(next);
      updateUserProfile(next);
      setIsEditing(false);
      setAvatar(null);
      setError('');
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setIsSaving(false);
    }
  };
  const activities = [
    { title: 'Избранные кофейни', subtitle: 'Кофейни, которые вы сохранили', Icon: Heart, color: '#FB7185', bg: 'rgba(244,63,94,.16)', route: '/shops?filter=favorite' },
    { title: 'Мои отзывы', subtitle: 'Ваши оценки и отзывы о кофейнях', Icon: ChatCircleText, color: '#D58AE8', bg: 'rgba(192,82,214,.16)', route: '/reviews' },
    { title: 'Чекины', subtitle: 'Места, которые вы уже посетили', Icon: MapPin, color: '#68B9E8', bg: 'rgba(56,153,211,.16)', route: '/check-ins' },
    { title: 'Мои правки кофеен', subtitle: 'Заявки, которые вы отправили на модерацию', Icon: NotePencil, color: '#D8A743', bg: 'rgba(202,145,28,.16)', route: '/shop-change-requests' },
  ];

  return (
    <main className="min-h-screen px-5 pb-12 pt-8 sm:px-8" style={{ background: colors.bg }}>
      <div className="mx-auto w-full max-w-[680px]">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h1 className="text-3xl font-extrabold" style={{ color: colors.text }}>Профиль</h1>
          <div className="flex items-center gap-2">
            {isEditing && (
              <button type="button" onClick={cancelEditing} disabled={isSaving} className="min-h-11 rounded-full border px-4 text-sm font-bold" style={{ borderColor: colors.border, background: colors.surface, color: colors.text }}>Отмена</button>
            )}
            <button
              type="button"
              onClick={() => { if (isEditing) void saveProfile(); else startEditing(); }}
              disabled={isSaving}
              className="inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-bold transition-opacity hover:opacity-80 disabled:opacity-60"
              style={{ borderColor: isEditing ? colors.gold : colors.border, background: isEditing ? colors.gold : colors.surface, color: isEditing ? '#1A1412' : colors.text }}
            >
              <PencilSimple size={18} />
              {isSaving ? 'Сохраняем…' : isEditing ? 'Сохранить' : 'Редактировать'}
            </button>
          </div>
        </div>

        {error && <div className="mb-5 rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: 'rgba(239,68,68,.45)', background: colors.surface, color: '#EF4444' }}>{error}</div>}

        <section className="grid grid-cols-[104px_1fr] gap-5 sm:grid-cols-[120px_1fr] sm:gap-6">
          <div className="h-[104px] w-[104px] sm:h-[120px] sm:w-[120px]">
            <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-full border" style={{ borderColor: colors.border, background: `${colors.gold}18` }}>
              {profile.avatarUrl
                ? <img src={profile.avatarUrl} alt={profile.userName} className="h-full w-full object-cover" />
                : <span className="text-4xl font-extrabold" style={{ color: colors.gold }}>{initial}</span>}
              {isEditing && (
                <label className="absolute inset-x-0 bottom-0 flex min-h-11 cursor-pointer items-center justify-center bg-black/65 text-white" aria-label="Изменить фотографию профиля">
                  <PencilSimple size={20} />
                  <input type="file" accept="image/*" onChange={event => setAvatar(event.target.files?.[0] ?? null)} className="sr-only" />
                </label>
              )}
            </div>
          </div>

          <div className="min-w-0 pt-1 sm:pt-2">
            {isEditing ? (
              <>
                <input aria-label="Имя" value={draft.userName} onChange={event => setDraft(value => ({ ...value, userName: event.target.value }))} className="h-11 w-full rounded-xl border px-3 text-xl font-extrabold outline-none" style={{ borderColor: colors.border, background: colors.surface, color: colors.text }} />
                <input aria-label="Email" type="email" value={draft.email} onChange={event => setDraft(value => ({ ...value, email: event.target.value }))} className="mt-2 h-11 w-full rounded-xl border px-3 text-sm outline-none" style={{ borderColor: colors.border, background: colors.surface, color: colors.text }} />
              </>
            ) : (
              <>
                <h2 className="truncate text-2xl font-extrabold" style={{ color: colors.text }}>{profile.userName}</h2>
                <p className="mt-1 truncate text-sm sm:text-base" style={{ color: colors.muted }}>{profile.email}</p>
              </>
            )}
            <div className="mt-4 grid grid-cols-3 gap-3">
              <ProfileStat value={profile.reviewCount ?? 0} label="Отзывы" text={colors.text} muted={colors.muted} />
              <ProfileStat value={profile.checkInCount ?? 0} label="Чекины" text={colors.text} muted={colors.muted} />
              <ProfileStat value={profile.addedShopsCount ?? favoriteIds.size} label="Кофейни" text={colors.text} muted={colors.muted} />
            </div>
          </div>
        </section>

        {isEditing ? (
          <textarea aria-label="О себе" value={draft.about} onChange={event => setDraft(value => ({ ...value, about: event.target.value }))} placeholder="Расскажите о себе" rows={2} className="mt-5 w-full resize-y rounded-xl border px-3 py-2 text-base outline-none" style={{ borderColor: colors.border, background: colors.surface, color: colors.text }} />
        ) : profile.about ? <p className="mt-5 text-base leading-relaxed" style={{ color: colors.muted }}>{profile.about}</p> : null}

        <p className="mb-2 mt-6 text-xs font-medium uppercase tracking-wider" style={{ color: colors.muted }}>Моя активность</p>
        <section className="overflow-hidden rounded-3xl border" style={{ borderColor: colors.border, background: colors.surface }}>
          {activities.map(({ title, subtitle, Icon, color, bg, route }, index) => (
            <button
              key={title}
              type="button"
              onClick={() => navigate(route)}
              className="flex w-full items-center gap-4 px-4 py-5 text-left transition-opacity hover:opacity-80 sm:gap-3 sm:px-5 sm:py-3.5"
              style={{ borderTop: index ? `1px solid ${colors.border}` : undefined }}
            >
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl sm:h-11 sm:w-11 sm:rounded-xl" style={{ background: bg, color }}><Icon className="h-7 w-7 sm:h-[22px] sm:w-[22px]" /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-medium sm:text-base" style={{ color: colors.text }}>{title}</span>
                <span className="mt-0.5 block text-sm leading-snug sm:text-xs" style={{ color: colors.muted }}>{subtitle}</span>
              </span>
              <CaretRight className="h-[25px] w-[25px] sm:h-5 sm:w-5" color={colors.muted} />
            </button>
          ))}
        </section>

        <button
          type="button"
          onClick={() => { void logout().then(() => navigate('/')); }}
          className="mt-4 flex min-h-12 w-full items-center justify-center gap-2.5 rounded-full text-base font-bold"
          style={{ background: isDark ? 'rgba(127,29,29,.23)' : '#FEE2E2', color: '#EF4444' }}
        >
          <SignOut size={22} />
          Выйти
        </button>
      </div>
    </main>
  );
};

const ProfileStat: React.FC<{ value: number; label: string; text: string; muted: string }> = ({ value, label, text, muted }) => (
  <div>
    <strong className="block text-xl" style={{ color: text }}>{value}</strong>
    <span className="text-xs sm:text-sm" style={{ color: muted }}>{label}</span>
  </div>
);

type ProfileColors = { bg: string; surface: string; border: string; text: string; muted: string; gold: string };

export default ProfilePage;
