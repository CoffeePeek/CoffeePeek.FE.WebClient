import { apiClient } from './client';
import type {
  CreateCheckInRequest,
  CreateCheckInResponse,
  GetCheckInsResponse,
  GetCheckInsByUserIdResponse,
  PaginationHeaders,
} from './types';

export const checkinApi = {
  createCheckIn: async (data: CreateCheckInRequest): Promise<CreateCheckInResponse> => {
    return apiClient.post<CreateCheckInResponse>('/api/checkin', data);
  },

  getMyCheckIns: async (params?: {
    pageNumber?: number;
    pageSize?: number;
  }): Promise<GetCheckInsResponse & { pagination?: PaginationHeaders }> => {
    const headers: HeadersInit = {};
    if (params?.pageNumber) headers['X-Page-Number'] = String(params.pageNumber);
    if (params?.pageSize) headers['X-Page-Size'] = String(params.pageSize);

    const response = await apiClient.get<GetCheckInsResponse>(
      '/api/checkin',
      undefined,
      Object.keys(headers).length > 0 ? headers : undefined
    );

    return { ...response, pagination: response.headers };
  },

  getCheckInsByUserId: async (
    userId: string,
    params?: { pageNumber?: number; pageSize?: number }
  ): Promise<GetCheckInsByUserIdResponse & { pagination?: PaginationHeaders }> => {
    const headers: HeadersInit = {};
    if (params?.pageNumber) headers['X-Page-Number'] = String(params.pageNumber);
    if (params?.pageSize) headers['X-Page-Size'] = String(params.pageSize);

    const response = await apiClient.get<GetCheckInsByUserIdResponse>(
      `/api/checkin/user/${userId}`,
      undefined,
      Object.keys(headers).length > 0 ? headers : undefined
    );

    return { ...response, pagination: response.headers };
  },
};




