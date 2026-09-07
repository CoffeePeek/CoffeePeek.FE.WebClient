import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { getThemeColors } from '../../design-system';
import { useMobileAppDownloads } from '../../hooks/queries/useMobileAppDownloads';
import Shimmer from '../skeletons/Shimmer';
import AndroidDownloadCard from './AndroidDownloadCard';
import IOSComingSoonCard from './IOSComingSoonCard';

export type MobileAppDownloadVariant = 'full' | 'compact';

interface MobileAppDownloadProps {
  variant?: MobileAppDownloadVariant;
  className?: string;
}

const MobileAppDownload: React.FC<MobileAppDownloadProps> = ({ variant = 'full', className = '' }) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const c = getThemeColors(theme);
  const { data: releases, isLoading } = useMobileAppDownloads();

  if (isLoading) {
    return <Shimmer height={variant === 'full' ? 176 : 88} className={`rounded-2xl ${className}`} />;
  }

  const android = releases?.find((r) => r.platform === 'android');
  const ios = releases?.find((r) => r.platform === 'ios');

  if (!android && !ios) {
    // ponytail: mock data can't fail; keeps the widget silent instead of a page-level error if it ever does
    return null;
  }

  return (
    <div className={`flex flex-col ${variant === 'full' ? 'lg:flex-row' : 'sm:flex-row'} gap-4 ${className}`}>
      {android && <AndroidDownloadCard release={android} variant={variant} isDark={isDark} c={c} />}
      {ios && <IOSComingSoonCard release={ios} variant={variant} isDark={isDark} c={c} />}
    </div>
  );
};

export default MobileAppDownload;
