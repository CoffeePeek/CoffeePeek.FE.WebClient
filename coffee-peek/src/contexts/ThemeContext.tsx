import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as Theme) || 'dark';
  });

  // Применяем тему сразу при инициализации
  useEffect(() => {
    const applyTheme = (themeToApply: Theme) => {
      // Применяем тему к document и body
      document.documentElement.setAttribute('data-theme', themeToApply);
      document.body.setAttribute('data-theme', themeToApply);
      localStorage.setItem('theme', themeToApply);
      
      // Также применяем класс к body для совместимости
      if (themeToApply === 'light') {
        document.body.classList.add('light-theme');
        document.body.classList.remove('dark-theme');
        document.body.style.backgroundColor = '#ffffff';
        document.body.style.color = '#213547';
      } else {
        document.body.classList.add('dark-theme');
        document.body.classList.remove('light-theme');
        document.body.style.backgroundColor = '#1A1412';
        document.body.style.color = 'rgba(255, 255, 255, 0.87)';
      }
    };

    // Применяем тему при первой загрузке
    applyTheme(theme);
  }, []);

  // Применяем тему при изменении
  useEffect(() => {
    const applyTheme = (themeToApply: Theme) => {
      document.documentElement.setAttribute('data-theme', themeToApply);
      document.body.setAttribute('data-theme', themeToApply);
      localStorage.setItem('theme', themeToApply);
      
      if (themeToApply === 'light') {
        document.body.classList.add('light-theme');
        document.body.classList.remove('dark-theme');
        document.body.style.backgroundColor = '#ffffff';
        document.body.style.color = '#213547';
      } else {
        document.body.classList.add('dark-theme');
        document.body.classList.remove('light-theme');
        document.body.style.backgroundColor = '#1A1412';
        document.body.style.color = 'rgba(255, 255, 255, 0.87)';
      }
    };

    applyTheme(theme);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState(prev => prev === 'dark' ? 'light' : 'dark');
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

