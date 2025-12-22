import { apiClient } from './client';
import type {
  GetBeansResponse,
  GetBrewMethodsResponse,
  GetCitiesResponse,
  GetEquipmentsResponse,
  GetRoastersResponse,
  GetUserStatisticsResponse,
} from './types';

const DEFAULT_CACHE_TIME = 24 * 60 * 60 * 1000;

export const internalApi = {
  getCities: async (): Promise<GetCitiesResponse> => {
    return apiClient.get<GetCitiesResponse>('/api/Internal/cities');
  },

  getBeans: async () => {
    return apiClient.get<GetBeansResponse>('/api/Internal/beans', undefined, undefined, DEFAULT_CACHE_TIME);
  },

  getEquipments: async (): Promise<GetEquipmentsResponse> => {
    return apiClient.get<GetEquipmentsResponse>('/api/Internal/equipments', undefined, undefined, DEFAULT_CACHE_TIME);
  },

  getRoasters: async (): Promise<GetRoastersResponse> => {
    return apiClient.get<GetRoastersResponse>('/api/Internal/roasters', undefined, undefined, DEFAULT_CACHE_TIME);
  },

  getBrewMethods: async (): Promise<GetBrewMethodsResponse> => {
    return apiClient.get<GetBrewMethodsResponse>('/api/Internal/brew-methods', undefined, undefined, DEFAULT_CACHE_TIME);
  },

  getUserStatistics: async (userId: string): Promise<GetUserStatisticsResponse> => {
    return apiClient.get<GetUserStatisticsResponse>(`/api/Internal/statistics/${userId}`);
  },
};