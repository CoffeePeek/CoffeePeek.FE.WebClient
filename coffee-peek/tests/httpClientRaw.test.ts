jest.mock('../src/api/core/apiConfig', () => ({ API_BASE_URL: 'https://api.example', buildUrlWithParams: (path: string) => path }));
jest.mock('../src/api/core/interceptors', () => ({
  requestInterceptor: (_url: string, options: RequestInit) => options,
  ensureFreshAccessToken: jest.fn(), isAuthTokenEndpoint: () => false,
  responseInterceptor: jest.fn(), normalizeResponseData: (data: unknown) => data,
  TokenManager: { getAccessToken: () => null },
}));
jest.mock('../src/realtime/forceLogout', () => ({ emitSessionInvalidated: jest.fn() }));
import HttpClient from '../src/api/core/httpClient';
const client = new HttpClient('https://api.example');
const original = globalThis.fetch;
afterEach(() => { globalThis.fetch = original; });
test('raw GET preserves envelope, metadata and array and disables fetch caching', async () => {
  for (const body of [{ data: { shopDto: { name: 'Coffee' } }, address: { entityId: 'id' } }, { entityId: 'id' }, []]) {
    globalThis.fetch = jest.fn().mockResolvedValue(new Response(JSON.stringify(body)));
    expect(await client.getRaw('/address')).toEqual(body);
    expect(globalThis.fetch).toHaveBeenCalledWith('https://api.example/address', expect.objectContaining({ cache: 'no-store', method: 'GET' }));
  }
});
test('raw GET uses HTTP status even for empty or non-JSON gateway errors', async () => {
  for (const body of ['', 'Gateway unavailable', JSON.stringify({ title: 'Hidden' })]) {
    globalThis.fetch = jest.fn().mockResolvedValue(new Response(body, { status: 429, headers: { 'Retry-After': '30' } }));
    await expect(client.getRaw('/address')).rejects.toMatchObject({ status: 429, retryAfter: '30' });
  }
});
