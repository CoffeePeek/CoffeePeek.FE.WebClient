import { httpClient } from './core/httpClient';
import { API_ENDPOINTS } from './core/apiConfig';
import type { ApiResponse } from './core/types';

export interface CatalogCity {
  id: string;
  name: string;
}

export interface CatalogEquipment {
  id: string;
  name: string;
  brand?: string;
  model?: string;
  category?: number;
}

export interface CatalogBean {
  id: string;
  name: string;
}

export interface CatalogRoaster {
  id: string;
  name: string;
}

export interface CatalogBrewMethod {
  id: string;
  name: string;
  category?: number;
}

export interface CatalogShopTag {
  id: string;
  slug: string;
  name: string;
  description?: string;
  sortOrder: number;
}

export interface CatalogsBundle {
  cities: CatalogCity[];
  equipments: CatalogEquipment[];
  beans: CatalogBean[];
  roasters: CatalogRoaster[];
  brewMethods: CatalogBrewMethod[];
}

function unwrapList<T>(data: unknown, ...keys: string[]): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    for (const key of keys) {
      const nested = record[key];
      if (Array.isArray(nested)) return nested as T[];
    }
  }
  return [];
}

export async function getCatalogCities(): Promise<ApiResponse<CatalogCity[]>> {
  const response = await httpClient.get<unknown>(API_ENDPOINTS.CATALOGS.CITIES, {
    requiresAuth: false,
  });
  return { ...response, data: unwrapList<CatalogCity>(response.data, 'cities') };
}

export async function getCatalogEquipments(): Promise<ApiResponse<CatalogEquipment[]>> {
  const response = await httpClient.get<unknown>(API_ENDPOINTS.CATALOGS.EQUIPMENTS, {
    requiresAuth: false,
  });
  return { ...response, data: unwrapList<CatalogEquipment>(response.data, 'equipments') };
}

export async function getCatalogBeans(): Promise<ApiResponse<CatalogBean[]>> {
  const response = await httpClient.get<unknown>(API_ENDPOINTS.CATALOGS.BEANS, {
    requiresAuth: false,
  });
  return { ...response, data: unwrapList<CatalogBean>(response.data, 'beans', 'coffeeBeans') };
}

export type CatalogKind = 'cities' | 'beans' | 'equipments' | 'roasters' | 'brewMethods';
export type CatalogItem = CatalogCity | CatalogBean | CatalogEquipment | CatalogRoaster | CatalogBrewMethod;

export interface NamedCatalogRequest {
  name: string;
}

export interface EquipmentCatalogRequest {
  brand: string;
  modelName: string;
  category: number;
}

export interface BrewMethodCatalogRequest {
  name: string;
  category: number;
}

export type CatalogMutationRequest = NamedCatalogRequest | EquipmentCatalogRequest | BrewMethodCatalogRequest;

const adminCatalogEndpoints: Record<CatalogKind, { base: string; byId: (id: string) => string }> = {
  cities: { base: API_ENDPOINTS.ADMIN.CATALOG_CITIES, byId: API_ENDPOINTS.ADMIN.CATALOG_CITY_BY_ID },
  beans: { base: API_ENDPOINTS.ADMIN.CATALOG_BEANS, byId: API_ENDPOINTS.ADMIN.CATALOG_BEAN_BY_ID },
  equipments: { base: API_ENDPOINTS.ADMIN.CATALOG_EQUIPMENTS, byId: API_ENDPOINTS.ADMIN.CATALOG_EQUIPMENT_BY_ID },
  roasters: { base: API_ENDPOINTS.ADMIN.CATALOG_ROASTERS, byId: API_ENDPOINTS.ADMIN.CATALOG_ROASTER_BY_ID },
  brewMethods: { base: API_ENDPOINTS.ADMIN.CATALOG_BREW_METHODS, byId: API_ENDPOINTS.ADMIN.CATALOG_BREW_METHOD_BY_ID },
};

const catalogLoaders: Record<CatalogKind, () => Promise<ApiResponse<CatalogItem[]>>> = {
  cities: getCatalogCities,
  beans: getCatalogBeans,
  equipments: getCatalogEquipments,
  roasters: getCatalogRoasters,
  brewMethods: getCatalogBrewMethods,
};

export function getAdminCatalog(kind: CatalogKind): Promise<ApiResponse<CatalogItem[]>> {
  return catalogLoaders[kind]();
}

export function createAdminCatalogItem(
  kind: CatalogKind,
  body: CatalogMutationRequest
): Promise<ApiResponse<CatalogItem>> {
  return httpClient.post<CatalogItem>(adminCatalogEndpoints[kind].base, body);
}

export function updateAdminCatalogItem(
  kind: CatalogKind,
  id: string,
  body: CatalogMutationRequest
): Promise<ApiResponse<CatalogItem>> {
  return httpClient.patch<CatalogItem>(adminCatalogEndpoints[kind].byId(id), body);
}

export function deleteAdminCatalogItem(kind: CatalogKind, id: string): Promise<ApiResponse<void>> {
  return httpClient.delete<void>(adminCatalogEndpoints[kind].byId(id));
}

export async function getCatalogRoasters(): Promise<ApiResponse<CatalogRoaster[]>> {
  const response = await httpClient.get<unknown>(API_ENDPOINTS.CATALOGS.ROASTERS, {
    requiresAuth: false,
  });
  return { ...response, data: unwrapList<CatalogRoaster>(response.data, 'roasters') };
}

export async function getCatalogBrewMethods(): Promise<ApiResponse<CatalogBrewMethod[]>> {
  const response = await httpClient.get<unknown>(API_ENDPOINTS.CATALOGS.BREW_METHODS, {
    requiresAuth: false,
  });
  return { ...response, data: unwrapList<CatalogBrewMethod>(response.data, 'brewMethods') };
}

export async function getShopTags(): Promise<ApiResponse<CatalogShopTag[]>> {
  const response = await httpClient.get<unknown>(API_ENDPOINTS.CATALOGS.SHOP_TAGS, {
    requiresAuth: false,
  });
  // Backend GetShopTagsResponse uses `tags` (same as admin list).
  return { ...response, data: unwrapList<CatalogShopTag>(response.data, 'tags', 'shopTags', 'items') };
}

export async function getAllCatalogs(): Promise<CatalogsBundle> {
  const [cities, equipments, beans, roasters, brewMethods] = await Promise.all([
    getCatalogCities(),
    getCatalogEquipments(),
    getCatalogBeans(),
    getCatalogRoasters(),
    getCatalogBrewMethods(),
  ]);

  return {
    cities: cities.data ?? [],
    equipments: equipments.data ?? [],
    beans: beans.data ?? [],
    roasters: roasters.data ?? [],
    brewMethods: brewMethods.data ?? [],
  };
}
