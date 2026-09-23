import React from 'react';
import ErrorPage from '../pages/ErrorPage';
import { logger } from '../utils/logger';

interface State {
  hasError: boolean;
}

/** Без неё любая ошибка рендера (или повторно упавший lazy-чанк) даёт белый экран. */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    logger.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      // Полная перезагрузка: сбрасывает и состояние границы, и устаревшие чанки.
      return <ErrorPage errorCode={500} title="Что-то пошло не так" message="Не удалось отобразить страницу. Попробуйте открыть её заново." onGoHome={() => window.location.assign('/')} />;
    }
    return this.props.children;
  }
}
