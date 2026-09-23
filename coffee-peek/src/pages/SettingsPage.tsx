import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  changePassword, deleteUser, getProfile,
  type UserProfile,
} from '../api/auth';
import { getCities, type City } from '../api/coffeeshop';
import WobbleRing from '../components/WobbleRing';
import { useTheme } from '../contexts/ThemeContext';
import { useLocalCity } from '../hooks/useLocalCity';
import { usePageTitle } from '../hooks/usePageTitle';
import { getErrorMessage, getPasswordErrorMessage } from '../utils/errorHandler';
import { logger } from '../utils/logger';
import {
  CaretRight, DeviceMobile, Factory, Gear, Lock, MapPin, Moon, Plus,
  ShareNetwork, ShieldCheck, Sun, WarningCircle,
} from '@phosphor-icons/react';

type OpenPanel = 'password' | null;
type Colors = { bg: string; surface: string; border: string; text: string; muted: string; gold: string };

const SettingsPage: React.FC = () => {
  usePageTitle('Настройки');
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { cityId, setCityId } = useLocalCity();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([getProfile(), getCities()])
      .then(([profileResponse, citiesResponse]) => {
        setProfile(profileResponse.data);
        const raw = citiesResponse.data as unknown;
        const list = Array.isArray(raw) ? raw : ((raw as { cities?: City[] })?.cities ?? []);
        setCities(list);
        if (!cityId && list[0]) setCityId(list[0].id);
      })
      .catch(cause => {
        logger.error('Error loading settings:', cause);
        setError(getErrorMessage(cause));
      })
      .finally(() => setIsLoading(false));
  }, [cityId, setCityId]);

  const isDark = theme === 'dark';
  const colors: Colors = {
    bg: isDark ? '#171210' : '#F5F4F2', surface: isDark ? '#2B211C' : '#FFFFFF',
    border: isDark ? '#46362F' : '#E7E5E4', text: isDark ? '#FFFFFF' : '#1C1917',
    muted: isDark ? '#A39E93' : '#78716C', gold: '#EAB308',
  };

  const showMessage = (value: string) => {
    setError('');
    setMessage(value);
    window.setTimeout(() => setMessage(''), 3500);
  };

  const shareApp = async () => {
    const data = { title: 'CoffeePeek', text: 'Находите лучшие кофейни в CoffeePeek', url: window.location.origin };
    try {
      if (navigator.share) await navigator.share(data);
      else {
        await navigator.clipboard.writeText(data.url);
        showMessage('Ссылка скопирована');
      }
    } catch (cause) {
      if ((cause as DOMException).name !== 'AbortError') setError('Не удалось поделиться ссылкой');
    }
  };

  if (isLoading) {
    return <div className="flex min-h-[70vh] items-center justify-center" style={{ background: colors.bg }}><WobbleRing size={48} /></div>;
  }

  return (
    <main className="min-h-screen px-5 pb-12 pt-8 sm:px-8 sm:pt-12" style={{ background: colors.bg }}>
      <div className="mx-auto w-full max-w-[820px]">
        <h1 className="mb-9 text-3xl font-extrabold sm:text-4xl" style={{ color: colors.text }}>Настройки</h1>

        {(message || error) && <div className="mb-5 rounded-2xl border px-4 py-3 text-sm" style={{ borderColor: error ? 'rgba(239,68,68,.45)' : colors.border, color: error ? '#EF4444' : colors.text, background: colors.surface }}>{error || message}</div>}

        <SettingsSection title="Добавить" colors={colors}>
          <SettingsRow title="Добавить кофейню" subtitle="Предложить новое место для CoffeePeek" Icon={Plus} color="#D8A743" iconBg="rgba(202,145,28,.16)" colors={colors} onClick={() => navigate('/coffee-shops/new')} />
          <SettingsRow title="Добавить обжарщика" subtitle="Помогите сообществу открыть новых обжарщиков" Icon={Factory} color="#74C98B" iconBg="rgba(65,158,88,.18)" colors={colors} onClick={() => navigate('/roasters/new')} />
        </SettingsSection>

        <SettingsSection title="Аккаунт" colors={colors}>
          <SettingsRow title="Сменить пароль" subtitle="Обновить пароль для входа в аккаунт" Icon={Lock} color="#79D2B2" iconBg="rgba(27,155,111,.16)" colors={colors} onClick={() => setOpenPanel(openPanel === 'password' ? null : 'password')} />
          {openPanel === 'password' && <PasswordEditor colors={colors} onSaved={() => { setOpenPanel(null); showMessage('Пароль изменён'); }} onError={setError} />}
        </SettingsSection>

        <SettingsSection title="Настройки" colors={colors}>
          <SettingsRow title="Город" subtitle="Определяет, какие кофейни показывать в первую очередь" Icon={MapPin} color="#71D5D0" iconBg="rgba(38,170,166,.17)" colors={colors}>
            <select aria-label="Город" value={cityId} onChange={event => setCityId(event.target.value)} className="max-w-[145px] cursor-pointer bg-transparent text-right text-base outline-none" style={{ color: colors.muted }}>
              {cities.map(city => <option key={city.id} value={city.id}>{city.name}</option>)}
            </select>
          </SettingsRow>
          <SettingsRow title="Внешний вид" subtitle="Выберите тему оформления" Icon={Gear} color="#C594E8" iconBg="rgba(151,85,205,.17)" colors={colors}>
            <div className="flex rounded-xl border p-1" style={{ borderColor: colors.border, background: colors.bg }} role="group" aria-label="Тема оформления">
              <ThemeButton active={theme === 'light'} label="Светлая" Icon={Sun} onClick={() => setTheme('light')} colors={colors} />
              <ThemeButton active={theme === 'dark'} label="Тёмная" Icon={Moon} onClick={() => setTheme('dark')} colors={colors} />
            </div>
          </SettingsRow>
        </SettingsSection>

        <SettingsSection title="Приложение" colors={colors}>
          <SettingsRow title="Скачать приложение" subtitle="Версия CoffeePeek для вашего телефона" Icon={DeviceMobile} color="#7CC4E8" iconBg="rgba(56,153,211,.16)" colors={colors} onClick={() => navigate('/download')} />
        </SettingsSection>

        <SettingsSection title="Другое" description="Документы, распространение приложения и управление аккаунтом" colors={colors}>
          <SettingsRow title="Условия использования" Icon={ShieldCheck} color="#79D2B2" iconBg="rgba(27,155,111,.16)" colors={colors} onClick={() => navigate('/terms')} />
          <SettingsRow title="Политика конфиденциальности" Icon={Lock} color="#79D2B2" iconBg="rgba(27,155,111,.16)" colors={colors} onClick={() => navigate('/privacy')} />
          <SettingsRow title="Поделиться" Icon={ShareNetwork} color="#6CCBE4" iconBg="rgba(32,163,193,.17)" colors={colors} onClick={() => { void shareApp(); }} />
          <DeleteAccountRow colors={colors} email={profile?.email} onError={setError} />
        </SettingsSection>
      </div>
    </main>
  );
};

const SettingsSection: React.FC<{ title: string; description?: string; colors: Colors; children: React.ReactNode }> = ({ title, description, colors, children }) => (
  <section className="mb-8">
    <h2 className="mb-3 text-sm font-medium uppercase tracking-wider" style={{ color: colors.muted }}>{title}</h2>
    {description && <p className="-mt-1 mb-4 text-sm leading-relaxed" style={{ color: colors.muted }}>{description}</p>}
    <div className="overflow-hidden rounded-[28px] border [&>*+*]:border-t [&>*+*]:border-[var(--settings-border)]" style={{ borderColor: colors.border, background: colors.surface, '--settings-border': colors.border } as React.CSSProperties}>{children}</div>
  </section>
);

interface SettingsRowProps {
  title: string; subtitle?: string; Icon: React.ComponentType<{ size?: number; weight?: 'regular' | 'bold' }>;
  color: string; iconBg: string; colors: Colors; onClick?: () => void; children?: React.ReactNode;
}

const SettingsRow: React.FC<SettingsRowProps> = ({ title, subtitle, Icon, color, iconBg, colors, onClick, children }) => {
  const content = <><span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl" style={{ color, background: iconBg }}><Icon size={28} /></span><span className="min-w-0 flex-1"><span className="block text-lg font-medium sm:text-xl" style={{ color: colors.text }}>{title}</span>{subtitle && <span className="mt-0.5 block text-sm leading-snug" style={{ color: colors.muted }}>{subtitle}</span>}</span>{children ?? (onClick && <CaretRight size={25} color={colors.muted} />)}</>;
  return onClick
    ? <button type="button" onClick={onClick} className="flex w-full items-center gap-4 px-4 py-5 text-left transition-opacity hover:opacity-80 sm:px-6">{content}</button>
    : <div className="flex w-full items-center gap-4 px-4 py-5 sm:px-6">{content}</div>;
};

const ThemeButton: React.FC<{ active: boolean; label: string; Icon: React.ComponentType<{ size?: number }>; onClick: () => void; colors: Colors }> = ({ active, label, Icon, onClick, colors }) => (
  <button type="button" aria-pressed={active} onClick={onClick} className="flex min-h-9 items-center gap-1 rounded-lg px-2.5 text-xs font-bold" style={{ background: active ? colors.gold : 'transparent', color: active ? '#1A1412' : colors.muted }}><Icon size={14} /><span className="hidden sm:inline">{label}</span></button>
);

const PasswordEditor: React.FC<{ colors: Colors; onSaved: () => void; onError: (message: string) => void }> = ({ colors, onSaved, onError }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const save = async () => {
    if (newPassword.length < 8) return onError('Новый пароль должен содержать минимум 8 символов');
    if (newPassword !== confirmation) return onError('Пароли не совпадают');
    setIsSaving(true);
    try { await changePassword({ currentPassword, newPassword }); onSaved(); }
    catch (cause) { onError(getPasswordErrorMessage(cause) ?? getErrorMessage(cause)); }
    finally { setIsSaving(false); }
  };
  return <div className="space-y-3 border-t px-4 py-5 sm:px-6" style={{ borderColor: colors.border, background: colors.bg }}>
    <input type="password" autoComplete="current-password" value={currentPassword} onChange={event => setCurrentPassword(event.target.value)} placeholder="Текущий пароль" style={inputStyle(colors)} />
    <input type="password" autoComplete="new-password" value={newPassword} onChange={event => setNewPassword(event.target.value)} placeholder="Новый пароль" style={inputStyle(colors)} />
    <input type="password" autoComplete="new-password" value={confirmation} onChange={event => setConfirmation(event.target.value)} placeholder="Повторите новый пароль" style={inputStyle(colors)} />
    <button type="button" disabled={isSaving || !currentPassword} onClick={() => { void save(); }} className="min-h-11 w-full rounded-xl px-4 font-bold disabled:opacity-60" style={{ background: colors.gold, color: '#1A1412' }}>{isSaving ? 'Сохраняем…' : 'Изменить пароль'}</button>
  </div>;
};

const DeleteAccountRow: React.FC<{ colors: Colors; email?: string; onError: (message: string) => void }> = ({ colors, email, onError }) => {
  const [confirming, setConfirming] = useState(false);
  const [sent, setSent] = useState(false);
  const remove = async () => { try { await deleteUser(); setSent(true); } catch (cause) { onError(getErrorMessage(cause)); } };
  if (sent) return <div className="px-5 py-5 text-sm leading-relaxed" style={{ color: colors.muted }}>Ссылка для подтверждения удаления отправлена{email ? ` на ${email}` : ''}.</div>;
  return <div className="flex items-center gap-4 px-4 py-5 sm:px-6"><span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-red-400" style={{ background: 'rgba(239,68,68,.14)' }}><WarningCircle size={28} /></span><span className="min-w-0 flex-1"><span className="block text-lg font-medium sm:text-xl" style={{ color: colors.text }}>Удалить аккаунт</span><span className="mt-0.5 block text-sm" style={{ color: colors.muted }}>{confirming ? 'Подтвердите отправку письма' : 'Удаление подтверждается по email'}</span></span><button type="button" onClick={() => confirming ? void remove() : setConfirming(true)} className="rounded-xl border px-3 py-2 text-sm font-bold" style={{ borderColor: 'rgba(239,68,68,.35)', color: '#EF4444' }}>{confirming ? 'Подтвердить' : 'Удалить'}</button></div>;
};

const inputStyle = (colors: Colors): React.CSSProperties => ({ width: '100%', minHeight: 46, borderRadius: 12, border: `1px solid ${colors.border}`, background: colors.surface, color: colors.text, padding: '0 14px', outline: 'none' });

export default SettingsPage;
