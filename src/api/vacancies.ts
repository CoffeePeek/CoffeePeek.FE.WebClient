import { apiClient } from './client';
import type { GetVacanciesResponse, VacancyJobType } from './types';

export const vacanciesApi = {
  getVacancies: async (params: {
    cityId: string;
    jobType?: VacancyJobType;
    page?: number;
    perPage?: number;
  }): Promise<GetVacanciesResponse> => {
    return apiClient.get<GetVacanciesResponse>('/api/vacancies', {
      cityId: params.cityId,
      jobType: params.jobType ?? 'All',
      page: params.page ?? 1,
      perPage: params.perPage ?? 20,
    });
  },
};




