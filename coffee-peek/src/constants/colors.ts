/**
 * Цветовая палитра приложения
 * Основные цвета для светлой и темной темы
 */

export const COLORS = {
  // Основной акцентный цвет (золотой)
  primary: '#EAB308',
  primaryHover: '#FACC15',
  primaryDark: '#CA8A04',
  primaryLight: '#FEF3C7',
  
  // Светлая тема
  light: {
    // Фоны
    background: '#FAFAF9',
    surface: '#FFFFFF',
    surfaceAlt: '#F9F8F6', // Альтернативный surface для карточек
    card: '#FFFFFF',
    input: '#FFFFFF',
    badge: '#F3F4F6',
    
    // Текст
    textPrimary: '#1C1917',
    textSecondary: '#78716C',
    textMuted: '#75706B',
    textTertiary: '#6B7280',
    
    // Границы и разделители
    border: '#E7E5E4',
    borderSubtle: '#E5E1DA',
    borderHover: '#D1D5DB',
  },
  
  // Темная тема
  dark: {
    // Фоны
    background: '#1A1412',
    surface: '#2D241F',
    surfaceAlt: '#2D241F',
    card: '#2D241F',
    input: '#1A1412',
    badge: '#2D241F',
    
    // Текст
    textPrimary: '#FFFFFF',
    textSecondary: '#A39E93',
    textMuted: '#A8A8A8',
    textTertiary: '#5C544F',
    
    // Границы и разделители
    border: '#3D2F28',
    borderSubtle: '#3D2F28',
    borderHover: '#4A3D35',
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