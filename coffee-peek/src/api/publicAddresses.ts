import { httpClient } from './core/httpClient';
export const addressPrefixes = {
  shops: '/api/CoffeeShops', roasters: '/api/roasters', users: '/api/Users',
  cities: '/api/Catalogs/cities', zones: '/api/Catalogs/coffee-zones',
} as const;
export type AddressKind = keyof typeof addressPrefixes;
export interface PublicAddressMetadata {
  entityId: string; slug: string; canonicalPath: string; revision: number; isAlias: boolean;
}
export interface PublicAddressEnvelope<T> { data: T; address: PublicAddressMetadata }
export const isGuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
export const getBySlug = <T>(kind: AddressKind, slug: string) =>
  httpClient.getRaw<PublicAddressEnvelope<T>>(`${addressPrefixes[kind]}/by-slug/${encodeURIComponent(slug)}`);
export const getPublicAddress = (kind: AddressKind, id: string) =>
  httpClient.getRaw<PublicAddressMetadata>(`${addressPrefixes[kind]}/${encodeURIComponent(id)}/public-address`);
export async function getPublicAddresses(kind: AddressKind, ids: string[]) {
  const unique = [...new Set(ids)];
  if (unique.some(id => !isGuid(id) || /^0{8}-0{4}-0{4}-0{4}-0{12}$/.test(id))) throw new Error('Invalid GUID');
  const addresses = new Map<string, PublicAddressMetadata>();
  for (let start = 0; start < unique.length; start += 100) {
    const params = new URLSearchParams();
    unique.slice(start, start + 100).forEach(id => params.append('ids', id));
    const batch = await httpClient.getRaw<PublicAddressMetadata[]>(`${addressPrefixes[kind]}/public-addresses?${params}`);
    batch.forEach(address => addresses.set(address.entityId, address));
  }
  return addresses;
}
