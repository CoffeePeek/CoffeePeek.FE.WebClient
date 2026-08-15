import { ApiResponse, ApiConfig, RequestOptions } from './types';
import { API_BASE_URL, buildUrlWithParams } from './apiConfig';
import {
  requestInterceptor,
  responseInterceptor,
  normalizeResponseData,
  TokenManager,
  isAuthTokenEndpoint,
  tryRefreshAccessToken,
} from './interceptors';

class HttpClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions & { _retry?: boolean } = {}
  ): Promise<ApiResponse<T>> {
    const { params, requiresAuth = true, skipAuthHeader, _retry, ...fetchOptions } = options;

    const urlWithParams = buildUrlWithParams(endpoint, params);
    const fullUrl = `${this.baseURL}${urlWithParams}`;

    const requestOptions = requestInterceptor(
      fullUrl,
      { ...fetchOptions, skipAuthHeader },
      requiresAuth
    );

    try {
      const response = await fetch(fullUrl, requestOptions);

      const canRefresh =
        response.status === 401 &&
        !_retry &&
        !skipAuthHeader &&
        !isAuthTokenEndpoint(endpoint);

      if (canRefresh) {
        const refreshed = await tryRefreshAccessToken(this.baseURL);
        if (refreshed) {
          return this.request<T>(endpoint, { ...options, _retry: true });
        }
      }

      const { envelope, pagination } = await responseInterceptor<any>(response, fullUrl);
      const payload = envelope.data ?? envelope;
      const normalizedData = normalizeResponseData<T>(payload);

      return {
        success: true,
        isSuccess: envelope.isSuccess ?? envelope.success ?? true,
        message: envelope.message || '',
        data: normalizedData,
        meta: pagination,
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
      skipAuthHeader: config?.skipAuthHeader,
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
      skipAuthHeader: config?.skipAuthHeader,
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
