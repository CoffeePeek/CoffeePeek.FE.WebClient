import { displayDrinkName, drinkSelection, reviewDrinkSelection, savedDrinkName } from '../src/utils/consumedDrinks';
import { buildCheckInRequest } from '../src/utils/checkInForm';

test('optional selections omit fields; catalog drinks never send a custom name', () => {
  expect(drinkSelection()).toEqual({});
  expect(drinkSelection('cappuccino', 'ignored')).toEqual({ drinkSlug: 'cappuccino' });
});

test('Other trims and validates the name before submission', () => {
  expect(drinkSelection('other', '  Эспрессо-тоник  ')).toEqual({ drinkSlug: 'other', customDrinkName: 'Эспрессо-тоник' });
  for (const name of ['', '   ', 'x'.repeat(101)]) expect(() => drinkSelection('other', name)).toThrow();
  expect(drinkSelection('other', 'x'.repeat(100)).customDrinkName).toHaveLength(100);
});

test('historical display uses snapshot names without the catalog', () => {
  expect(savedDrinkName({ drinkSlug: 'inactive', drinkNameRu: 'Старое название', drinkNameEn: 'Old name' })).toBe('Старое название');
  expect(savedDrinkName({ drinkSlug: 'inactive', drinkNameRu: 'Старое название', drinkNameEn: 'Old name' }, 'en')).toBe('Old name');
  expect(savedDrinkName({ drinkSlug: 'other', customDrinkName: 'Эспрессо-тоник', drinkNameRu: 'Другое' }, 'ru')).toBe('Эспрессо-тоник');
  expect(savedDrinkName({ customDrinkName: 'Эспрессо-тоник' })).toBe('Эспрессо-тоник');
  expect(savedDrinkName({ drinkSlug: 'inactive', drinkNameRu: 'Старое название' }, 'en')).toBe('Старое название');
  expect(savedDrinkName({})).toBe('');
  expect(displayDrinkName({}, 'ru')).toBe('Не указан');
  expect(displayDrinkName({ drinkSlug: null, drinkNameRu: null, drinkNameEn: null }, 'en')).toBe('Not specified');
});

test('review edits preserve unchanged inactive drinks, clear removals and submit replacements', () => {
  const original = { drinkSlug: 'inactive' };
  expect(reviewDrinkSelection('inactive', '', original)).toEqual({});
  expect(reviewDrinkSelection('', '', original)).toEqual({ clearDrink: true });
  expect(reviewDrinkSelection('cappuccino', '', original)).toEqual({ drinkSlug: 'cappuccino' });
  expect(reviewDrinkSelection('other', ' Тоник ', { drinkSlug: 'other', customDrinkName: 'Тоник' })).toEqual({});
  expect(reviewDrinkSelection('', '')).toEqual({});
});

test('private and public check-ins carry the same validated drink selection', () => {
  for (const isPublic of [false, true]) {
    expect(buildCheckInRequest({ coffeeShopId: 'shop', isPublic, header: 'Заголовок', note: 'Описание посещения', visitedDate: '2026-09-01', rating: { coffee: 5, service: 5, place: 5 }, drinkSlug: 'other', customDrinkName: ' Тоник ' }, new Date('2026-09-02T12:00:00Z'))).toMatchObject({ drinkSlug: 'other', customDrinkName: 'Тоник' });
  }
});
