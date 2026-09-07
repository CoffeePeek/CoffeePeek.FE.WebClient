import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { getThemeColors } from '../../design-system';
import { useMobileAppDownloads } from '../../hooks/queries/useMobileAppDownloads';
import Shimmer from '../skeletons/Shimmer';
import { AppIcon } from '../icons';

export type MobileAppDownloadVariant = 'full' | 'compact';

interface MobileAppDownloadProps {
  variant?: MobileAppDownloadVariant;
  className?: string;
}

const MobileAppDownload: React.FC<MobileAppDownloadProps> = ({ variant = 'full', className = '' }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const c = getThemeColors(theme);
  const { data, isLoading, isError } = useMobileAppDownloads();

  if (isLoading) {
    return <Shimmer height={variant === 'full' ? 176 : 88} className={`rounded-2xl ${className}`} />;
  }

  if (isError || !data) return null;

  const channels = [
    {
      key: 'google-play',
      label: 'Скачать в Google Play',
      href: '/download/android',
      available: data.android.googlePlay.available && Boolean(data.android.googlePlay.url),
      icon: 'public',
    },
    {
      key: 'apk',
      label: 'Скачать APK',
      href: '/download/apk',
      available: data.android.apk.available && Boolean(data.android.apk.url),
      icon: 'check_circle',
    },
    {
      key: 'app-store',
      label: 'Скачать в App Store',
      href: '/download/ios',
      available: data.ios.appStore.available && Boolean(data.ios.appStore.url),
      icon: 'call',
    },
  ].filter((channel) => channel.available);

  if (!channels.length) return null;

  return (
    <div
      className={`rounded-[18px] border p-4 ${variant === 'full' ? 'lg:p-6' : ''} ${className}`}
      style={{ borderColor: c.border, background: isDark ? 'rgba(45,36,31,0.55)' : 'rgba(255,255,255,0.72)' }}
    >
      {variant === 'full' && (
        <div className="mb-4">
          <h3 className="font-extended font-bold text-[20px] tracking-[-0.01em]" style={{ color: c.textPrimary }}>
            CoffeePeek в телефоне
          </h3>
          <p className="mt-1 font-body text-sm" style={{ color: c.textSecondary }}>
            Выберите удобный способ установки.
          </p>
        </div>
      )}
      <div className={`flex flex-col ${variant === 'full' ? 'sm:flex-row' : ''} gap-2`}>
        {channels.map((channel) => (
          <a
            key={channel.key}
            href={channel.href}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-[#EAB308] px-4 py-2.5 font-extended text-sm font-bold text-[#1A1412] transition-opacity hover:opacity-90"
          >
            <AppIcon name={channel.icon} size={18} color="currentColor" />
            {channel.label}
          </a>
        ))}
      </div>
    </div>
  );
};

export default MobileAppDownload;
