/**
 * Utility functions for error handling
 */

export interface ErrorInfo {
  code: number | string;
  title?: string;
  message?: string;
}

/**
 * Common error codes and their default messages
 */
export const ErrorCodes = {
  400: {
    title: 'Неверный запрос',
    message: 'Запрос содержит ошибки. Пожалуйста, проверьте введённые данные.'
  },
  401: {
    title: 'Требуется авторизация',
    message: 'Для доступа к этой странице необходимо войти в систему.'
  },
  403: {
    title: 'Доступ запрещён',
    message: 'У вас нет прав для доступа к этой странице.'
  },
  404: {
    title: 'Страница не найдена',
    message: 'К сожалению, запрашиваемая страница не существует. Возможно, она была перемещена или удалена.'
  },
  500: {
    title: 'Ошибка сервера',
    message: 'Произошла внутренняя ошибка сервера. Мы уже работаем над её устранением.'
  },
  502: {
    title: 'Ошибка сервера',
    message: 'Сервер временно недоступен. Пожалуйста, попробуйте позже.'
  },
  503: {
    title: 'Сервис недоступен',
    message: 'Сервис временно недоступен. Пожалуйста, попробуйте позже.'
  },
  504: {
    title: 'Превышено время ожидания',
    message: 'Сервер не отвечает. Пожалуйста, попробуйте позже.'
  },
  NETWORK: {
    title: 'Ошибка сети',
    message: 'Не удалось подключиться к серверу. Проверьте подключение к интернету.'
  },
  UNKNOWN: {
    title: 'Произошла ошибка',
    message: 'Что-то пошло не так. Пожалуйста, попробуйте позже.'
  }
} as const;

/**
 * Получает сообщение об ошибке на основе статус-кода
 * Фронтенд сам определяет сообщение, не используя сообщения с бэкенда
 */
export function getErrorMessageByStatus(status: number | undefined): string {
  if (!status) {
    return ErrorCodes.UNKNOWN.message;
  }

  // Ошибки сервера (500-599)
  if (status >= 500 && status < 600) {
    if (status === 502) return ErrorCodes[502].message;
    if (status === 503) return ErrorCodes[503].message;
    if (status === 504) return ErrorCodes[504].message;
    if (status === 500) return ErrorCodes[500].message;
    return 'Ошибка сервера. Пожалуйста, попробуйте позже.';
  }

  // Ошибки клиента (400-499)
  if (status >= 400 && status < 500) {
    if (status === 400) return ErrorCodes[400].message;
    if (status === 401) return ErrorCodes[401].message;
    if (status === 403) return ErrorCodes[403].message;
    if (status === 404) return ErrorCodes[404].message;
    return 'Ошибка запроса. Пожалуйста, проверьте введённые данные.';
  }

  return ErrorCodes.UNKNOWN.message;
}

/**
 * Formats error message from API response
 * Использует только статус-код, игнорирует сообщения с бэкенда
 */
export function formatApiError(error: any): ErrorInfo {
  // Проверяем статус в разных местах объекта ошибки
  const status = error?.status || error?.response?.status;
  
  if (status) {
    return {
      code: status,
      title: ErrorCodes[status as keyof typeof ErrorCodes]?.title || ErrorCodes.UNKNOWN.title,
      message: getErrorMessageByStatus(status)
    };
  }
  
  if (error?.code === 'ECONNREFUSED' || error?.message?.includes('fetch') || error?.message?.includes('network')) {
    return {
      code: 'NETWORK',
      ...ErrorCodes.NETWORK
    };
  }
  
  return {
    code: 'UNKNOWN',
    ...ErrorCodes.UNKNOWN
  };
}

/**
 * Checks if error is a network error
 */
export function isNetworkError(error: any): boolean {
  return error?.code === 'ECONNREFUSED' || 
         error?.message?.includes('fetch') || 
         error?.message?.includes('network') ||
         !navigator.onLine;
}

/**
 * Checks if error is an authentication error
 */
export function isAuthError(error: any): boolean {
  return error?.response?.status === 401 || error?.response?.status === 403;
}

/**
 * Получает сообщение об ошибке из объекта ошибки
 * Использует статус-код для определения сообщения, игнорируя сообщения с бэкенда
 */
export function getErrorMessage(error: any, context?: 'login' | 'register'): string {
  // Проверяем статус в разных местах объекта ошибки
  const status = error?.status || error?.response?.status;
  
  if (status) {
    // Для 401 в контексте логина/регистрации используем специальное сообщение
    if (status === 401 && (context === 'login' || context === 'register')) {
      return 'Неверный email или пароль.';
    }
    // Для 404 в контексте логина/регистрации используем специальное сообщение
    if (status === 404 && (context === 'login' || context === 'register')) {
      return 'Пользователь с таким email не найден.';
    }
    return getErrorMessageByStatus(status);
  }
  
  // Проверяем на сетевые ошибки
  if (error?.code === 'ECONNREFUSED' || error?.message?.includes('fetch') || error?.message?.includes('network')) {
    return ErrorCodes.NETWORK.message;
  }
  
  // Если есть errors (валидационные ошибки), показываем их
  if (error?.errors && typeof error.errors === 'object') {
    const errorMessages = Object.values(error.errors).flat();
    if (errorMessages.length > 0) {
      return errorMessages.join(', ');
    }
  }
  
  return ErrorCodes.UNKNOWN.message;
}


