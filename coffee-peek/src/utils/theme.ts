/**
 * Утилиты для работы с темами
 */

export type Theme = 'dark' | 'light';

export const getThemeClasses = (theme: Theme) => {
  if (theme === 'light') {
    return {
      // Backgrounds
      bg: {
        primary: 'bg-white',
        secondary: 'bg-gray-50',
        tertiary: 'bg-gray-100',
        card: 'bg-white',
        input: 'bg-white',
      },
      // Text
      text: {
        primary: 'text-gray-900',
        secondary: 'text-gray-600',
        tertiary: 'text-gray-500',
        inverse: 'text-white',
      },
      // Borders
      border: {
        default: 'border-gray-200',
        hover: 'border-gray-300',
        focus: 'border-[#EAB308]',
        active: 'border-[#EAB308]/30',
      },
      // Buttons
      button: {
        secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 border border-gray-300',
        ghost: 'bg-transparent text-gray-600 hover:text-gray-900',
      },
      // Shadows
      shadow: 'shadow-md shadow-gray-200/50',
    };
  }

  // Dark theme (default)
  return {
    // Backgrounds
    bg: {
      primary: 'bg-[#1A1412]',
      secondary: 'bg-[#2D241F]',
      tertiary: 'bg-[#3D2F28]',
      card: 'bg-[#2D241F]',
      input: 'bg-[#1A1412]',
    },
    // Text
    text: {
      primary: 'text-white',
      secondary: 'text-[#A39E93]',
      tertiary: 'text-[#5C544F]',
      inverse: 'text-[#1A1412]',
    },
    // Borders
    border: {
      default: 'border-[#3D2F28]',
      hover: 'border-[#4A3D35]',
      focus: 'border-[#EAB308]',
      active: 'border-[#EAB308]/30',
    },
    // Buttons
    button: {
      secondary: 'bg-[#2D241F] text-white hover:bg-[#3D2F28] border border-[#3D2F28]',
      ghost: 'bg-transparent text-[#A39E93] hover:text-white',
    },
    // Shadows
    shadow: 'shadow-lg shadow-black/20',
  };
};





