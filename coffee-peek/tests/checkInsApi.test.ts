import { createCheckIn, getCheckIns } from '../src/api/coffeeshop';
import { httpClient } from '../src/api/core/httpClient';
import { buildCheckInRequest } from '../src/utils/checkInForm';

jest.mock('../src/api/core/httpClient', () => ({ httpClient: { get: jest.fn(), post: jest.fn() } }));
jest.mock('../src/api/core/apiConfig', () => ({ API_ENDPOINTS: { CHECK_IN: { BASE: '/api/CheckIns' } } }));
jest.mock('../src/utils/logger', () => ({ logger: { warn: jest.fn() } }));

const item = {
  id: 'checkin', shopId: 'shop', userId: 'user', shopName: 'Coffee',
  note: null, createdAt: '2026-09-05T12:00:00Z', visitedAt: '2026-09-01T21:00:00Z', reviewId: null,
  photos: [{ id: 'photo', fileName: 'coffee.jpg', storageKey: 'checkins/coffee.jpg', fullUrl: 'https://media.example/coffee.jpg', sortIndex: 0 }],
};

beforeEach(() => jest.clearAllMocks());

test('GET uses pagination headers and preserves deployed checkIns envelope, photos and dates', async () => {
  jest.mocked(httpClient.get).mockResolvedValue({
    success: true, data: { checkIns: [item], totalItems: 21, totalPages: 3, currentPage: 2, pageSize: 10 },
  } as never);
  const result = await getCheckIns(2, 10);
  expect(httpClient.get).toHaveBeenCalledWith('/api/CheckIns', {
    requiresAuth: true, headers: { 'X-Page-Number': '2', 'X-Page-Size': '10' },
  });
  expect(result.data).toEqual({ items: [item], totalItems: 21, totalPages: 3, currentPage: 2, pageSize: 10 });
});

test('response pagination totals override body totals, never page length', async () => {
  jest.mocked(httpClient.get).mockResolvedValue({ success: true, data: [item], pagination: { totalItems: 31, totalPages: 4 } } as never);
  expect((await getCheckIns()).data).toMatchObject({ items: [item], totalItems: 31, totalPages: 4 });
});

test('private check-in serializes empty fields and uploaded photo metadata with size, not sizeBytes', async () => {
  const request = buildCheckInRequest({ coffeeShopId: item.shopId, isPublic: false, header: '', note: '', visitedDate: '2026-09-01', rating: { coffee: 5, service: 5, place: 5 } });
  request.photos = [{ fileName: 'coffee.jpg', contentType: 'image/jpeg', storageKey: item.photos[0].storageKey, size: 1024 }];
  jest.mocked(httpClient.post).mockResolvedValue({ success: true, data: { checkInId: 'checkin', reviewId: null } } as never);
  expect((await createCheckIn(request)).data.checkInId).toBe('checkin');
  expect(httpClient.post).toHaveBeenCalledWith('/api/CheckIns', request, { requiresAuth: true });
  expect(JSON.parse(JSON.stringify(request))).toMatchObject({ note: null, photos: [{ size: 1024 }] });
});
