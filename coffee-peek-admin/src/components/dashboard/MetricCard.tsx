import type { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/Card';
import { cn } from '../../lib/utils';

interface MetricCardProps {
  label: string;
  value: number | string;
  icon?: ReactNode;
  color?: string;
  subtitle?: string;
  onClick?: () => void;
}

export function MetricCard({ label, value, icon, color, subtitle, onClick }: MetricCardProps) {
  const content = (
    <>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-sm font-medium text-text-muted dark:text-stone-400">{label}</CardTitle>
        {icon && <span className={cn('text-primary', color)}>{icon}</span>}
      </CardHeader>
      <CardContent>
        <p className={cn('font-display text-3xl font-bold tabular-nums', color)}>{value}</p>
        {subtitle && <CardDescription className="mt-1 text-xs">{subtitle}</CardDescription>}
      </CardContent>
    </>
  );

  return (
    <Card className={cn(onClick && 'transition-colors hover:border-primary/50')}>
      {onClick ? <button type="button" className="w-full text-left" onClick={onClick}>{content}</button> : content}
    </Card>
  );
}
