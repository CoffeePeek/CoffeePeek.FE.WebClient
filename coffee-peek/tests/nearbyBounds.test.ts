import { nearbyBounds, distanceKm } from '../src/utils/distance';

test('5 km bounds contain nearby points and distance excludes farther shops', () => {
  const box = nearbyBounds(53.9, 27.56);
  expect(box.minLat).toBeLessThan(53.9);
  expect(box.maxLat).toBeGreaterThan(53.9);
  expect(box.minLon).toBeLessThan(27.56);
  expect(box.maxLon).toBeGreaterThan(27.56);
  expect(distanceKm(53.9, 27.56, 53.91, 27.57)).toBeLessThan(5);
  expect(distanceKm(53.9, 27.56, 54, 27.56)).toBeGreaterThan(5);
  expect(distanceKm(53.9, 27.56, box.maxLat, 27.56)).toBeCloseTo(5, 6);
});

test('nearby bounds support poles and crossing the date line', () => {
  const pole = nearbyBounds(90, 0);
  expect(pole.maxLat).toBe(90);
  expect(pole.minLon).toBe(-180);
  expect(pole.maxLon).toBe(180);
  expect(nearbyBounds(0, 179.99).maxLon).toBeGreaterThan(180);
});
