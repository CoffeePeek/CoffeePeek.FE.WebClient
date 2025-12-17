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
      Object.keys(queryParams).length > 0 ? queryParams : undefined
    );

    return {
      ...response,
      pagination: response.headers,
    };
  },

  getCoffeeShop: async (id: string): Promise<GetCoffeeShopResponse> => {
    return apiClient.get<GetCoffeeShopResponse>(`/api/coffeeshop/${id}`);
  },

  addToFavorite: async (id: string, userId: string): Promise<CreateEntityResponse> => {
    return apiClient.post<CreateEntityResponse>(`/favorite${id}`, { userId });
  },

  removeFromFavorite: async (id: string, userId: string): Promise<void> => {
    await apiClient.delete(`/favorite${id}`, { userId });
  },
};


