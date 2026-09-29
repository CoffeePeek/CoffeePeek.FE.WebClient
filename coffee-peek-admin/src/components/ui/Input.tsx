import React from 'react';
import { cn } from '../../lib/utils';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        'flex h-9 w-full rounded-md border border-border-light bg-white px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:cursor-not-allowed disabled:opacity-50 dark:border-border-dark dark:bg-surface-dark dark:text-white dark:placeholder:text-stone-500',
        (type === 'checkbox' || type === 'radio') && 'h-4 w-4 shrink-0 accent-primary p-0 shadow-none',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
