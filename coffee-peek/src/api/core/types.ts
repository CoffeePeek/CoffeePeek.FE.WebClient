export interface ApiResponse<T> {
  success?: boolean;
  isSuccess?: boolean;
  message: string;
  data: T;
}

export interface ApiConfig {
  headers?: Record<string, string>;
  params?: Record<string, any>;
  requiresAuth?: boolean;
  signal?: AbortSignal;
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
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface RequestOptions extends RequestInit {
  params?: Record<string, any>;
  requiresAuth?: boolean;
}
