import { apiClient } from './client';
import type {
  GetCoffeeShopsResponse,
  GetCoffeeShopResponse,
  CreateEntityResponse,
  PaginationHeaders,
} from './types';

export interface GetCoffeeShopsParams {
  cityId?: string;
  pageNumber?: number;
  pageSize?: number;
}

export const coffeeshopApi = {
  getCoffeeShops: async (
    params?: GetCoffeeShopsParams
  ): Promise<GetCoffeeShopsResponse & { pagination?: PaginationHeaders }> => {
    const headers: HeadersInit = {};
    
    if (params?.pageNumber) {
      headers['X-Page-Number'] = String(params.pageNumber);
    }
    if (params?.pageSize) {
      headers['X-Page-Size'] = String(params.pageSize);
    }

    const queryParams: Record<string, string> = {};
    if (params?.cityId) {
      queryParams.cityId = params.cityId;
    }

    const response = await apiClient.get<GetCoffeeShopsResponse>(
      '/api/shops',
      Object.keys(queryParams).length > 0 ? queryParams : undefined,
      Object.keys(headers).length > 0 ? headers : undefined
    );

    return {
      ...response,
      pagination: response.headers,
    };
  },

  getCoffeeShop: async (id: string): Promise<GetCoffeeShopResponse> => {
    return apiClient.get<GetCoffeeShopResponse>(`/api/shops/${id}`);
  },

  searchCoffeeShops: async (
    params?: {
      q?: string;
      cityId?: string;
      equipments?: string[];
      beans?: string[];
      minRating?: number;
      pageNumber?: number;
      pageSize?: number;
    }
  ): Promise<GetCoffeeShopsResponse & { pagination?: PaginationHeaders }> => {
    const headers: HeadersInit = {};
    if (params?.pageNumber) headers['X-Page-Number'] = String(params.pageNumber);
    if (params?.pageSize) headers['X-Page-Size'] = String(params.pageSize);

    const queryParams: Record<string, string | number | string[]> = {};
    if (params?.q) queryParams.q = params.q;
    if (params?.cityId) queryParams.cityId = params.cityId;
    if (params?.equipments?.length) queryParams.equipments = params.equipments;
    if (params?.beans?.length) queryParams.beans = params.beans;
    if (params?.minRating !== undefined) queryParams.minRating = params.minRating;

    const response = await apiClient.get<GetCoffeeShopsResponse>(
      '/api/shops/search',
      Object.keys(queryParams).length > 0 ? queryParams : undefined,
      Object.keys(headers).length > 0 ? headers : undefined
    );

    return { ...response, pagination: response.headers };
  },

  getCoffeeShopsInBounds: async (params: {
    minLat: number;
    minLon: number;
    maxLat: number;
    maxLon: number;
  }): Promise<GetCoffeeShopsResponse> => {
    return apiClient.get<GetCoffeeShopsResponse>('/api/shops/map', {
      minLat: params.minLat,
      minLon: params.minLon,
      maxLat: params.maxLat,
      maxLon: params.maxLon,
    });
  },

  addToFavorite: async (id: string, userId: string): Promise<CreateEntityResponse> => {
    return apiClient.post<CreateEntityResponse>(`/favorite/${id}`, { userId });
  },

  removeFromFavorite: async (id: string, userId: string): Promise<void> => {
    await apiClient.delete(`/favorite/${id}`, { userId });
  },
};


