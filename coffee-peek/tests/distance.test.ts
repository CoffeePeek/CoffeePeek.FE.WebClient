import { distanceKm, formatDistance } from '../src/utils/distance';

describe('distance helpers', () => {
  test('calculates and formats nearby distances', () => {
    expect(distanceKm(53.9, 27.5667, 53.91, 27.5667)).toBeCloseTo(1.11, 1);
    expect(formatDistance(0.42)).toBe('420 м');
    expect(formatDistance(7.56)).toBe('7,6 км');
  });
});
