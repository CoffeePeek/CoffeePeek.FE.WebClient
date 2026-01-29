
import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/theme';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({ label, icon, className = '', type, ...props }) => {
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  return (
    <div className="space-y-2 w-full">
      {label && (
        <label className={`block text-sm font-medium ${themeClasses.text.secondary} ml-1`}>
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className={`absolute left-4 top-1/2 -translate-y-1/2 ${themeClasses.text.secondary} z-10`}>
            {icon}
          </div>
        )}
        <input
          type={inputType}
          className={`
            w-full ${themeClasses.bg.input} ${themeClasses.border.default} rounded-2xl py-4 
            ${icon ? 'pl-12' : 'px-4'} ${isPassword ? 'pr-12' : 'pr-4'} ${themeClasses.text.primary} ${themeClasses.text.tertiary.replace('text-', 'placeholder:text-')}
            focus:outline-none ${themeClasses.primary.ring.replace('focus:', 'focus:ring-2 focus:')} ${themeClasses.border.focus}
            transition-all duration-200 ${className}
          `}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className={`absolute right-4 top-1/2 -translate-y-1/2 ${themeClasses.text.secondary} ${themeClasses.primary.hover} transition-colors z-10`}
            aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
          >
            <span className="material-symbols-outlined text-xl">
              {showPassword ? 'visibility_off' : 'visibility'}
            </span>
          </button>
        )}
      </div>
    </div>
  );
};

export default Input;
