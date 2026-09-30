jest.mock('../src/api/core/httpClient', () => ({ httpClient: { getRaw: jest.fn() } }));
import { httpClient } from '../src/api/core/httpClient';
import { getBySlug, getPublicAddresses, isGuid } from '../src/api/publicAddresses';
const getRaw = httpClient.getRaw as jest.Mock;
beforeEach(() => getRaw.mockReset());
const id = (n: number) => `00000001-0000-0000-0000-${String(n).padStart(12, '0')}`;
test('batch skips empty input, deduplicates, chunks and matches by entityId', async () => {
  expect((await getPublicAddresses('users', [])).size).toBe(0);
  expect(getRaw).not.toHaveBeenCalled();
  getRaw.mockResolvedValueOnce([{ entityId: id(2), canonicalPath: '/users/two' }]).mockResolvedValueOnce([]);
  const result = await getPublicAddresses('users', [id(2), ...Array.from({ length: 101 }, (_, i) => id(i + 1))]);
  expect(getRaw).toHaveBeenCalledTimes(2);
  const first = new URL(getRaw.mock.calls[0][0], 'https://example.com');
  expect(first.searchParams.getAll('ids')).toHaveLength(100);
  expect(first.searchParams.getAll('ids')[0]).toBe(id(2));
  expect(result.get(id(2))?.canonicalPath).toBe('/users/two');
  expect(result.has(id(1))).toBe(false);
});
test('slug path is encoded and full GUID detection does not infer suffixes', async () => {
  getRaw.mockResolvedValue({});
  await getBySlug('shops', 'кофе /?');
  expect(getRaw).toHaveBeenCalledWith(`/api/CoffeeShops/by-slug/${encodeURIComponent('кофе /?')}`);
  expect(isGuid(id(1))).toBe(true);
  expect(isGuid('user-1234abcd')).toBe(false);
});
test('invalid and zero GUIDs never reach batch endpoint', async () => {
  await expect(getPublicAddresses('users', ['bad'])).rejects.toThrow();
  await expect(getPublicAddresses('users', ['00000000-0000-0000-0000-000000000000'])).rejects.toThrow();
  expect(getRaw).not.toHaveBeenCalled();
});
