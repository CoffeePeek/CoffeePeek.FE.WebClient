/**
 * API модуль для аутентификации и профиля пользователя
 */

import { httpClient, TokenManager } from './core/httpClient';
import { API_ENDPOINTS } from './core/apiConfig';
import { ApiResponse } from './core/types';
import { pickAuthTokens } from './core/interceptors';

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

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface UploadedPhotoDto {
  fileName: string;
  contentType: string;
  storageKey: string;
  size: number; // long
}

export interface UpdateAvatarRequest {
  uploadedPhoto: UploadedPhotoDto;
}

// ==================== API Functions ====================

/**
 * Проверяет, существует ли пользователь с указанным email.
 * Бэкенд отвечает 200 и `data: true | false`. Старый контракт 404 = нет пользователя тоже поддерживается.
 */
function parseEmailExists(data: unknown): boolean {
  if (typeof data === 'boolean') return data;
  if (data && typeof data === 'object' && 'exists' in data) {
    return Boolean((data as CheckExistsData).exists);
  }
  return false;
}

export async function checkEmailExists(email: string): Promise<CheckExistsResponse> {
  try {
    const response = await httpClient.get<boolean | CheckExistsData>(API_ENDPOINTS.USER.EMAIL_EXISTS, {
      params: { email },
      requiresAuth: false,
    });
    return {
      ...response,
      data: { exists: parseEmailExists(response.data) },
    };
  } catch (error: unknown) {
    const status = typeof error === 'object' && error !== null && 'status' in error
      ? Number((error as { status?: number }).status)
      : undefined;
    if (status === 404) {
      return {
        success: true,
        isSuccess: true,
        message: 'Пользователь не найден',
        data: { exists: false },
      };
    }
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
    { requiresAuth: false, skipAuthHeader: true }
  );

  const tokens = pickAuthTokens(response.data);
  if (response.success && tokens.accessToken) {
    TokenManager.setTokens(tokens.accessToken, tokens.refreshToken);
    if (response.data) {
      response.data.accessToken = tokens.accessToken;
      response.data.refreshToken = tokens.refreshToken;
    }
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
 * Google OAuth логин. Бэкенд ждёт Google ID token: { idToken }.
 */
export async function googleLogin(idToken: string): Promise<AuthResponse> {
  const response = await httpClient.post<AuthData>(
    API_ENDPOINTS.AUTH.GOOGLE_LOGIN,
    { idToken },
    { requiresAuth: false, skipAuthHeader: true }
  );

  if (response.success && response.data) {
    const tokens = pickAuthTokens(response.data);
    if (tokens.accessToken) {
      TokenManager.setTokens(tokens.accessToken, tokens.refreshToken);
      response.data.accessToken = tokens.accessToken;
      response.data.refreshToken = tokens.refreshToken;
    }
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
      requiresAuth: false,
      skipAuthHeader: true,
    }
  );

  if (response.success && response.data) {
    const tokens = pickAuthTokens(response.data);
    if (tokens.accessToken) {
      TokenManager.setTokens(tokens.accessToken, tokens.refreshToken);
      response.data.accessToken = tokens.accessToken;
      response.data.refreshToken = tokens.refreshToken;
    }
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
  return httpClient.patch<any>(API_ENDPOINTS.USER.UPDATE_AVATAR, data, {
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
 * Повторно отправляет подтверждение email (для авторизованных пользователей)
 */
export async function resendEmailConfirmation(): Promise<ApiResponse<void>> {
  return httpClient.post<void>(API_ENDPOINTS.USER.EMAIL_CONFIRMATION, undefined, {
    requiresAuth: true,
  });
}

/**
 * Повторно отправляет подтверждение email по адресу (публичный, без авторизации)
 */
export async function resendEmailConfirmationByEmail(email: string): Promise<ApiResponse<void>> {
  return httpClient.post<void>(API_ENDPOINTS.USER.EMAIL_CONFIRMATION_RESEND, { email }, {
    requiresAuth: false,
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
 * Смена пароля авторизованного пользователя.
 * Текущая сессия обычно остаётся живой.
 */
export async function changePassword(
  data: ChangePasswordRequest
): Promise<ApiResponse<void>> {
  return httpClient.put<void>(API_ENDPOINTS.USER.UPDATE_PASSWORD, data, {
    requiresAuth: true,
  });
}

/**
 * Запрос сброса пароля. API всегда отвечает успехом (письмо — если аккаунт с паролем).
 */
export async function forgotPassword(
  data: ForgotPasswordRequest
): Promise<ApiResponse<void>> {
  return httpClient.post<void>(API_ENDPOINTS.USER.PASSWORD_FORGOT, data, {
    requiresAuth: false,
  });
}

/**
 * Сброс пароля по токену из письма (.../reset-password?token=).
 * После успеха все сессии сбрасываются — нужен повторный логин.
 */
export async function resetPassword(
  data: ResetPasswordRequest
): Promise<ApiResponse<void>> {
  return httpClient.post<void>(API_ENDPOINTS.USER.PASSWORD_RESET, data, {
    requiresAuth: false,
  });
}


// Экспортируем ApiResponse для обратной совместимости
export type { ApiResponse };
