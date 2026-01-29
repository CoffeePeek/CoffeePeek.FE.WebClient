/**
 * Утилиты для работы с темами
 */

import { COLORS } from '../constants/colors';

export type Theme = 'dark' | 'light';

/**
 * Конвертирует hex цвет в Tailwind класс
 */
const hexToTailwind = (hex: string, prefix: string = 'bg'): string => {
  return `${prefix}-[${hex}]`;
};

/**
 * Конвертирует hex цвет в Tailwind класс для текста
 */
const hexToTextTailwind = (hex: string): string => {
  return `text-[${hex}]`;
};

/**
 * Конвертирует hex цвет в Tailwind класс для границы
 */
const hexToBorderTailwind = (hex: string): string => {
  return `border-[${hex}]`;
};

export const getThemeClasses = (theme: Theme) => {
  const colors = theme === 'light' ? COLORS.light : COLORS.dark;
  return {
    // Backgrounds
    bg: {
      primary: hexToTailwind(colors.background),
      secondary: theme === 'light' ? 'bg-gray-50' : hexToTailwind(colors.surface),
      tertiary: theme === 'light' ? 'bg-gray-100' : hexToTailwind(colors.border),
      card: hexToTailwind(colors.card),
      cardTransparent: `${hexToTailwind(colors.background)}/90`,
      cardBackdrop: theme === 'light' ? 'bg-gray-50/80' : `${hexToTailwind(colors.surface)}/60`,
      input: hexToTailwind(colors.input),
      badge: hexToTailwind(colors.badge),
      surface: hexToTailwind(colors.surfaceAlt),
    },
    // Text
    text: {
      primary: hexToTextTailwind(colors.textPrimary),
      secondary: hexToTextTailwind(colors.textSecondary),
      tertiary: theme === 'light' ? 'text-gray-500' : hexToTextTailwind(colors.textTertiary),
      muted: hexToTextTailwind(colors.textMuted),
      inverse: theme === 'light' ? 'text-white' : hexToTextTailwind(COLORS.dark.background),
    },
    // Borders
    border: {
      default: theme === 'light' ? 'border-gray-200' : hexToBorderTailwind(colors.border),
      hover: theme === 'light' ? 'border-gray-300' : hexToBorderTailwind(colors.borderHover),
      focus: hexToBorderTailwind(COLORS.primary),
      active: `${hexToBorderTailwind(COLORS.primary)}/30`,
      activeHover: `hover:${hexToBorderTailwind(COLORS.primary)}/30`,
      badge: theme === 'light' ? 'border-gray-200' : hexToBorderTailwind(colors.border),
      subtle: hexToBorderTailwind(colors.borderSubtle),
    },
    // Effects
    effects: {
      glow: `${hexToTailwind(COLORS.primary)}/${theme === 'light' ? '10' : '5'}`,
      iconBg: `${hexToTailwind(COLORS.primary)}/10`,
      shadowCard: theme === 'light' ? 'shadow-gray-200/50' : 'shadow-black/50',
    },
    // Primary color (accent)
    primary: {
      text: hexToTextTailwind(COLORS.primary),
      bg: hexToTailwind(COLORS.primary),
      bgHover: `hover:${hexToTailwind(COLORS.primaryHover)}`,
      bgLight: `${hexToTailwind(COLORS.primary)}/10`,
      bgLighter: `${hexToTailwind(COLORS.primary)}/5`,
      border: hexToBorderTailwind(COLORS.primary),
      borderHover: `hover:${hexToBorderTailwind(COLORS.primary)}`,
      borderLight: `${hexToBorderTailwind(COLORS.primary)}/30`,
      borderLighter: `${hexToBorderTailwind(COLORS.primary)}/20`,
      hover: `hover:${hexToTextTailwind(COLORS.primary)}`,
      shadow: `shadow-[${COLORS.primary}]/5`,
      ring: `focus:ring-[${COLORS.primary}]/5`,
      ringFocus: `focus:ring-4 focus:ring-[${COLORS.primary}]/5`,
    },
    // Buttons
    button: {
      secondary: theme === 'light' 
        ? 'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-300'
        : `${hexToTailwind(colors.surface)} ${hexToTextTailwind(colors.textPrimary)} hover:${hexToTailwind(colors.border)} ${hexToBorderTailwind(colors.border)}`,
      ghost: theme === 'light'
        ? 'bg-transparent text-gray-600 hover:text-gray-900'
        : `bg-transparent ${hexToTextTailwind(colors.textSecondary)} hover:${hexToTextTailwind(colors.textPrimary)}`,
    },
    // Shadows
    shadow: theme === 'light' ? 'shadow-md shadow-gray-200/50' : 'shadow-lg shadow-black/20',
  };
};





