const EARTH_RADIUS_KM = 6371;

export function nearbyBounds(latitude: number, longitude: number, radiusKm = 5) {
  const deltaLat = radiusKm / EARTH_RADIUS_KM * 180 / Math.PI;
  const deltaLon = Math.abs(latitude) + deltaLat >= 90 ? 180
    : Math.asin(Math.min(1, Math.sin(radiusKm / EARTH_RADIUS_KM) / Math.cos(latitude * Math.PI / 180))) * 180 / Math.PI;
  return { minLat: Math.max(-90, latitude - deltaLat), maxLat: Math.min(90, latitude + deltaLat), minLon: longitude - deltaLon, maxLon: longitude + deltaLon };
}

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
