const EARTH_RADIUS_KM = 6371;

export function distanceKm(fromLat: number, fromLon: number, toLat: number, toLon: number): number {
  const radians = Math.PI / 180;
  const latDelta = (toLat - fromLat) * radians;
  const lonDelta = (toLon - fromLon) * radians;
  const a = Math.sin(latDelta / 2) ** 2
    + Math.cos(fromLat * radians) * Math.cos(toLat * radians) * Math.sin(lonDelta / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function formatDistance(kilometers: number): string {
  return kilometers < 1
    ? `${Math.max(1, Math.round(kilometers * 1000))} м`
    : `${kilometers.toLocaleString('ru-RU', { maximumFractionDigits: 1 })} км`;
}
