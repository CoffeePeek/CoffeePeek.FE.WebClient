import { buildCheckInRequest, formatCheckInDate, todayInputValue, type CheckInDraft } from '../src/utils/checkInForm';

const now = new Date('2026-09-05T12:00:00Z');
const draft: CheckInDraft = {
  coffeeShopId: '11111111-1111-1111-1111-111111111111',
  isPublic: false, header: '', note: '', visitedDate: '2026-09-05',
  rating: { coffee: 5, service: 5, place: 5 },
};

test('private check-in needs no text or photos and includes all nullable wire fields', () => {
  const request = JSON.parse(JSON.stringify(buildCheckInRequest(draft, now)));
  expect(request).toMatchObject({
    coffeeShopId: draft.coffeeShopId, isPublic: false,
    header: null, note: null, photos: [], rating: { coffee: 5, service: 5, place: 5 },
  });
  expect(todayInputValue(new Date(request.visitedAt))).toBe('2026-09-05');
});

test('cleared date uses today without blocking an otherwise empty check-in', () => {
  const request = buildCheckInRequest({ ...draft, visitedDate: '' }, now);
  expect(todayInputValue(new Date(request.visitedAt))).toBe(todayInputValue(now));
});

test.each(['2026-09-06', '2026-02-30', 'not-a-date'])('rejects invalid/future date %s', visitedDate => {
  expect(() => buildCheckInRequest({ ...draft, visitedDate }, now)).toThrow();
});

test.each([0, 6, 1.5, NaN])('private and public ratings reject %s', coffee => {
  for (const isPublic of [true, false]) {
    expect(() => buildCheckInRequest({ ...draft, isPublic, rating: { ...draft.rating, coffee } }, now)).toThrow(/оценки/);
  }
});

test.each(['', '   ', 'ab', 'x'.repeat(101)])('public title must contain 3..100 trimmed characters', header => {
  expect(() => buildCheckInRequest({ ...draft, isPublic: true, header, note: 'A proper description' }, now)).toThrow(/заголовок/);
});

test.each(['', '   ', 'x'.repeat(9), 'x'.repeat(501)])('public description must contain 10..500 characters', note => {
  expect(() => buildCheckInRequest({ ...draft, isPublic: true, header: 'Title', note }, now)).toThrow(/описание|Описание/);
});

test('public title and description are separate trimmed fields; switching to private discards title', () => {
  const publicDraft = { ...draft, isPublic: true, header: '  Great coffee  ', note: '  Will visit again  ' };
  expect(buildCheckInRequest(publicDraft, now)).toMatchObject({ header: 'Great coffee', note: 'Will visit again' });
  expect(buildCheckInRequest({ ...publicDraft, isPublic: false, note: 'Short' }, now)).toMatchObject({ header: null, note: 'Short' });
});

test('private note still respects the server maximum', () => {
  expect(() => buildCheckInRequest({ ...draft, note: 'x'.repeat(501) }, now)).toThrow();
});

test('shows selected visit date, falling back to creation only for older/invalid DTOs', () => {
  const createdAt = '2026-09-05T12:00:00Z';
  const visitedAt = buildCheckInRequest({ ...draft, visitedDate: '2026-09-01' }, now).visitedAt;
  expect(formatCheckInDate({ visitedAt, createdAt })).toBe('1 сентября 2026 г.');
  expect(formatCheckInDate({ createdAt })).toBe('5 сентября 2026 г.');
  expect(formatCheckInDate({ visitedAt: '0001-01-01T00:00:00', createdAt })).toBe('5 сентября 2026 г.');
  expect(formatCheckInDate({ createdAt: '0001-01-01T00:00:00' })).toBe('Дата не указана');
});
