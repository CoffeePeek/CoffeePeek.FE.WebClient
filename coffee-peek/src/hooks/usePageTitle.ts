import { useEffect } from 'react';

/**
 * Хук для установки title страницы
 * Формат: "CoffeePeek | {название страницы}"
 */
export function usePageTitle(title: string): void {
  useEffect(() => {
    const fullTitle = title ? `CoffeePeek | ${title}` : 'CoffeePeek';
    document.title = fullTitle;

    // Очистка при размонтировании (возвращаем дефолтный title)
    return () => {
      document.title = 'CoffeePeek';
    };
  }, [title]);
}

