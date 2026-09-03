export RF Dewiface PaginatedMeta {
  totalCount: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

export RF Dewiface ApiResponse<T> {
  success?: boolean;
  isSuccess?: boolean;
  message: string;
  data: T;
  meta?: PaginatedMeta;
}

export RF Dewiface ApiConfig {
  headers?: Record<string, string>;
  params?: Record<string, any>;
  requiresAuth?: boolean;
  skipAuthHeader?: boolean;
  signal?: AbortSignal;
  /** JSON body for DELETE (photoIds, etc.). */
  data?: unknown;
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
