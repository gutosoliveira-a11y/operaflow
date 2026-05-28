import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'red' | 'amber';
  subtitle?: string;
}

const colorMap: Record<'blue' | 'green' | 'red' | 'amber', string> = {
  blue: 'text-info',
  green: 'text-success',
  red: 'text-danger',
  amber: 'text-warning',
};

export function KpiCard({ label, value, icon: Icon, color = 'blue', subtitle }: KpiCardProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-text-secondary text-xs uppercase tracking-widest font-medium">
          {label}
        </p>
        <Icon className={cn('w-5 h-5', colorMap[color])} />
      </div>
      <p className="text-4xl font-bold text-text-primary">{value}</p>
      {subtitle && <p className="text-text-muted text-xs mt-2">{subtitle}</p>}
    </div>
  );
}
