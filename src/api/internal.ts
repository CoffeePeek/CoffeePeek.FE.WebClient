import { apiClient } from './client';
import type { GetCitiesResponse } from './types';

export const internalApi = {
  getCities: async (): Promise<GetCitiesResponse> => {
    return apiClient.get<GetCitiesResponse>('/api/internal/cities');
  },
};


