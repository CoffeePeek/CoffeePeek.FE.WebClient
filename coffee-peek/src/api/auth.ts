const API_BASE_URL = import.meta.env.VITE_API_URL || '';

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
 * Базовый интерфейс ответа от API
 * API может возвращать либо success, либо isSuccess
 */
export interface ApiResponse<TData> {
  success?: boolean;
  isSuccess?: boolean;
  message: string;
  data: TData;
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

export interface CheckExistsData {
  exists: boolean;
}

export interface CheckExistsResponse extends ApiResponse<CheckExistsData> {}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}

/**
 * Обрабатывает ответ от API
 * Все ответы приходят в формате Response<T> с полем data
 */
async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  const contentType = response.headers.get('content-type');
  
  if (!contentType?.includes('application/json')) {
    if (response.ok) {
      return { success: true, message: '', data: {} as T };
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const apiResponse = await response.json() as any;
  
  // Логируем ответ для отладки
  console.log('API response:', apiResponse);

  if (!response.ok) {
    const error: ApiError = {
      message: apiResponse.message || `HTTP error! status: ${response.status}`,
      errors: apiResponse.errors,
    };
    throw error;
  }

  // Проверяем успешность операции (API может использовать success или isSuccess)
  const isSuccess = apiResponse.success !== false && (apiResponse.isSuccess === true || apiResponse.success === true);
  
  if (!isSuccess) {
    const error: ApiError = {
      message: apiResponse.message || 'Request failed',
      errors: apiResponse.errors,
    };
    throw error;
  }

  // Нормализуем ответ к единому формату
  return {
    success: true,
    isSuccess: true,
    message: apiResponse.message || '',
    data: apiResponse.data,
  } as ApiResponse<T>;
}

/**
 * Проверяет, существует ли пользователь с указанным email
 */
export async function checkEmailExists(email: string): Promise<CheckExistsResponse> {
  const response = await fetch(`${API_BASE_URL}/api/Auth/check-exists?email=${encodeURIComponent(email)}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  return handleResponse<CheckExistsData>(response);
}

/**
 * Логин пользователя
 */
export async function login(credentials: LoginRequest): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/Auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  return handleResponse<AuthData>(response);
}

/**
 * Регистрация нового пользователя
 */
export async function register(userData: RegisterRequest): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/Auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(userData),
  });

  return handleResponse<AuthData>(response);
}

/**
 * Google OAuth логин
 */
export async function googleLogin(googleToken?: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/Auth/google/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(googleToken && { 'Authorization': `Bearer ${googleToken}` }),
    },
    ...(googleToken && { body: JSON.stringify({ token: googleToken }) }),
  });

  return handleResponse<AuthData>(response);
}

/**
 * Обновление access token с помощью refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/api/Auth/refresh?refreshToken=${encodeURIComponent(refreshToken)}`, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    },
  });

  return handleResponse<AuthData>(response);
}

/**
 * Выход из системы
 */
export async function logout(accessToken: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/Auth/logout`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Logout failed: ${response.status}`);
  }
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

/**
 * Получает профиль текущего пользователя
 */
export async function getProfile(accessToken: string): Promise<ApiResponse<UserProfile>> {
  const response = await fetch(`${API_BASE_URL}/api/User`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/json',
    },
  });

  return handleResponse<UserProfile>(response);
}

/**
 * Обновляет профиль текущего пользователя
 */
export async function updateProfile(accessToken: string, profileData: UpdateProfileRequest): Promise<ApiResponse<UserProfile>> {
  const response = await fetch(`${API_BASE_URL}/api/User`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(profileData),
  });

  return handleResponse<UserProfile>(response);
}

