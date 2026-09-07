export type MobilePlatform = 'android' | 'ios';
export type MobilePlatformStatus = 'available' | 'coming_soon';

export interface MobilePlatformRelease {
  platform: MobilePlatform;
  status: MobilePlatformStatus;
  downloadUrl?: string;
  /** Horizontal store badge — fits inline buttons/rows. */
  badgeUrl?: string;
  /** Larger vertical lockup — fits hero/premium presentations. */
  badgeVerticalUrl?: string;
}

const MOCK_RELEASES: MobilePlatformRelease[] = [
  {
    platform: 'android',
    status: 'available',
    downloadUrl:
      'https://appdistribution.firebase.google.com/testerapps/1:54339593656:android:37200e16abebd375b51b4d/releases/44ilj57ap4pso',
    badgeUrl: '/images/google/google-play-badge.png',
    badgeVerticalUrl: '/images/google/google-play-vertical-loockup.png',
  },
  {
    platform: 'ios',
    status: 'coming_soon',
    badgeUrl: '/images/app-store-badge.png',
  },
];

// ponytail: mocked provider, no backend endpoint exists yet.
// TODO: replace the body with `return httpClient.get<MobilePlatformRelease[]>(API_ENDPOINTS.PUBLIC.MOBILE_RELEASES)` once one does.
export async function getMobileAppReleases(): Promise<MobilePlatformRelease[]> {
  return MOCK_RELEASES;
}
