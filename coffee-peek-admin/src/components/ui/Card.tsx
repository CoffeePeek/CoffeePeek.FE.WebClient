import React from 'react';
import { cn } from '../../lib/utils';

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
    className={cn('rounded-xl border border-border-light bg-white text-text-main shadow-sm dark:border-border-dark dark:bg-surface-dark dark:text-white', paddingClasses[padding], className)}
  >
    {children}
  </div>
);

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />,
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => <h3 ref={ref} className={cn('font-display text-base font-semibold leading-none tracking-tight', className)} {...props} />,
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => <p ref={ref} className={cn('text-sm text-text-muted dark:text-stone-400', className)} {...props} />,
);
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />,
);
CardContent.displayName = 'CardContent';

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color?: string;
  subtitle?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  color = 'text-primary',
  subtitle,
  onClick,
}) => (
  <Card className={onClick ? 'cursor-pointer hover:border-primary/40 transition-colors' : ''}>
    <button
      type="button"
      className="w-full text-left disabled:cursor-default"
      onClick={onClick}
      disabled={!onClick}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-text-muted dark:text-stone-400 font-body uppercase tracking-wide">
            {label}
          </p>
          <p className={`text-2xl font-bold mt-1 font-display ${color} dark:text-white`}>{value}</p>
          {subtitle && <p className="text-xs text-text-muted dark:text-stone-500 mt-1">{subtitle}</p>}
        </div>
        <div className={`${color} opacity-80`}>{icon}</div>
      </div>
    </button>
  </Card>
);
