import { API_ENDPOINTS } from './core/apiConfig';
import { httpClient } from './core/httpClient';

export type MobilePlatform = 'android' | 'ios';
export type MobilePlatformStatus = 'available' | 'coming_soon';

export interface MobilePlatformRelease {
  platform: MobilePlatform;
  status: MobilePlatformStatus;
  downloadUrl?: string;
  badgeUrl?: string;
  badgeVerticalUrl?: string;
}

export interface AppDownloadChannel {
  available: boolean;
  url?: string | null;
}

export interface ApkDownloadChannel extends AppDownloadChannel {
  version?: string | null;
  versionCode?: number | null;
  fileName?: string | null;
  fileSize?: number | null;
  fileSizeBytes?: number | null;
  releasedAt?: string | null;
  sha256?: string | null;
}

export interface AppDownloadsConfig {
  android: {
    googlePlay: AppDownloadChannel;
    apk: ApkDownloadChannel;
  };
  ios: {
    appStore: AppDownloadChannel;
  };
}

function readRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {};
}

function bool(value: unknown): boolean {
  return value === true || value === 'true' || value === 'True' || value === 1;
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function num(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

function channel(raw: Record<string, unknown>): AppDownloadChannel {
  return {
    available: bool(raw.available ?? raw.Available ?? raw.enabled ?? raw.Enabled),
    url: str(raw.url ?? raw.Url),
  };
}

function apkChannel(raw: Record<string, unknown>): ApkDownloadChannel {
  return {
    ...channel(raw),
    version: str(raw.version ?? raw.Version),
    versionCode: num(raw.versionCode ?? raw.VersionCode),
    fileName: str(raw.fileName ?? raw.FileName),
    fileSize: num(raw.fileSize ?? raw.FileSize),
    fileSizeBytes: num(raw.fileSizeBytes ?? raw.FileSizeBytes ?? raw.sizeBytes ?? raw.SizeBytes),
    releasedAt: str(raw.releasedAt ?? raw.ReleasedAt ?? raw.releasedAtUtc ?? raw.ReleasedAtUtc),
    sha256: str(raw.sha256 ?? raw.Sha256 ?? raw.sha256Hash ?? raw.Sha256Hash),
  };
}

export function normalizeAppDownloadsConfig(raw: unknown): AppDownloadsConfig {
  const response = readRecord(raw);
  const root = readRecord(response.data ?? response.Data ?? raw);
  const android = readRecord(root.android ?? root.Android);
  const ios = readRecord(root.ios ?? root.Ios ?? root.iOS ?? root.IOS);

  return {
    android: {
      googlePlay: channel(readRecord(android.googlePlay ?? android.GooglePlay)),
      apk: apkChannel(readRecord(android.apk ?? android.Apk ?? android.APK)),
    },
    ios: {
      appStore: channel(readRecord(ios.appStore ?? ios.AppStore)),
    },
  };
}

export async function getMobileAppDownloads(): Promise<AppDownloadsConfig> {
  const response = await httpClient.get<AppDownloadsConfig>(API_ENDPOINTS.PUBLIC.APP_DOWNLOADS, {
    requiresAuth: false,
  });
  return normalizeAppDownloadsConfig(response.data);
}
