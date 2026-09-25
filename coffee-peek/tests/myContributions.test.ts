import { getMyContributions } from '../src/api/myContributions';
import { httpClient } from '../src/api/core/httpClient';

jest.mock('../src/api/core/httpClient', () => ({ httpClient: { get: jest.fn() } }));

const get = httpClient.get as jest.Mock;
const paging = { totalItems: 1, totalPages: 1, currentPage: 1, pageSize: 20 };
const query = { page: 1, pageSize: 20, status: 'Rejected' as const };

beforeEach(() => jest.clearAllMocks());

test('each /mine endpoint maps its own list key and status/reason fields', async () => {
  get.mockResolvedValueOnce({ data: { ...paging, moderationShops: [{ id: 's', name: 'Shop', address: 'Street 1', moderationStatus: 'Approved', rejectedReason: null, publishedShopId: null }] } });
  expect(await getMyContributions('shops', query)).toEqual({ totalItems: 1, totalPages: 1, items: [{ id: 's', title: 'Shop', subtitle: 'Street 1', status: 'Approved', reason: null, link: undefined }] });
  expect(get).toHaveBeenLastCalledWith('/api/ModerationShops/mine', { params: query });

  get.mockResolvedValueOnce({ data: { ...paging, items: [{ id: 'r', name: 'Roaster', about: null, moderationStatus: 'Pending', rejectedReason: null }] } });
  expect((await getMyContributions('roasters', query)).items[0]).toMatchObject({ title: 'Roaster', status: 'Pending' });

  get.mockResolvedValueOnce({ data: { ...paging, reviewDtos: [{ id: 'v', header: null, comment: 'Nice', shopId: 'shop', createdAt: '2026-09-01T00:00:00Z', moderationStatus: 'Rejected', rejectedReason: 'Spam', rating: { place: 3, service: 4, coffee: 5 } }] } });
  expect((await getMyContributions('reviews', query)).items[0]).toMatchObject({ status: 'Rejected', reason: 'Spam', link: '/shops/shop' });

  get.mockResolvedValueOnce({ data: { ...paging, items: [{ id: 'e', shopId: 'shop', section: 'Menu', status: 'Rejected', rejectionReason: 'Wrong', createdAtUtc: '2026-09-01T00:00:00Z' }] } });
  expect((await getMyContributions('edits', query)).items[0]).toMatchObject({ title: 'Меню', status: 'Rejected', reason: 'Wrong', link: '/shops/shop' });
  expect(get).toHaveBeenLastCalledWith('/api/ShopChangeRequests/mine', { params: query });
});

test('published shop links to the live catalog id', async () => {
  get.mockResolvedValueOnce({ data: { ...paging, moderationShops: [{ id: 's', name: 'Shop', address: null, moderationStatus: 'Approved', rejectedReason: null, publishedShopId: 'live' }] } });
  expect((await getMyContributions('shops', query)).items[0].link).toBe('/shops/live');
});
