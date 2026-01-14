/**
 * Цветовая палитра приложения
 * Основные цвета для светлой и темной темы
 */

export const COLORS = {
  // Основной акцентный цвет (золотой)
  primary: '#EAB308',
  primaryDark: '#CA8A04',
  primaryLight: '#FEF3C7',
  
  // Светлая тема
  light: {
    // Фоны
    background: '#FAFAF9',
    surface: '#FFFFFF',
    
    // Текст
    textPrimary: '#1C1917',
    textSecondary: '#78716C',
    
    // Границы и разделители
    border: '#E7E5E4',
  },
  
  // Темная тема
  dark: {
    // Фоны
    background: '#1A1412',
    surface: '#2D241F',
    
    // Текст
    textPrimary: '#FFFFFF',
    textSecondary: '#A39E93',
    
    // Границы и разделители
    border: '#3D2F28',
  },
  
  // Семантические цвета (используются редко, только для статусов)
  success: '#22C55E',
  error: '#EF4444',
};

/**
 * Получить цвета для текущей темы
 */
export const getThemeColors = (theme: 'light' | 'dark') => {
  return theme === 'dark' ? COLORS.dark : COLORS.light;
};





