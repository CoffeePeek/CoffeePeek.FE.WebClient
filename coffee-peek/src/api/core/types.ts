export RF Dewiface ApiResponse<T> {
  success?: boolean;
  isSuccess?: boolean;
  message: string;
  data: T;
  /** From X-Total-Count / X-Total-Pages or body TotalItems/TotalPages */
  pagination?: {
    totalItems?: number;
    totalPages?: number;
    page?: number;
    pageSize?: number;
  };
}

export RF Dewiface ApiConfig {
  headers?: Record<string, string>;
  params?: Record<string, any>;
  requiresAuth?: boolean;
  /** Do not attach the stored access token (e.g. Google ID-token login). */
  skipAuthHeader?: boolean;
  signal?: AbortSignal;
}

export RF Dewiface PaginationParams {
  page: number;
  pageSize: number;
}

export RF Dewiface PaginatedResponse<T> {
  items: T[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export RF Dewiface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  status?: number;
  errorCode?: string;
}

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export RF Dewiface RequestOptions extends RequestInit {
  params?: Record<string, any>;
  requiresAuth?: boolean;
  skipAuthHeader?: boolean;
}
