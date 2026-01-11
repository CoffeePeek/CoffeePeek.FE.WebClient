/**
 * Глобальный обработчик ошибок для показа уведомлений
 */

type ErrorHandler = (message: string) => void;

let globalErrorHandler: ErrorHandler | null = null;

/**
 * Устанавливает глобальный обработчик ошибок
 */
export function setGlobalErrorHandler(handler: ErrorHandler) {
  globalErrorHandler = handler;
}

/**
 * Показывает уведомление об ошибке сервера (500)
 */
export function showServerErrorNotification() {
  if (globalErrorHandler) {
    globalErrorHandler('Сервер сейчас недоступен. Пожалуйста, попробуйте позже.');
  }
}

/**
 * Проверяет, является ли ошибка ошибкой сервера (500-599)
 */
export function isServerError(status: number): boolean {
  return status >= 500 && status < 600;
}






