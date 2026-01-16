/**
 * API модуль для аутентификации и профиля пользователя
 */

import { httpClient, TokenManager } from './core/httpClient';
import { API_ENDPOINTS } from './core/apiConfig';
import { ApiResponse } from './core/types';

// ==================== Request/Response Types ====================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  userName?: string;
}

/**
 * Данные авторизации
 */
export interface AuthData {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

export interface AuthResponse extends ApiResponse<AuthData> {}

export interface CreateEntityResponse {
  isSuccess: boolean;
  message: string;
  data?: any;
}

export interface CheckExistsData {
  exists: boolean;
}

export interface CheckExistsResponse extends ApiResponse<CheckExistsData> {}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  status?: number;
}

// UserProfile interfaces
export interface UserProfile {
  id?: string;
  userCredentialId: string;
  userName: string;
  email: string;
  about?: string;
  createdAt: string;
  avatarUrl?: string;
  reviewCount?: number;
  checkInCount?: number;
  addedShopsCount?: number;
  roles?: string[];
}

export interface UpdateProfileRequest {
  userName?: string;
  email?: string;
  about?: string;
  avatarUrl?: string;
}

// ==================== API Functions ====================

/**
 * Проверяет, существует ли пользователь с указанным email
 */
export async function checkEmailExists(email: string): Promise<CheckExistsResponse> {
  return httpClient.get<CheckExistsData>(API_ENDPOINTS.AUTH.CHECK_EMAIL, {
    params: { email },
    requiresAuth: false,
  });
}

/**
 * Логин пользователя
 */
export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  const response = await httpClient.post<AuthData>(
    API_ENDPOINTS.AUTH.LOGIN,
    credentials,
    { requiresAuth: false }
  );

  // Сохраняем токены после успешного логина
  if (response.success && response.data.accessToken) {
    TokenManager.setTokens(response.data.accessToken, response.data.refreshToken);
  }

  return response;
}

/**
 * Регистрация нового пользователя
 * Возвращает CreateEntityResponse с isSuccess и message
 */
export async function register(userData: RegisterRequest): Promise<CreateEntityResponse> {
  try {
    const response = await httpClient.post<any>(
      API_ENDPOINTS.AUTH.REGISTER,
      userData,
      { requiresAuth: false }
    );

    return {
      isSuccess: response.data?.isSuccess !== false,
      message: response.message || 'Регистрация успешна',
      data: response.data,
    };
  } catch (error: any) {
    // Специальная обработка ошибок регистрации
    throw {
      message: error.message || 'Ошибка регистрации',
      errors: error.errors,
      status: error.status,
    } as ApiError;
  }
}

/**
 * Google OAuth логин
 */
export async function googleLogin(googleToken?: string): Promise<AuthResponse> {
  const config = googleToken
    ? {
        headers: { Authorization: `Bearer ${googleToken}` },
        requiresAuth: false,
      }
    : { requiresAuth: false };

  const body = googleToken ? { token: googleToken } : undefined;

  const response = await httpClient.post<AuthData>(
    API_ENDPOINTS.AUTH.GOOGLE_LOGIN,
    body,
    config
  );

  // Сохраняем токены после успешного логина
  if (response.success && response.data.accessToken) {
    TokenManager.setTokens(response.data.accessToken, response.data.refreshToken);
  }

  return response;
}

/**
 * Обновление access token с помощью refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<AuthResponse> {
  const response = await httpClient.get<AuthData>(API_ENDPOINTS.AUTH.REFRESH, {
    params: { refreshToken },
    requiresAuth: false,
  });

  // Обновляем токены
  if (response.success && response.data.accessToken) {
    TokenManager.setTokens(response.data.accessToken, response.data.refreshToken);
  }

  return response;
}

/**
 * Выход из системы
 */
export async function logout(accessToken?: string): Promise<void> {
  try {
    await httpClient.post<void>(API_ENDPOINTS.AUTH.LOGOUT, undefined, {
      requiresAuth: true,
    });
  } finally {
    // Очищаем токены независимо от результата запроса
    TokenManager.clearTokens();
  }
}

/**
 * Получает профиль текущего пользователя
 */
export async function getProfile(accessToken?: string): Promise<ApiResponse<UserProfile>> {
  return httpClient.get<UserProfile>(API_ENDPOINTS.USER.BASE, {
    requiresAuth: true,
  });
}

/**
 * Обновляет профиль текущего пользователя
 */
export async function updateProfile(
  accessToken: string,
  profileData: UpdateProfileRequest
): Promise<ApiResponse<UserProfile>> {
  return httpClient.put<UserProfile>(API_ENDPOINTS.USER.BASE, profileData, {
    requiresAuth: true,
  });
}

// Экспортируем ApiResponse для обратной совместимости
export type { ApiResponse };
