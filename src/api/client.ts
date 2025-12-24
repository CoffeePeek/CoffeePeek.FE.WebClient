import type { BaseResponse, PaginationHeaders } from './types';

export class ApiError extends Error {
  public readonly status: number;
  public readonly data?: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Default production API domain (can be overridden by VITE_API_BASE_URL)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const LOCAL_API_URL = import.meta.env.LOCAL_API_URL;

// In development, use relative paths to go through Vite proxy (avoids CORS)
// In production, use full API URL
// Check if we're in development mode - Vite sets import.meta.env.DEV to true in dev
const isDevelopment = import.meta.env.DEV === true || import.meta.env.MODE === 'development';
const useLocalApi = import.meta.env.VITE_USE_LOCAL_API === 'true';

// Force empty BASE_URL in development to use Vite proxy
// This is critical to avoid CORS issues
const BASE_URL = (() => {
  // Always use proxy in dev mode (when running npm run dev)
  if (isDevelopment) {
    return ''; // Empty string = relative paths = Vite proxy
  }
  // In production, use full URL
  return useLocalApi ? LOCAL_API_URL : API_BASE_URL;
})();

const debugLog = (...args: unknown[]) => {
  if (isDevelopment) {
    // eslint-disable-next-line no-console
    console.log(...args);
  }
};

const warnLog = (...args: unknown[]) => {
  if (isDevelopment) {
    // eslint-disable-next-line no-console
    console.warn(...args);
  }
};

// Debug: log the base URL being used (dev only)
debugLog('API Client Environment:', {
  MODE: import.meta.env.MODE,
  DEV: import.meta.env.DEV,
  isDevelopment,
  BASE_URL: BASE_URL || '(empty - using Vite proxy)',
  useLocalApi,
  willUseProxy: BASE_URL === '',
});

// Warn if we're not using proxy in what seems like dev mode
if (BASE_URL !== '' && window.location.hostname === 'localhost') {
  warnLog('WARNING: Not using proxy but running on localhost!');
  warnLog('This can cause CORS errors. Make sure you are running "npm run dev"');
}

interface CacheEntry<T> {
  data: T & { headers?: PaginationHeaders };
  expiry: number;
}

class ApiClient {
  public baseURL: string;
  private cache = new Map<string, CacheEntry<any>>();

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private getPaginationHeaders(response: Response): PaginationHeaders {
    const paginationHeaders: PaginationHeaders = {};
    const totalCount = response.headers.get('X-Total-Count');
    const totalPages = response.headers.get('X-Total-Pages');
    const currentPage = response.headers.get('X-Current-Page');
    const pageSize = response.headers.get('X-Page-Size');

    if (totalCount) paginationHeaders['X-Total-Count'] = totalCount;
    if (totalPages) paginationHeaders['X-Total-Pages'] = totalPages;
    if (currentPage) paginationHeaders['X-Current-Page'] = currentPage;
    if (pageSize) paginationHeaders['X-Page-Size'] = pageSize;

    return paginationHeaders;
  }

  private attachHeaders<T>(data: T, response: Response): T & { headers?: PaginationHeaders } {
    const paginationHeaders = this.getPaginationHeaders(response);

    // Only objects can be safely spread/extended. For non-objects, we return the original value.
    if (data !== null && typeof data === 'object') {
      return { ...(data as Record<string, unknown>), headers: paginationHeaders } as T & {
        headers?: PaginationHeaders;
      };
    }

    // headers is optional in the return type; primitives can't carry it.
    return data as T & { headers?: PaginationHeaders };
  }

  private getAuthToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    
    if (!contentType || !contentType.includes('application/json')) {
      if (response.ok) {
        return {} as T;
      }
      throw new ApiError(`HTTP error! status: ${response.status}`, response.status);
    }

    const data = await response.json();

    if (!response.ok) {
      const error: BaseResponse = data;
      throw new ApiError(error.message || `HTTP error! status: ${response.status}`, response.status, data);
    }

    return data as T;
  }

  private async refreshAccessToken(): Promise<void> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    // Force relative path if on localhost (dev mode)
    const isLocalhost = typeof window !== 'undefined' && 
                       (window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1');
    const effectiveBaseURL = (isLocalhost && this.baseURL !== '') ? '' : this.baseURL;

    try {
      const response = await fetch(`${effectiveBaseURL}/api/auth/refresh?refreshToken=${encodeURIComponent(refreshToken)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/';
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      if (data.data?.accessToken && data.data?.refreshToken) {
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
      }
    } catch (error) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/';
      throw error;
    }
  }

  public clearCache(): void {
    this.cache.clear();
    debugLog('API Cache cleared');
  }

  private invalidateCache(endpoint: string) {
    const baseRoute = endpoint.split('?')[0];
    for (const key of this.cache.keys()) {
      if (key.startsWith(baseRoute)) {
        this.cache.delete(key);
      }
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T & { headers?: PaginationHeaders }> {
    const token = this.getAuthToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Force relative path if we're on localhost (dev mode)
    // This ensures we always use Vite proxy in development
    const isLocalhost = typeof window !== 'undefined' && 
                       (window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1');
    
    // In dev mode, use explicit localhost URL to ensure proxy is used
    let url: string;
    if (isLocalhost && this.baseURL === '') {
      // Use explicit localhost URL with current port to ensure proxy works
      const port = typeof window !== 'undefined' ? window.location.port : '3000';
      const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';
      url = `${protocol}//${window.location.hostname}:${port}${endpoint}`;
      debugLog('Using explicit localhost URL for proxy:', url);
    } else {
      url = `${this.baseURL}${endpoint}`;
    }
    
    debugLog('Making request:', options.method || 'GET', url);
    
    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        headers,
      });
    } catch (error) {
      // If CORS error and we're on localhost, provide helpful message
      if (isLocalhost && error instanceof TypeError) {
        // eslint-disable-next-line no-console
        console.error('CORS Error detected on localhost.');
        warnLog('This should not happen if using Vite proxy.');
        warnLog('Make sure you are running "npm run dev" (not "npm run build")');
        warnLog('Check that vite.config.ts proxy is configured correctly.');
        warnLog('Try restarting the dev server.');
      }
      throw error;
    }

    // If 401, try to refresh token and retry once
    if (response.status === 401 && token) {
      await this.refreshAccessToken();
      
      // Retry with new token
      const newToken = this.getAuthToken();
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
        response = await fetch(url, {
          ...options,
          headers,
        });
      }
    }

    const data = await this.handleResponse<T>(response);
    return this.attachHeaders(data, response);
  }

  async get<T>(
    endpoint: string,
    params?: Record<string, string | number | boolean | Array<string | number | boolean>>,
    extraHeaders?: HeadersInit,
    cacheTTL: number = 0
  ): Promise<T & { headers?: PaginationHeaders }> {
    let url = endpoint;
    if (params) {
      const searchParams = new URLSearchParams();
      for (const [key, value] of Object.entries(params)) {
        if (value === null || value === undefined) {
          continue; // Skip null/undefined values
        }
        if (Array.isArray(value)) {
          // For arrays, add each value separately (ASP.NET Core expects ?equipments=guid1&equipments=guid2)
          for (const item of value) {
            if (item !== null && item !== undefined) {
              searchParams.append(key, String(item));
            }
          }
        } else {
          searchParams.append(key, String(value));
        }
      }
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    if (cacheTTL > 0) {
      const cached = this.cache.get(url);
      if (cached && cached.expiry > Date.now()) {
        debugLog('Returning cached data for:', url);
        return cached.data;
      }
    }

    const result = await this.request<T>(url, { method: 'GET', headers: extraHeaders });

    if (cacheTTL > 0) {
      this.cache.set(url, {
        data: result,
        expiry: Date.now() + cacheTTL
      });
    }

    return result;
  }

  async post<T>(endpoint: string, data?: unknown, headers?: HeadersInit): Promise<T & { headers?: PaginationHeaders }> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      headers,
    });
  }

  async put<T>(endpoint: string, data?: unknown, headers?: HeadersInit): Promise<T & { headers?: PaginationHeaders }> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      headers,
    });
  }

  async delete<T>(endpoint: string, data?: unknown): Promise<T & { headers?: PaginationHeaders }> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async postFormData<T>(endpoint: string, formData: FormData): Promise<T & { headers?: PaginationHeaders }> {
    const token = this.getAuthToken();
    const headers: HeadersInit = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Force relative path if on localhost (dev mode)
    const isLocalhost = typeof window !== 'undefined' && 
                       (window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1');
    const effectiveBaseURL = (isLocalhost && this.baseURL !== '') ? '' : this.baseURL;

    let response = await fetch(`${effectiveBaseURL}${endpoint}`, {
      method: 'POST',
      body: formData,
      headers,
    });

    // If 401, try to refresh token and retry once
    if (response.status === 401 && token) {
      await this.refreshAccessToken();
      
      const newToken = this.getAuthToken();
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
        response = await fetch(`${effectiveBaseURL}${endpoint}`, {
          method: 'POST',
          body: formData,
          headers,
        });
      }
    }

    const data = await this.handleResponse<T>(response);
    return this.attachHeaders(data, response);
  }

  async putFormData<T>(endpoint: string, formData: FormData): Promise<T & { headers?: PaginationHeaders }> {
    const token = this.getAuthToken();
    const headers: HeadersInit = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Force relative path if on localhost (dev mode)
    const isLocalhost = typeof window !== 'undefined' && 
                       (window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1');
    const effectiveBaseURL = (isLocalhost && this.baseURL !== '') ? '' : this.baseURL;

    let response = await fetch(`${effectiveBaseURL}${endpoint}`, {
      method: 'PUT',
      body: formData,
      headers,
    });

    // If 401, try to refresh token and retry once
    if (response.status === 401 && token) {
      await this.refreshAccessToken();
      
      const newToken = this.getAuthToken();
      if (newToken) {
        headers['Authorization'] = `Bearer ${newToken}`;
        response = await fetch(`${effectiveBaseURL}${endpoint}`, {
          method: 'PUT',
          body: formData,
          headers,
        });
      }
    }

    const data = await this.handleResponse<T>(response);
    return this.attachHeaders(data, response);
  }
}

export const apiClient = new ApiClient(BASE_URL);

