import { apiClient } from './client';
import type {
  GetBeansResponse,
  GetBrewMethodsResponse,
  GetCitiesResponse,
  GetEquipmentsResponse,
  GetRoastersResponse,
  GetUserStatisticsResponse,
} from './types';

export const internalApi = {
  getCities: async (): Promise<GetCitiesResponse> => {
    return apiClient.get<GetCitiesResponse>('/api/internal/cities');
  },

  getBeans: async (): Promise<GetBeansResponse> => {
    return apiClient.get<GetBeansResponse>('/api/internal/beans');
  },

  getEquipments: async (): Promise<GetEquipmentsResponse> => {
    return apiClient.get<GetEquipmentsResponse>('/api/internal/equipments');
  },

  getRoasters: async (): Promise<GetRoastersResponse> => {
    return apiClient.get<GetRoastersResponse>('/api/internal/roasters');
  },

  getBrewMethods: async (): Promise<GetBrewMethodsResponse> => {
    return apiClient.get<GetBrewMethodsResponse>('/api/internal/brew-methods');
  },

  getUserStatistics: async (userId: string): Promise<GetUserStatisticsResponse> => {
    return apiClient.get<GetUserStatisticsResponse>(`/api/internal/statistics/${userId}`);
  },
};


