import { apiClient } from './client';
import type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  CreateEntityResponse,
  RefreshTokenResponse,
  GoogleLoginRequest,
  GoogleLoginResponse,
  BooleanResponse,
  BaseResponse,
} from './types';

export const authApi = {
  checkUserExists: async (email: string): Promise<BooleanResponse> => {
    return apiClient.get<BooleanResponse>('/api/auth/check-exists', { email });
  },

  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/api/auth/login', credentials);
    
    // Store tokens
    if (response.data?.accessToken && response.data?.refreshToken) {
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
    }
    
    return response;
  },

  register: async (data: RegisterRequest): Promise<CreateEntityResponse> => {
    return apiClient.post<CreateEntityResponse>('/api/auth/register', data);
  },

  refreshToken: async (refreshToken: string): Promise<RefreshTokenResponse> => {
    const response = await apiClient.get<RefreshTokenResponse>('/api/auth/refresh', { refreshToken });
    
    // Update stored tokens
    if (response.data?.accessToken && response.data?.refreshToken) {
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
    }
    
    return response;
  },

  googleLogin: async (data: GoogleLoginRequest): Promise<GoogleLoginResponse> => {
    const response = await apiClient.post<GoogleLoginResponse>('/api/auth/google/login', data);
    
    // Store tokens
    if (response.data?.accessToken && response.data?.refreshToken) {
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
    }
    
    return response;
  },

  logout: async (): Promise<BaseResponse> => {
    const response = await apiClient.post<BaseResponse>('/api/auth/logout');
    
    // Clear tokens
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    
    return response;
  },
};


