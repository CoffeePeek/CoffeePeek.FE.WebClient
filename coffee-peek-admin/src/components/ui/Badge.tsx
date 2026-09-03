import React from 'react';
import { ModerationStatus } from '../../api/admin';

export type BadgeVariant = 'pending' | 'approved' | 'rejected' | 'info' | 'default';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-500/20 dark:text-yellow-300',
  approved: 'bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-500/20 dark:text-red-300',
  info: 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300',
  default: 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-stone-300',
};

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', children, className = '' }) => (
  <span
    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium font-body ${variantClasses[variant]} ${className}`}
  >
    {children}
  </span>
);

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
