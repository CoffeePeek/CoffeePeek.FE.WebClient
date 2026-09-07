import {
  activateCheckInDraft,
  clearCheckInDraft,
  updateCheckInDraft,
} from '../src/utils/checkInDraft';

beforeEach(() => clearCheckInDraft());

test('keeps a draft when the same shop check-in is closed and opened again', () => {
  const photo = { name: 'coffee.jpg', type: 'image/jpeg', size: 42 } as File;
  activateCheckInDraft('shop-1', new Date('2026-09-06T12:00:00Z'));
  updateCheckInDraft('shop-1', {
    note: 'Хочу сохранить эту заметку',
    isPublic: true,
    rating: { coffee: 4, service: 3, place: 5 },
    selectedFiles: [photo],
  });

  expect(activateCheckInDraft('shop-1')).toMatchObject({
    coffeeShopId: 'shop-1',
    note: 'Хочу сохранить эту заметку',
    isPublic: true,
    rating: { coffee: 4, service: 3, place: 5 },
    selectedFiles: [photo],
  });
});

test('opening a check-in for another shop replaces the previous draft', () => {
  updateCheckInDraft('shop-1', { note: 'Черновик первой кофейни' });

  expect(activateCheckInDraft('shop-2', new Date('2026-09-07T12:00:00Z'))).toMatchObject({
    coffeeShopId: 'shop-2',
    note: '',
    isPublic: false,
    visitedDate: '2026-09-07',
    rating: { coffee: 5, service: 5, place: 5 },
    selectedFiles: [],
  });

  expect(activateCheckInDraft('shop-1')).toMatchObject({
    coffeeShopId: 'shop-1',
    note: '',
  });
});

test('clears the draft after a successful submission', () => {
  updateCheckInDraft('shop-1', { note: 'Уже отправлено' });
  clearCheckInDraft('shop-1');

  expect(activateCheckInDraft('shop-1')).toMatchObject({ note: '', isPublic: false });
});
