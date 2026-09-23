import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProfile, type UserProfile } from '../api/auth';
import WobbleRing from '../components/WobbleRing';
import { useLocalFavorites } from '../hooks/useLocalFavorites';
import { usePageTitle } from '../hooks/usePageTitle';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { logger } from '../utils/logger';
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
  const { logout } = useUser();
  const { favoriteIds } = useLocalFavorites();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getProfile()
      .then(response => { if (!cancelled) setProfile(response.data); })
      .catch(error => logger.error('Error loading profile:', error))
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const isDark = theme === 'dark';
  const colors = {
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
        <h1 className="mb-8 text-3xl font-extrabold sm:text-4xl" style={{ color: colors.text }}>Профиль</h1>

        <section className="grid grid-cols-[104px_1fr] gap-5 sm:grid-cols-[156px_1fr] sm:gap-8">
          <div className="relative h-[104px] w-[104px] sm:h-[156px] sm:w-[156px]">
            <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border" style={{ borderColor: colors.border, background: `${colors.gold}18` }}>
              {profile.avatarUrl
                ? <img src={profile.avatarUrl} alt={profile.userName} className="h-full w-full object-cover" />
                : <span className="text-4xl font-extrabold" style={{ color: colors.gold }}>{initial}</span>}
            </div>
            <button
              type="button"
              aria-label="Редактировать профиль"
              onClick={() => navigate('/settings?edit=profile')}
              className="absolute -bottom-2 -right-2 flex h-11 w-11 items-center justify-center rounded-full border sm:h-12 sm:w-12"
              style={{ background: colors.surface, borderColor: colors.border, color: colors.text }}
            >
              <PencilSimple size={22} />
            </button>
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

        {profile.about && <p className="mt-7 text-base leading-relaxed sm:text-lg" style={{ color: colors.muted }}>{profile.about}</p>}

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

export default ProfilePage;
