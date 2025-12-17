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

export const reviewApi = {
  getAllReviews: async (): Promise<GetAllReviewsResponse> => {
    return apiClient.get<GetAllReviewsResponse>('/api/reviewcoffee');
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


