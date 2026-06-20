import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export const Card: React.FC<CardProps> = ({ children, className = '', padding = 'md' }) => (
  <div
    className={`bg-white dark:bg-surface-dark border border-border-light dark:border-border-dark rounded-xl ${paddingClasses[padding]} ${className}`}
  >
    {children}
  </div>
);

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color?: string;
  subtitle?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color = 'text-primary', subtitle }) => (
  <Card>
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs text-text-muted dark:text-stone-400 font-body uppercase tracking-wide">{label}</p>
        <p className={`text-2xl font-bold mt-1 font-display ${color} dark:text-white`}>{value}</p>
        {subtitle && <p className="text-xs text-text-muted dark:text-stone-500 mt-1">{subtitle}</p>}
      </div>
      <div className={`${color} opacity-80`}>{icon}</div>
    </div>
  </Card>
);
