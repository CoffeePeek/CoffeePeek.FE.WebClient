import { closestCardIndex } from '../src/utils/carousel';

test('selects the card centered after scrolling in either direction', () => {
  const cards = [0, 312, 624].map(offsetLeft => ({ offsetLeft, offsetWidth: 300 }));
  expect(closestCardIndex(cards, 150)).toBe(0);
  expect(closestCardIndex(cards, 470)).toBe(1);
  expect(closestCardIndex(cards, 774)).toBe(2);
  expect(closestCardIndex(cards, 440)).toBe(1);
  expect(closestCardIndex([], 150)).toBe(0);
});
