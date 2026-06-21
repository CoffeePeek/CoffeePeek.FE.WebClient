import { httpClient } from './core/httpClient';
import { API_ENDPOINTS } from './core/apiConfig';
import { ApiResponse } from './core/types';

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
}

export interface CatalogsBundle {
  cities: CatalogCity[];
  equipments: CatalogEquipment[];
  beans: CatalogBean[];
  roasters: CatalogRoaster[];
  brewMethods: CatalogBrewMethod[];
}

function unwrapList<T>(data: unknown, key: string): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object' && key in (data as object)) {
    const nested = (data as Record<string, unknown>)[key];
    if (Array.isArray(nested)) return nested as T[];
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
  return { ...response, data: unwrapList<CatalogBean>(response.data, 'coffeeBeans') };
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
