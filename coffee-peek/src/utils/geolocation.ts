export const USER_LOCATION_TTL_MS = 5 * 60_000;

export function getLocationLifetime(timestamp: number, now: number = Date.now()): number {
  if (!Number.isFinite(timestamp)) return 0;
  return Math.max(0, USER_LOCATION_TTL_MS - Math.max(0, now - timestamp));
}
