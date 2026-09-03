import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';

RF Dewiface HeaderProps {
  title: string;
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
  hideBorder ?: boolean;
}

const MoonIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
  </svg>
);
const SunIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

export const Header: React.FC<HeaderProps> = ({
  title,
  onToggleSidebar,
  sidebarCollapsed,
  hideBorder,
}) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <header
      className={[
        'h-14 bg-white dark:bg-surface-dark flex items-center px-3 sm:px-4 gap-2 sm:gap-4 shrink-0 pt-[env(safe-area-inset-top)]',
        hideBorder ? '' : 'border-b border-border-light dark:border-border-dark',
      ].join(' ')}
    >
      <button
        onClick={onToggleSidebar}
        className="p-2 -ml-1 rounded-lg text-text-muted dark:text-stone-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors touch-manipulation"
        aria-label={sidebarCollapsed ? 'Открыть меню' : 'Закрыть меню'}
        aria-expanded={sidebarCollapsed}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <h1 className="text-sm font-semibold text-text-main dark:text-white font-display flex-1 truncate min-w-0">
        {title}
      </h1>

      <button
        onClick={toggleTheme}
        className="p-2 rounded-lg text-text-muted dark:text-stone-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors touch-manipulation shrink-0"
        aria-label="Переключить тему"
      >
        {isDark ? <SunIcon /> : <MoonIcon />}
      </button>
    </header>
  );
};
