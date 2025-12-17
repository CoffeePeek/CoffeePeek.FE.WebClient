import { apiClient } from './client';
import type {
  GetAllReviewsResponse,
  GetReviewByIdResponse,
  GetReviewsByUserIdResponse,
  AddCoffeeShopReviewRequest,
  AddCoffeeShopReviewResponse,
  UpdateCoffeeShopReviewRequest,
  UpdateCoffeeShopReviewResponse,
} from './types';

const isNotFound = (error: unknown) =>
  error instanceof Error && /status:\s*404\b/.test(error.message);

const notAvailableResponse = <T extends { data: unknown }>(data: T['data']): T =>
  ({
    isSuccess: true,
    message: 'Reviews service is not available on this environment',
    errorCode: null,
    traceId: null,
    errors: null,
    data,
  }) as unknown as T;

export const reviewApi = {
  getAllReviews: async (): Promise<GetAllReviewsResponse> => {
    try {
      return await apiClient.get<GetAllReviewsResponse>('/api/reviewcoffee');
    } catch (e) {
      if (isNotFound(e)) {
        // Gateway doesn't route this service in some envs; treat as empty list (no toast spam).
        return notAvailableResponse<GetAllReviewsResponse>({ reviews: [] });
      }
      throw e;
    }
  },

  getReviewById: async (id: string): Promise<GetReviewByIdResponse> => {
    return apiClient.get<GetReviewByIdResponse>(`/api/reviewcoffee/${id}`);
  },

  getReviewsByUserId: async (userId: string): Promise<GetReviewsByUserIdResponse> => {
    return apiClient.get<GetReviewsByUserIdResponse>(`/api/reviewcoffee/user/${userId}`);
  },

  addReview: async (data: AddCoffeeShopReviewRequest): Promise<AddCoffeeShopReviewResponse> => {
    return apiClient.post<AddCoffeeShopReviewResponse>('/api/reviewcoffee', data);
  },

  updateReview: async (data: UpdateCoffeeShopReviewRequest): Promise<UpdateCoffeeShopReviewResponse> => {
    return apiClient.put<UpdateCoffeeShopReviewResponse>('/api/reviewcoffee', data);
  },
};


