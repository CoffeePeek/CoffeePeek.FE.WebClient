import { httpClient, TokenManager } from './core/httpClient';
import { API_ENDPOINTS } from './core/apiConfig';
import { ApiResponse } from './core/types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthData {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

export async function login(credentials: LoginRequest): Promise<ApiResponse<AuthData>> {
  const response = await httpClient.post<AuthData>(
    API_ENDPOINTS.AUTH.LOGIN,
    credentials,
    { requiresAuth: false }
  );

  if (response.success && response.data.accessToken) {
    TokenManager.setTokens(response.data.accessToken, response.data.refreshToken);
  }

  return response;
}

export async function logout(): Promise<void> {
  try {
    await httpClient.delete<void>(API_ENDPOINTS.TOKEN.BASE, { requiresAuth: true });
  } finally {
    TokenManager.clearTokens();
  }
}

export async function refreshAccessToken(refreshToken: string): Promise<ApiResponse<AuthData>> {
  const response = await httpClient.put<AuthData>(
    API_ENDPOINTS.AUTH.REFRESH,
    { refreshToken },
    { requiresAuth: false, skipAuthHeader: true }
  );

  if (response.success && response.data.accessToken) {
    TokenManager.setTokens(response.data.accessToken, response.data.refreshToken);
  }

  return response;
}
