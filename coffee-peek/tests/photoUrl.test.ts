import { getPhotoUrl } from '../src/api/coffeeshop';

jest.mock('../src/api/core/httpClient', () => ({ httpClient: {} }));
jest.mock('../src/api/core/apiConfig', () => ({ API_ENDPOINTS: {} }));
jest.mock('../src/utils/logger', () => ({ logger: { warn: jest.fn() } }));

const urls = { thumbnail: 'https://m/thumb.jpg', card: 'https://m/card.jpg', detail: 'https://m/detail.jpg', fullscreen: 'https://m/full.jpg' };

test('picks the requested variant and falls back to fullUrl when urls is absent', () => {
  expect(getPhotoUrl({ fullUrl: 'https://m/orig.jpg', urls }, 'card')).toBe('https://m/card.jpg');
  expect(getPhotoUrl({ fullUrl: 'https://m/orig.jpg', urls }, 'thumbnail')).toBe('https://m/thumb.jpg');
  expect(getPhotoUrl({ fullUrl: 'https://m/orig.jpg' }, 'detail')).toBe('https://m/orig.jpg');
  expect(getPhotoUrl({ fullUrl: 'https://m/orig.jpg', urls: null }, 'fullscreen')).toBe('https://m/orig.jpg');
  expect(getPhotoUrl({ fullUrl: null }, 'card')).toBe('');
});
