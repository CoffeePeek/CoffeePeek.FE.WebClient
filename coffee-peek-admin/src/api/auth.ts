import { httpClient, TokenManager } from './core/httpClient';
import { API_ENDPOINTS } from './core/apiConfig';
import { ApiResponse } from './core/types';
import { pickAuthTokens } from './core/interceptors';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthData {
  accessToken: string;
  accessTokenExpiresAt?: string;
}

export async function login(credentials: LoginRequest): Promise<ApiResponse<AuthData>> {
  const response = await httpClient.post<AuthData>(
    API_ENDPOINTS.AUTH.LOGIN,
    credentials,
    { requiresAuth: false, skipAuthHeader: true }
  );

  if (response.success && response.data) {
    const tokens = pickAuthTokens(response.data);
    if (tokens.accessToken) {
      TokenManager.setAccessToken(tokens.accessToken);
      response.data.accessToken = tokens.accessToken;
    }
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

export async function refreshAccessToken(): Promise<ApiResponse<AuthData>> {
  const response = await httpClient.put<AuthData>(
    API_ENDPOINTS.AUTH.REFRESH,
    undefined,
    { requiresAuth: false, skipAuthHeader: true }
  );

  if (response.success && response.data) {
    const tokens = pickAuthTokens(response.data);
    if (tokens.accessToken) {
      TokenManager.setAccessToken(tokens.accessToken);
      response.data.accessToken = tokens.accessToken;
    }
  }

  return response;
}
