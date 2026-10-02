jest.mock('../src/api/core/httpClient', () => ({ httpClient: { post: jest.fn() } }));
jest.mock('../src/api/core/apiConfig', () => ({ API_ENDPOINTS: { REVIEW: { BY_ID: (id: string) => `/api/CoffeeShopReviews/${encodeURIComponent(id)}` } } }));
jest.mock('../../coffee-peek-admin/src/api/core/httpClient', () => ({ httpClient: { get: jest.fn(), put: jest.fn() } }));
import { reportReview } from '../src/api/reviewReports';
import { httpClient } from '../src/api/core/httpClient';
import { getReviewReports, getReviewReport, resolveReviewReport } from '../../coffee-peek-admin/src/api/reviewReports';
import { httpClient as adminClient } from '../../coffee-peek-admin/src/api/core/httpClient';

beforeEach(() => jest.clearAllMocks());
test('report trims text, validates boundaries and requires authentication', () => {
  reportReview('id/1', '  Оскорбления  ');
  expect(httpClient.post).toHaveBeenCalledWith('/api/CoffeeShopReviews/id%2F1/reports', { text: 'Оскорбления' }, { requiresAuth: true });
  for (const text of ['', ' \n ', 'a'.repeat(2001)]) expect(() => reportReview('id', text)).toThrow();
  expect(httpClient.post).toHaveBeenCalledTimes(1);
  reportReview('id', 'a');
  reportReview('id', 'a'.repeat(2000));
  expect(httpClient.post).toHaveBeenCalledTimes(3);
});
test('admin preserves empty status, disables HTTP caching and sends both explicit resolutions', () => {
  getReviewReports('', 2);
  expect(adminClient.get).toHaveBeenCalledWith('/api/admin/review-reports', { params: { status: '', page: 2, pageSize: 20 }, cache: 'no-store' });
  getReviewReport('id/1');
  expect(adminClient.get).toHaveBeenLastCalledWith('/api/admin/review-reports/id%2F1', { cache: 'no-store' });
  for (const deleteReview of [false, true]) {
    resolveReviewReport('id/1', deleteReview);
    expect(adminClient.put).toHaveBeenLastCalledWith('/api/admin/review-reports/id%2F1/resolution', { deleteReview });
  }
});
