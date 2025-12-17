import { apiClient } from './client';
import type {
  UserResponse,
  UsersListResponse,
  UpdateProfileRequest,
  UpdateProfileResponse,
  BooleanResponse,
} from './types';

export const userApi = {
  getProfile: async (): Promise<UserResponse> => {
    return apiClient.get<UserResponse>('/api/user');
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<UpdateProfileResponse> => {
    return apiClient.put<UpdateProfileResponse>('/api/user', data);
  },

  getAllUsers: async (): Promise<UsersListResponse> => {
    return apiClient.get<UsersListResponse>('/api/user/Users');
  },

  deleteUser: async (id: string): Promise<BooleanResponse> => {
    return apiClient.delete<BooleanResponse>(`/api/user/${id}`);
  },
};


