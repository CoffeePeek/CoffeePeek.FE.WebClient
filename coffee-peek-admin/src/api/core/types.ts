export interface PaginatedMeta {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface ApiResponse<T> {
  success?: boolean;
  isSuccess?: boolean;
  message: string;
  data: T;
  meta?: PaginatedMeta;
}

export interface ApiConfig {
  headers?: Record<string, string>;
  params?: Record<string, any>;
  requiresAuth?: boolean;
  skipAuthHeader?: boolean;
  signal?: AbortSignal;
  /** JSON body for DELETE (photoIds, etc.). */
  data?: unknown;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  status?: number;
  errorCode?: string;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface RequestOptions extends RequestInit {
  params?: Record<string, any>;
  requiresAuth?: boolean;
  skipAuthHeader?: boolean;
}
