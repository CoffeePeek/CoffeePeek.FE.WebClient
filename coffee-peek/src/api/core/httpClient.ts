/**
 * Централизованный HTTP клиент для всех API запросов
 * Обеспечивает единый интерфейс для работы с API
 */

import { ApiResponse, ApiConfig, RequestOptions } from './types';
import { API_BASE_URL, buildUrlWithParams } from './apiConfig';
import {
  requestInterceptor,
  responseInterceptor,
  normalizeResponseData,
  TokenManager,
} from './interceptors';

/**
 * Базовый HTTP клиент
 */
class HttpClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  /**
   * Выполняет HTTP запрос
   */
  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { params, requiresAuth = true, ...fetchOptions } = options;

    // Строим URL с параметрами
    const urlWithParams = buildUrlWithParams(endpoint, params);
    const fullUrl = `${this.baseURL}${urlWithParams}`;

    // Применяем request interceptor
    const requestOptions = requestInterceptor(fullUrl, fetchOptions, requiresAuth);

    try {
      // Выполняем запрос
      const response = await fetch(fullUrl, requestOptions);

      // Применяем response interceptor
      const data = await responseInterceptor<any>(response, fullUrl);

      // Нормализуем данные
      const normalizedData = normalizeResponseData<T>(data.data || data);

      // Возвращаем унифицированный ответ
      return {
        success: true,
        isSuccess: true,
        message: data.message || '',
        data: normalizedData,
      };
    } catch (error) {
      // Пробрасываем ошибку дальше для обработки в компонентах
      throw error;
    }
  }

  /**
   * GET запрос
   */
  async get<T>(endpoint: string, config?: ApiConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'GET',
      params: config?.params,
      headers: config?.headers,
      requiresAuth: config?.requiresAuth,
      signal: config?.signal,
    });
  }

  /**
   * POST запрос
   */
  async post<T>(
    endpoint: string,
    data?: any,
    config?: ApiConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
      params: config?.params,
      headers: config?.headers,
      requiresAuth: config?.requiresAuth,
      signal: config?.signal,
    });
  }

  /**
   * PUT запрос
   */
  async put<T>(
    endpoint: string,
    data?: any,
    config?: ApiConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data instanceof FormData ? data : JSON.stringify(data),
      params: config?.params,
      headers: config?.headers,
      requiresAuth: config?.requiresAuth,
      signal: config?.signal,
    });
  }

  /**
   * DELETE запрос
   */
  async delete<T>(endpoint: string, config?: ApiConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      params: config?.params,
      headers: config?.headers,
      requiresAuth: config?.requiresAuth,
      signal: config?.signal,
    });
  }

  /**
   * PATCH запрос
   */
  async patch<T>(
    endpoint: string,
    data?: any,
    config?: ApiConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data instanceof FormData ? data : JSON.stringify(data),
      params: config?.params,
      headers: config?.headers,
      requiresAuth: config?.requiresAuth,
      signal: config?.signal,
    });
  }
}

// Экспортируем singleton instance
export const httpClient = new HttpClient(API_BASE_URL);

// Экспортируем TokenManager для использования в других модулях
export { TokenManager };

// Экспортируем класс для тестирования или создания дополнительных инстансов
export default HttpClient;
