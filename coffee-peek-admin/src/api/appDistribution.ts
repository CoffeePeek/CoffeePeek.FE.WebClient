import { API_ENDPOINTS } from './core/apiConfig';
import { httpClient } from './core/httpClient';
import type { ApiResponse } from './core/types';

export interface AdminDownloadChannel {
  available: boolean;
  url: string | null;
}

export interface AdminApkChannel extends AdminDownloadChannel {
  version: string | null;
  versionCode: number | null;
  fileName: string | null;
  fileSize: number | null;
  fileSizeBytes: number | null;
  releasedAt: string | null;
  sha256: string | null;
  releaseId: string | null;
}

export interface AdminAppDownloadsConfig {
  android: {
    googlePlay: AdminDownloadChannel;
    apk: AdminApkChannel;
  };
  ios: {
    appStore: AdminDownloadChannel;
  };
}

export interface AndroidAppRelease {
  id: string;
  version: string;
  versionCode: number;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  sha256: string | null;
  releasedAt: string;
  isActive: boolean;
}

export interface StoreChannelUpdateRequest {
  url: string | null;
  enabled: boolean;
}

export interface CreateAndroidReleaseRequest {
  version: string;
  versionCode: number;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  sha256?: string | null;
  releasedAt: string;
}

function record(value: unknown): Record<string, unknown> {
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

function channel(raw: Record<string, unknown>): AdminDownloadChannel {
  return {
    available: bool(raw.available ?? raw.Available ?? raw.enabled ?? raw.Enabled),
    url: str(raw.url ?? raw.Url),
  };
}

function apkChannel(raw: Record<string, unknown>): AdminApkChannel {
  return {
    ...channel(raw),
    version: str(raw.version ?? raw.Version),
    versionCode: num(raw.versionCode ?? raw.VersionCode),
    fileName: str(raw.fileName ?? raw.FileName),
    fileSize: num(raw.fileSize ?? raw.FileSize),
    fileSizeBytes: num(raw.fileSizeBytes ?? raw.FileSizeBytes ?? raw.sizeBytes ?? raw.SizeBytes),
    releasedAt: str(raw.releasedAt ?? raw.ReleasedAt ?? raw.releasedAtUtc ?? raw.ReleasedAtUtc),
    sha256: str(raw.sha256 ?? raw.Sha256 ?? raw.sha256Hash ?? raw.Sha256Hash),
    releaseId: str(raw.releaseId ?? raw.ReleaseId ?? raw.id ?? raw.Id),
  };
}

function normalizeConfig(raw: unknown): AdminAppDownloadsConfig {
  const root = record(raw);
  const android = record(root.android ?? root.Android);
  const ios = record(root.ios ?? root.Ios ?? root.iOS ?? root.IOS);
  return {
    android: {
      googlePlay: channel(record(android.googlePlay ?? android.GooglePlay)),
      apk: apkChannel(record(android.apk ?? android.Apk ?? android.APK)),
    },
    ios: {
      appStore: channel(record(ios.appStore ?? ios.AppStore)),
    },
  };
}

function normalizeRelease(raw: unknown): AndroidAppRelease {
  const row = record(raw);
  return {
    id: String(row.id ?? row.Id ?? ''),
    version: String(row.version ?? row.Version ?? ''),
    versionCode: Number(row.versionCode ?? row.VersionCode ?? 0),
    fileUrl: String(row.fileUrl ?? row.FileUrl ?? row.url ?? row.Url ?? ''),
    fileName: String(row.fileName ?? row.FileName ?? ''),
    fileSize: Number(row.fileSize ?? row.FileSize ?? row.fileSizeBytes ?? row.FileSizeBytes ?? 0),
    sha256: str(row.sha256 ?? row.Sha256 ?? row.sha256Hash ?? row.Sha256Hash),
    releasedAt: String(row.releasedAt ?? row.ReleasedAt ?? row.releasedAtUtc ?? row.ReleasedAtUtc ?? ''),
    isActive: bool(row.isActive ?? row.IsActive ?? row.active ?? row.Active),
  };
}

function unwrapList(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  const root = record(raw);
  const candidates = [
    root.items,
    root.Items,
    root.releases,
    root.Releases,
    root.androidReleases,
    root.AndroidReleases,
  ];
  return candidates.find(Array.isArray) as unknown[] | undefined ?? [];
}

export async function getAppDownloadsConfig(): Promise<ApiResponse<AdminAppDownloadsConfig>> {
  const response = await httpClient.get<unknown>(API_ENDPOINTS.ADMIN.APP_DOWNLOADS);
  return { ...response, data: normalizeConfig(response.data) };
}

export async function updateAndroidGooglePlay(
  body: StoreChannelUpdateRequest
): Promise<ApiResponse<AdminAppDownloadsConfig>> {
  const response = await httpClient.put<unknown>(API_ENDPOINTS.ADMIN.APP_DOWNLOADS_ANDROID_GOOGLE_PLAY, body);
  return { ...response, data: normalizeConfig(response.data) };
}

export async function updateIosAppStore(
  body: StoreChannelUpdateRequest
): Promise<ApiResponse<AdminAppDownloadsConfig>> {
  const response = await httpClient.put<unknown>(API_ENDPOINTS.ADMIN.APP_DOWNLOADS_IOS_APP_STORE, body);
  return { ...response, data: normalizeConfig(response.data) };
}

export async function getAndroidAppReleases(): Promise<ApiResponse<AndroidAppRelease[]>> {
  const response = await httpClient.get<unknown>(API_ENDPOINTS.ADMIN.APP_DOWNLOADS_ANDROID_RELEASES);
  return {
    ...response,
    data: unwrapList(response.data).map(normalizeRelease),
  };
}

export async function createAndroidAppRelease(
  body: CreateAndroidReleaseRequest
): Promise<ApiResponse<AndroidAppRelease>> {
  const response = await httpClient.post<unknown>(API_ENDPOINTS.ADMIN.APP_DOWNLOADS_ANDROID_RELEASES, body);
  return { ...response, data: normalizeRelease(response.data) };
}

export async function publishAndroidAppRelease(id: string): Promise<ApiResponse<void>> {
  return httpClient.post<void>(API_ENDPOINTS.ADMIN.APP_DOWNLOADS_ANDROID_RELEASE_PUBLISH(id));
}
