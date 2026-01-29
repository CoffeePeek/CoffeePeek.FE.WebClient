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
  createdAtUtc: string;
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

export interface UpdateAboutRequest {
  about: string;
}

export interface UpdateEmailRequest {
  email: string;
}

export interface UpdatePhoneNumberRequest {
  phoneNumber: string;
}

export interface UpdateUsernameRequest {
  username: string;
}

export interface UpdateAvatarRequest {
  storageKey: string;
  url: string;
  thumbnailUrl?: string;
}

// ==================== API Functions ====================

/**
 * Проверяет, существует ли пользователь с указанным email
 * @returns Promise с данными о существовании пользователя
 * - 200 OK: пользователь существует (data.exists = true)
 * - 404 NotFound: пользователь не существует (data.exists = false)
 */
export async function checkEmailExists(email: string): Promise<CheckExistsResponse> {
  try {
    const response = await httpClient.get<CheckExistsData>(API_ENDPOINTS.USER.EMAIL_EXISTS, {
      params: { email },
      requiresAuth: false,
    });
    // 200 OK - пользователь существует
    return {
      ...response,
      data: { exists: true },
    };
  } catch (error: any) {
    // 404 NotFound - пользователь не существует (это нормальная ситуация)
    if (error.status === 404) {
      return {
        success: true,
        isSuccess: true,
        message: 'Пользователь не найден',
        data: { exists: false },
      };
    }
    // Другие ошибки пробрасываем дальше
    throw error;
  }
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
 * Обновление tokens с помощью refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<AuthResponse> {
  const response = await httpClient.put<AuthData>(
    API_ENDPOINTS.AUTH.REFRESH,
    { refreshToken },
    {
      requiresAuth: true,
    }
  );

  // Обновляем токены
  if (response.success && response.data.accessToken) {
    TokenManager.setTokens(response.data.accessToken, response.data.refreshToken);
  }

  return response;
}

/**
 * Выход из системы
 */
export async function logout(): Promise<void> {
  try {
    await httpClient.delete<void>(API_ENDPOINTS.TOKEN.BASE, {
      requiresAuth: true,
    });
  } finally {
    TokenManager.clearTokens();
  }
}

/**
 * Получает профиль текущего пользователя
 */
export async function getProfile(): Promise<ApiResponse<UserProfile>> {
  return httpClient.get<UserProfile>(API_ENDPOINTS.USER.PROFILE, {
    requiresAuth: true,
  });
}

/**
 * Получает профиль пользователя по ID
 */
export async function getProfileByUserId(userId: string): Promise<ApiResponse<UserProfile>> {
  return httpClient.get<UserProfile>(API_ENDPOINTS.USER.BY_ID(userId), {
    requiresAuth: false, // Публичный профиль может быть доступен без авторизации
  });
}

/**
 * Обновляет информацию "о себе" пользователя
 */
export async function updateAbout(
  data: UpdateAboutRequest
): Promise<ApiResponse<string>> {
  return httpClient.patch<string>(API_ENDPOINTS.USER.UPDATE_ABOUT, data, {
    requiresAuth: true,
  });
}

/**
 * Обновляет email пользователя
 */
export async function updateEmail(
  data: UpdateEmailRequest
): Promise<ApiResponse<string>> {
  return httpClient.patch<string>(API_ENDPOINTS.USER.UPDATE_EMAIL, data, {
    requiresAuth: true,
  });
}

/**
 * Обновляет номер телефона пользователя
 */
export async function updatePhoneNumber(
  data: UpdatePhoneNumberRequest
): Promise<ApiResponse<string>> {
  return httpClient.patch<string>(API_ENDPOINTS.USER.UPDATE_PHONE_NUMBER, data, {
    requiresAuth: true,
  });
}

/**
 * Обновляет username пользователя
 */
export async function updateUsername(
  data: UpdateUsernameRequest
): Promise<ApiResponse<string>> {
  return httpClient.patch<string>(API_ENDPOINTS.USER.UPDATE_USERNAME, data, {
    requiresAuth: true,
  });
}

/**
 * Обновляет аватар пользователя
 */
export async function updateAvatar(
  data: UpdateAvatarRequest
): Promise<ApiResponse<any>> {
  return httpClient.put<any>(API_ENDPOINTS.USER.UPDATE_AVATAR, data, {
    requiresAuth: true,
  });
}

/**
 * Удаляет текущего пользователя
 */
export async function deleteUser(): Promise<ApiResponse<boolean>> {
  return httpClient.delete<boolean>(API_ENDPOINTS.USER.DELETE, {
    requiresAuth: true,
  });
}

/**
 * Повторно отправляет подтверждение email
 */
export async function resendEmailConfirmation(): Promise<ApiResponse<void>> {
  return httpClient.post<void>(API_ENDPOINTS.USER.EMAIL_CONFIRMATION, undefined, {
    requiresAuth: true,
  });
}

/**
 * Подтверждает email по токену
 */
export async function confirmEmail(token: string): Promise<ApiResponse<void>> {
  return httpClient.put<void>(
    API_ENDPOINTS.USER.EMAIL_CONFIRMATION,
    undefined,
    {
      params: { token },
      requiresAuth: false,
    }
  );
}

/**
 * Обновляет профиль текущего пользователя (legacy функция для обратной совместимости)
 * @deprecated Используйте отдельные функции updateAbout, updateEmail, updateUsername, updateAvatar
 */
export async function updateProfile(
  accessToken: string,
  profileData: UpdateProfileRequest
): Promise<ApiResponse<UserProfile>> {
  // Для обратной совместимости выполняем обновления по отдельности
  const updates: Promise<any>[] = [];
  
  if (profileData.about !== undefined) {
    updates.push(updateAbout({ about: profileData.about }));
  }
  
  if (profileData.email !== undefined) {
    updates.push(updateEmail({ email: profileData.email }));
  }
  
  if (profileData.userName !== undefined) {
    updates.push(updateUsername({ username: profileData.userName }));
  }
  
  if (profileData.avatarUrl !== undefined) {
    // Для аватара нужен полный объект UploadedPhotoDto
    // Здесь используем только url, что может быть недостаточно
    updates.push(updateAvatar({ 
      storageKey: '', 
      url: profileData.avatarUrl 
    }));
  }
  
  await Promise.all(updates);
  
  // Возвращаем обновленный профиль
  return getProfile();
}

// Экспортируем ApiResponse для обратной совместимости
export type { ApiResponse };
