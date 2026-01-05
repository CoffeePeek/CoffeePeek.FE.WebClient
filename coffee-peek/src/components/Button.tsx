import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { getThemeClasses } from '../utils/theme';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className = '', 
  ...props 
}) => {
  const { theme } = useTheme();
  const themeClasses = getThemeClasses(theme);
  const baseStyles = "py-2.5 px-4 rounded-xl font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2";
  
  const variants = {
    primary: "bg-[#EAB308] text-[#1A1412] hover:bg-[#FACC15] shadow-lg shadow-yellow-900/10",
    secondary: themeClasses.button.secondary,
    ghost: themeClasses.button.ghost
  };

  return (
    <button 
      type={props.type || 'button'}
      className={`${baseStyles} ${variants[variant]} ${className} relative`}
      disabled={isLoading || props.disabled}
      {...props}
    >
      <span className={isLoading ? 'opacity-0' : ''}>
        {children}
      </span>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </button>
  );
};

export default Button;
