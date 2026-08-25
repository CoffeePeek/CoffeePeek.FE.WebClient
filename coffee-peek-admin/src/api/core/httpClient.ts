import { ApiResponse, ApiConfig, RequestOptions } from './types';
import { API_BASE_URL, buildUrlWithParams } from './apiConfig';
import {
  requestInterceptor,
  responseInterceptor,
  normalizeResponseData,
  TokenManager,
  isAuthTokenEndpoint,
  tryRefreshAccessToken,
  ensureFreshAccessToken,
  pickAuthTokens,
} from './interceptors';
import { isTokenExpired } from '../../utils/jwt';
import { emitSessionInvalidated } from '../../realtime/forceLogout';

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

    if (!_retry && !skipAuthHeader && !isAuthTokenEndpoint(endpoint)) {
      const fresh = await ensureFreshAccessToken(this.baseURL);
      const access = TokenManager.getAccessToken();
      if (!fresh && (!access || isTokenExpired(access))) {
        if (access || TokenManager.getRefreshToken()) {
          TokenManager.clearTokens();
          emitSessionInvalidated('session_revoked');
        }
        throw { status: 401, message: 'Не авторизован' };
      }
    }

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
        const hadSession = !!TokenManager.getAccessToken() || !!TokenManager.getRefreshToken();
        const refreshed = await tryRefreshAccessToken(this.baseURL);
        if (refreshed) {
          return this.request<T>(endpoint, { ...options, _retry: true });
        }
        if (hadSession) {
          TokenManager.clearTokens();
          emitSessionInvalidated('session_revoked');
        }
      }

      const { envelope, pagination } = await responseInterceptor<any>(response, fullUrl);
      let payload = envelope.data ?? envelope;
      if (isAuthTokenEndpoint(endpoint)) {
        const fromEnvelope = pickAuthTokens(envelope);
        const fromPayload = pickAuthTokens(payload);
        const accessToken = fromPayload.accessToken ?? fromEnvelope.accessToken;
        const refreshToken = fromPayload.refreshToken ?? fromEnvelope.refreshToken;
        if (accessToken && payload && typeof payload === 'object') {
          payload = { ...payload, accessToken, ...(refreshToken ? { refreshToken } : {}) };
        }
      }
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
