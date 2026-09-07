import React, { useState } from 'react';
import { DeviceMobile } from '../Icon';
import { getThemeColors } from '../../design-system';
import type { MobilePlatformRelease } from '../../api/mobileApp';
import type { MobileAppDownloadVariant } from './MobileAppDownload';

type ThemeColors = ReturnType<typeof getThemeColors>;

interface IOSComingSoonCardProps {
  release: MobilePlatformRelease;
  variant: MobileAppDownloadVariant;
  isDark: boolean;
  c: ThemeColors;
}

// Renders the official App Store artwork once release.badgeUrl resolves to a real
// image; falls back to a plain wordmark placeholder if it 404s (asset not added yet).
const AppStoreBadge: React.FC<{ badgeUrl?: string; height: number }> = ({ badgeUrl, height }) => {
  const [failed, setFailed] = useState(false);

  if (!badgeUrl || failed) {
    return (
      <span
        className="inline-flex items-center font-extended font-bold tracking-[-0.01em] opacity-60"
        style={{ height, fontSize: height * 0.32 }}
        aria-hidden="true"
      >
        App Store
      </span>
    );
  }

  return (
    <img
      src={badgeUrl}
      alt="CoffeePeek скоро в App Store"
      onError={() => setFailed(true)}
      style={{ height }}
      className="w-auto object-contain"
    />
  );
};

const IOSComingSoonCard: React.FC<IOSComingSoonCardProps> = ({ variant, isDark, c, release }) => {
  const mutedBg = isDark ? 'rgba(255,255,255,0.03)' : '#F9F8F7';

  if (variant === 'compact') {
    return (
      <div
        className="flex-1 min-w-0 rounded-2xl border p-4 flex items-center gap-3"
        style={{ borderColor: c.borderSubtle, background: mutedBg }}
      >
        <DeviceMobile size={20} color={c.textTertiary} aria-hidden />
        <span className="font-body font-semibold text-[12px] truncate" style={{ color: c.textSecondary }}>
          CoffeePeek для iOS · Скоро
        </span>
      </div>
    );
  }

  return (
    <div
      className="flex-1 rounded-[18px] lg:rounded-[24px] p-5 lg:p-8 border flex flex-col sm:flex-row items-center gap-5 lg:gap-8"
      style={{ borderColor: c.borderSubtle, background: mutedBg }}
    >
      <div
        className="shrink-0 w-24 h-24 lg:w-28 lg:h-28 rounded-2xl flex items-center justify-center"
        style={{ background: isDark ? 'rgba(255,255,255,0.04)' : '#F3F1EE' }}
        aria-hidden="true"
      >
        <DeviceMobile size={40} color={c.textTertiary} />
      </div>

      <div className="text-center sm:text-left flex-1 min-w-0">
        <span
          className="font-body font-bold text-[10px] lg:text-[11px] uppercase tracking-[.08em] rounded-full px-2 py-0.5"
          style={{ color: '#EAB308', background: isDark ? 'rgba(234,179,8,0.12)' : 'rgba(234,179,8,0.1)' }}
        >
          Скоро
        </span>
        <h3 className="mt-2 font-extended font-bold text-[20px] lg:text-[26px] tracking-[-0.02em]" style={{ color: c.textPrimary }}>
          CoffeePeek для iOS
        </h3>
        <p className="mt-2 font-body text-[13px] lg:text-[14px] leading-[1.5]" style={{ color: c.textSecondary }}>
          Приложение для iOS в разработке и скоро появится в App Store.
        </p>
        <div className="mt-4 inline-block" aria-label="CoffeePeek скоро в App Store">
          <AppStoreBadge badgeUrl={release.badgeUrl} height={44} />
        </div>
      </div>
    </div>
  );
};

export default IOSComingSoonCard;
