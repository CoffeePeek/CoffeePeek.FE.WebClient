import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { LoaderCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-stone-950 shadow-sm hover:bg-primary-hover',
        secondary: 'border border-border-light bg-white text-text-main shadow-sm hover:bg-stone-100 dark:border-border-dark dark:bg-surface-dark dark:text-white dark:hover:bg-white/10',
        danger: 'bg-red-600 text-white shadow-sm hover:bg-red-700',
        ghost: 'text-text-muted hover:bg-stone-100 hover:text-text-main dark:text-stone-400 dark:hover:bg-white/10 dark:hover:text-white',
        success: 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-9 px-4',
        lg: 'h-10 px-6',
        icon: 'h-9 w-9 p-0',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  asChild?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  children,
  className,
  type = 'button',
  asChild = false,
  ...props
}) => {
  const Component = asChild ? Slot : 'button';
  return (
    <Component
      type={type}
      disabled={disabled || loading}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    >
      {loading && <LoaderCircle className="h-3.5 w-3.5 animate-spin" />}
      {children}
    </Component>
  );
};

export { buttonVariants };
