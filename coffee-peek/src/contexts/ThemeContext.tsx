import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const THEME_KEY = 'theme';

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function isTheme(value: string | null): value is Theme {
  return value === 'dark' || value === 'light';
}

export function getStoredTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    return isTheme(saved) ? saved : 'dark';
  } catch {
    return 'dark';
  }
}

export function applyThemeToDocument(theme: Theme) {
  const root = document.documentElement;
  const isDark = theme === 'dark';

  root.setAttribute('data-theme', theme);
  root.classList.toggle('dark', isDark);
  root.classList.toggle('light', !isDark);

  document.body.setAttribute('data-theme', theme);
  document.body.classList.toggle('dark-theme', isDark);
  document.body.classList.toggle('light-theme', !isDark);
  document.body.classList.toggle('dark', isDark);

  if (isDark) {
    document.body.style.backgroundColor = '#1A1412';
    document.body.style.color = 'rgba(255, 255, 255, 0.87)';
  } else {
    document.body.style.backgroundColor = '#FAFAF9';
    document.body.style.color = '#1C1917';
  }

  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // ignore quota / private mode
  }
}

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => getStoredTheme());

  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
