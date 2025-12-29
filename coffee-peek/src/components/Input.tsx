
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({ label, icon, className = '', ...props }) => {
  return (
    <div className="space-y-2 w-full">
      {label && (
        <label className="block text-sm font-medium text-[#A39E93] ml-1">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A39E93]">
            {icon}
          </div>
        )}
        <input
          className={`
            w-full bg-[#2D241F] border border-[#3D2F28] rounded-2xl py-4 
            ${icon ? 'pl-12' : 'px-4'} pr-4 text-white placeholder-[#5C544F]
            focus:outline-none focus:ring-2 focus:ring-[#EAB308]/20 focus:border-[#EAB308]
            transition-all duration-200 ${className}
          `}
          {...props}
        />
      </div>
    </div>
  );
};

export default Input;
