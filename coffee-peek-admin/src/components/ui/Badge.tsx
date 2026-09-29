import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { ModerationStatus } from '../../api/admin';
import { cn } from '../../lib/utils';

export type BadgeVariant = 'pending' | 'approved' | 'rejected' | 'info' | 'default';

const badgeVariants = cva('inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold transition-colors', {
  variants: {
    variant: {
      pending: 'border-amber-300/40 bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300',
      approved: 'border-emerald-300/40 bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
      rejected: 'border-red-300/40 bg-red-100 text-red-800 dark:bg-red-500/15 dark:text-red-300',
      info: 'border-blue-300/40 bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300',
      default: 'border-border-light bg-stone-100 text-stone-700 dark:border-border-dark dark:bg-white/10 dark:text-stone-300',
    },
  },
  defaultVariants: { variant: 'default' },
});

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export const Badge = ({ variant, className, ...props }: BadgeProps) => (
  <span className={cn(badgeVariants({ variant }), className)} {...props} />
);

export { badgeVariants };

export function statusToBadgeVariant(status: ModerationStatus): BadgeVariant {
  switch (status) {
    case 'Pending': return 'pending';
    case 'Approved': return 'approved';
    case 'Rejected': return 'rejected';
  }
}

export const statusLabels: Record<ModerationStatus, string> = {
  Pending: 'На модерации',
  Approved: 'Одобрено',
  Rejected: 'Отклонено',
};
