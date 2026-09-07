import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { getThemeColors } from '../../design-system';
import type { MobilePlatformRelease } from '../../api/mobileApp';
import type { MobileAppDownloadVariant } from './MobileAppDownload';

type ThemeColors = ReturnType<typeof getThemeColors>;

interface AndroidDownloadCardProps {
  release: MobilePlatformRelease;
  variant: MobileAppDownloadVariant;
  isDark: boolean;
  c: ThemeColors;
}

const AndroidDownloadCard: React.FC<AndroidDownloadCardProps> = ({ release, variant, isDark, c }) => {
  const { downloadUrl, badgeUrl, badgeVerticalUrl } = release;
  if (!downloadUrl) return null;

  if (variant === 'compact') {
    return (
      <div
        className="flex-1 min-w-0 rounded-2xl border p-4 flex items-center gap-4"
        style={{ borderColor: c.border, background: isDark ? 'rgba(255,255,255,0.03)' : '#F9F8F7' }}
      >
        <a
          href={downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Отсканируйте, чтобы скачать CoffeePeek для Android"
          className="shrink-0 rounded-xl bg-white p-1.5 flex items-center justify-center"
        >
          <QRCodeSVG value={downloadUrl} size={56} />
        </a>
        <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="min-w-0">
          {badgeUrl && (
            <img
              src={badgeUrl}
              alt="Скачать CoffeePeek для Android"
              className="h-9 w-auto max-w-[160px] object-contain"
            />
          )}
        </a>
      </div>
    );
  }

  return (
    <div
      className="flex-1 rounded-[18px] lg:rounded-[24px] p-5 lg:p-8 border flex flex-col sm:flex-row items-center gap-5 lg:gap-8"
      style={{ borderColor: c.border, background: isDark ? 'rgba(45,36,31,0.55)' : 'rgba(255,255,255,0.72)' }}
    >
      <div className="shrink-0 flex flex-col items-center gap-2">
        <a
          href={downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Отсканируйте, чтобы скачать CoffeePeek для Android"
          className="rounded-2xl bg-white p-3 flex items-center justify-center"
        >
          <QRCodeSVG value={downloadUrl} size={104} />
        </a>
        <span className="font-body text-[11px]" style={{ color: c.textTertiary }}>Сканируйте для установки</span>
      </div>

      <div className="text-center sm:text-left flex-1 min-w-0">
        <span className="font-body font-bold text-[10px] lg:text-[11px] uppercase tracking-[.08em] text-[#EAB308]">Android бета</span>
        <h3 className="mt-1 font-extended font-bold text-[20px] lg:text-[26px] tracking-[-0.02em]" style={{ color: c.textPrimary }}>
          CoffeePeek для Android
        </h3>
        <p className="mt-2 font-body text-[13px] lg:text-[14px] leading-[1.5]" style={{ color: c.textSecondary }}>
          Доступно для тестирования. Отсканируйте QR-код или нажмите на кнопку, чтобы установить.
        </p>
        <a
          href={downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Скачать CoffeePeek для Android"
          className="inline-block mt-4"
        >
          {badgeVerticalUrl && (
            <img src={badgeVerticalUrl} alt="Скачать CoffeePeek для Android" className="h-[72px] w-auto object-contain" />
          )}
        </a>
      </div>
    </div>
  );
};

export default AndroidDownloadCard;
