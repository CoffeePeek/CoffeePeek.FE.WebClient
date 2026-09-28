import { getLocationLifetime, USER_LOCATION_TTL_MS } from '../src/utils/geolocation';

test('location expires five minutes after it was measured', () => {
  const now = 1_000_000;
  expect(getLocationLifetime(now, now)).toBe(USER_LOCATION_TTL_MS);
  expect(getLocationLifetime(now - USER_LOCATION_TTL_MS + 1, now)).toBe(1);
  expect(getLocationLifetime(now - USER_LOCATION_TTL_MS, now)).toBe(0);
});
