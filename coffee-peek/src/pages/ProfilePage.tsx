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
  const activities = [
    { title: 'Избранные кофейни', subtitle: 'Кофейни, которые вы сохранили', Icon: Heart, color: '#FB7185', bg: 'rgba(244,63,94,.16)', route: '/shops?filter=favorite' },
    { title: 'Мои отзывы', subtitle: 'Ваши оценки и отзывы о кофейнях', Icon: ChatCircleText, color: '#D58AE8', bg: 'rgba(192,82,214,.16)', route: '/reviews' },
    { title: 'Чекины', subtitle: 'Места, которые вы уже посетили', Icon: MapPin, color: '#68B9E8', bg: 'rgba(56,153,211,.16)', route: '/check-ins' },
    { title: 'Мои правки кофеен', subtitle: 'Заявки, которые вы отправили на модерацию', Icon: NotePencil, color: '#D8A743', bg: 'rgba(202,145,28,.16)', route: '/shop-change-requests' },
  ];

  return (
    <main className="min-h-screen px-5 pb-12 pt-8 sm:px-8 sm:pt-12" style={{ background: colors.bg }}>
      <div className="mx-auto w-full max-w-[820px]">
        <div className="mb-8 flex items-center justify-between gap-4">
          <h1 className="text-3xl font-extrabold sm:text-4xl" style={{ color: colors.text }}>Профиль</h1>
          <button
            type="button"
            onClick={() => { setError(''); setIsEditing(value => !value); }}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm font-bold transition-opacity hover:opacity-80"
            style={{ borderColor: colors.border, background: colors.surface, color: colors.text }}
          >
            <PencilSimple size={18} />
            {isEditing ? 'Отмена' : 'Редактировать'}
          </button>
        </div>

        {error && <div className="mb-5 rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: 'rgba(239,68,68,.45)', background: colors.surface, color: '#EF4444' }}>{error}</div>}

        <section className="grid grid-cols-[104px_1fr] gap-5 sm:grid-cols-[156px_1fr] sm:gap-8">
          <div className="h-[104px] w-[104px] sm:h-[156px] sm:w-[156px]">
            <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border" style={{ borderColor: colors.border, background: `${colors.gold}18` }}>
              {profile.avatarUrl
                ? <img src={profile.avatarUrl} alt={profile.userName} className="h-full w-full object-cover" />
                : <span className="text-4xl font-extrabold" style={{ color: colors.gold }}>{initial}</span>}
            </div>
          </div>

          <div className="min-w-0 pt-1 sm:pt-3">
            <h2 className="truncate text-2xl font-extrabold sm:text-3xl" style={{ color: colors.text }}>{profile.userName}</h2>
            <p className="mt-1 truncate text-sm sm:text-lg" style={{ color: colors.muted }}>{profile.email}</p>
            <div className="mt-5 grid grid-cols-3 gap-3">
              <ProfileStat value={profile.reviewCount ?? 0} label="Отзывы" text={colors.text} muted={colors.muted} />
              <ProfileStat value={profile.checkInCount ?? 0} label="Чекины" text={colors.text} muted={colors.muted} />
              <ProfileStat value={profile.addedShopsCount ?? favoriteIds.size} label="Кофейни" text={colors.text} muted={colors.muted} />
            </div>
          </div>
        </section>

        {!isEditing && profile.about && <p className="mt-7 text-base leading-relaxed sm:text-lg" style={{ color: colors.muted }}>{profile.about}</p>}

        {isEditing && (
          <ProfileEditor
            profile={profile}
            colors={colors}
            onCancel={() => setIsEditing(false)}
            onError={setError}
            onSaved={next => {
              setProfile(next);
              updateUserProfile(next);
              setIsEditing(false);
              setError('');
            }}
          />
        )}

        <p className="mb-3 mt-8 text-sm font-medium uppercase tracking-wider" style={{ color: colors.muted }}>Моя активность</p>
        <section className="overflow-hidden rounded-[28px] border" style={{ borderColor: colors.border, background: colors.surface }}>
          {activities.map(({ title, subtitle, Icon, color, bg, route }, index) => (
            <button
              key={title}
              type="button"
              onClick={() => navigate(route)}
              className="flex w-full items-center gap-4 px-4 py-5 text-left transition-opacity hover:opacity-80 sm:px-6"
              style={{ borderTop: index ? `1px solid ${colors.border}` : undefined }}
            >
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl" style={{ background: bg, color }}><Icon size={28} /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-lg font-medium sm:text-xl" style={{ color: colors.text }}>{title}</span>
                <span className="mt-0.5 block text-sm leading-snug" style={{ color: colors.muted }}>{subtitle}</span>
              </span>
              <CaretRight size={25} color={colors.muted} />
            </button>
          ))}
        </section>

        <button
          type="button"
          onClick={() => { void logout().then(() => navigate('/')); }}
          className="mt-6 flex min-h-14 w-full items-center justify-center gap-3 rounded-full text-lg font-bold"
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
    <strong className="block text-xl sm:text-2xl" style={{ color: text }}>{value}</strong>
    <span className="text-xs sm:text-base" style={{ color: muted }}>{label}</span>
  </div>
);

type ProfileColors = { bg: string; surface: string; border: string; text: string; muted: string; gold: string };

const ProfileEditor: React.FC<{
  profile: UserProfile;
  colors: ProfileColors;
  onSaved: (profile: UserProfile) => void;
  onCancel: () => void;
  onError: (message: string) => void;
}> = ({ profile, colors, onSaved, onCancel, onError }) => {
  const [userName, setUserName] = useState(profile.userName);
  const [email, setEmail] = useState(profile.email);
  const [about, setAbout] = useState(profile.about ?? '');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const save = async () => {
    if (!userName.trim() || !/^\S+@\S+\.\S+$/.test(email)) return onError('Проверьте имя и email');
    if (avatar && (!avatar.type.startsWith('image/') || avatar.size > 5 * 1024 * 1024)) return onError('Выберите изображение размером до 5 МБ');
    setIsSaving(true);
    try {
      const updates: Promise<unknown>[] = [];
      if (userName.trim() !== profile.userName) updates.push(updateUsername({ username: userName.trim() }));
      if (email.trim() !== profile.email) updates.push(updateEmail({ email: email.trim() }));
      if (about.trim() !== (profile.about ?? '')) updates.push(updateAbout({ about: about.trim() }));
      if (avatar) {
        const upload = await getAvatarUploadUrl({ fileName: avatar.name, contentType: avatar.type, sizeBytes: avatar.size });
        if (!upload.data) throw new Error('Не удалось подготовить загрузку фотографии');
        const response = await fetch(upload.data.uploadUrl, { method: 'PUT', headers: { 'Content-Type': avatar.type }, body: avatar });
        if (!response.ok) throw new Error('Не удалось загрузить фотографию');
        updates.push(updateAvatar({ uploadedPhoto: { fileName: avatar.name, contentType: avatar.type, storageKey: upload.data.storageKey, size: avatar.size } }));
      }
      await Promise.all(updates);
      onSaved((await getProfile()).data);
    } catch (cause) {
      onError(getErrorMessage(cause));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="mt-7 space-y-3 rounded-[28px] border p-5 sm:p-6" style={{ borderColor: colors.border, background: colors.surface }}>
      <input value={userName} onChange={event => setUserName(event.target.value)} placeholder="Имя" style={profileInputStyle(colors)} />
      <input type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="Email" style={profileInputStyle(colors)} />
      <textarea value={about} onChange={event => setAbout(event.target.value)} placeholder="О себе" rows={3} style={{ ...profileInputStyle(colors), paddingTop: 12, resize: 'vertical' }} />
      <label className="block text-sm" style={{ color: colors.muted }}>
        Фотография профиля
        <input type="file" accept="image/*" onChange={event => setAvatar(event.target.files?.[0] ?? null)} className="mt-2 block w-full text-sm" />
      </label>
      <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} disabled={isSaving} className="min-h-11 rounded-xl border px-5 font-bold" style={{ borderColor: colors.border, color: colors.text }}>Отмена</button>
        <button type="button" onClick={() => { void save(); }} disabled={isSaving} className="min-h-11 rounded-xl px-5 font-bold disabled:opacity-60" style={{ background: colors.gold, color: '#1A1412' }}>{isSaving ? 'Сохраняем…' : 'Сохранить'}</button>
      </div>
    </section>
  );
};

const profileInputStyle = (colors: ProfileColors): React.CSSProperties => ({
  width: '100%', minHeight: 46, borderRadius: 12, border: `1px solid ${colors.border}`,
  background: colors.bg, color: colors.text, padding: '0 14px', outline: 'none',
});

export default ProfilePage;
