import { ApiResponse, ApiConfig, RequestOptions } from './types';
import { API_BASE_URL, buildUrlWithParams } from './apiConfig';
import {
  requestInterceptor,
  responseInterceptor,
  normalizeResponseData,
  TokenManager,
} from './interceptors';

class HttpClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { params, requiresAuth = true, ...fetchOptions } = options;

    const urlWithParams = buildUrlWithParams(endpoint, params);
    const fullUrl = `${this.baseURL}${urlWithParams}`;

    const requestOptions = requestInterceptor(fullUrl, fetchOptions, requiresAuth);

    try {
      const response = await fetch(fullUrl, requestOptions);
      const data = await responseInterceptor<any>(response, fullUrl);
      const normalizedData = normalizeResponseData<T>(data.data ?? data);

      return {
        success: true,
        isSuccess: true,
        message: data.message || '',
        data: normalizedData,
      };
    } catch (error) {
      throw error;
    }
  }

  async get<T>(endpoint: string, config?: ApiConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'GET',
      params: config?.params,
      headers: config?.headers,
      requiresAuth: config?.requiresAuth,
      signal: config?.signal,
    });
  }

  async post<T>(endpoint: string, data?: unknown, config?: ApiConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data instanceof FormData ? data : JSON.stringify(data),
      params: config?.params,
      headers: config?.headers,
      requiresAuth: config?.requiresAuth,
      signal: config?.signal,
    });
  }

  async put<T>(endpoint: string, data?: unknown, config?: ApiConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data instanceof FormData ? data : JSON.stringify(data),
      params: config?.params,
      headers: config?.headers,
      requiresAuth: config?.requiresAuth,
      signal: config?.signal,
    });
  }

  async delete<T>(endpoint: string, config?: ApiConfig): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      params: config?.params,
      headers: config?.headers,
      requiresAuth: config?.requiresAuth,
      signal: config?.signal,
    });
  }

  async patch<T>(endpoint: string, data?: unknown, config?: ApiConfig): Promise<ApiResponse<T>> {
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

export const httpClient = new HttpClient(API_BASE_URL);
export { TokenManager };
export default HttpClient;
