import React, { Component, ErrorInfo, ReactNode } from 'react';

type Props = {
  children: ReactNode;
};

type State = {
  hasError: boolean;
  message?: string;
};

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // In production this could be wired to Sentry/LogRocket/etc.
    console.error('App boundary error', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 p-6">
          <div className="max-w-md space-y-3 text-center">
            <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
              Что-то пошло не так
            </p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Мы уже разбираемся. Попробуйте обновить страницу или вернуться позже.
            </p>
            {this.state.message && (
              <p className="text-xs text-neutral-500 dark:text-neutral-500">
                {this.state.message}
              </p>
            )}
            <button
              className="px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition-colors"
              onClick={() => window.location.reload()}
            >
              Обновить
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

