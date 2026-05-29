import { type LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'red' | 'amber';
  subtitle?: string;
  trend?: { value: number; label?: string };
  className?: string;
}

const colorMap = {
  blue:  { text: 'text-info',    iconBg: 'bg-info/10',    glow: '0 0 24px rgba(59,130,246,0.12)' },
  green: { text: 'text-success', iconBg: 'bg-success/10', glow: '0 0 24px rgba(37,211,102,0.12)' },
  red:   { text: 'text-danger',  iconBg: 'bg-danger/10',  glow: '0 0 24px rgba(239,68,68,0.12)'  },
  amber: { text: 'text-warning', iconBg: 'bg-warning/10', glow: '0 0 24px rgba(245,158,11,0.12)' },
};

export function KpiCard({
  label,
  value,
  icon: Icon,
  color = 'blue',
  subtitle,
  trend,
  className,
}: KpiCardProps) {
  const c = colorMap[color];

  return (
    <div
      className={cn(
        'bg-card border border-border rounded-lg p-5 transition-all duration-200 cursor-default',
        'hover:border-accent/20',
        className
      )}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = c.glow + ', 0 4px 12px rgba(0,0,0,0.3)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = '';
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <p className="text-text-muted text-xs uppercase tracking-widest font-medium">{label}</p>
        <div className={cn('flex items-center justify-center w-9 h-9 rounded-lg', c.iconBg)}>
          <Icon className={cn('w-5 h-5', c.text)} />
        </div>
      </div>

      <p className="text-4xl font-bold text-text-primary tabular-nums">{value}</p>

      <div className="mt-2 flex items-center gap-1.5 min-h-[18px]">
        {trend !== undefined ? (
          <>
            {trend.value >= 0 ? (
              <TrendingUp className="w-3.5 h-3.5 text-success shrink-0" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5 text-danger shrink-0" />
            )}
            <span
              className={cn(
                'text-xs font-medium',
                trend.value >= 0 ? 'text-success' : 'text-danger'
              )}
            >
              {trend.value >= 0 ? '+' : ''}
              {trend.value}%
            </span>
            {trend.label && (
              <span className="text-text-muted text-xs">{trend.label}</span>
            )}
          </>
        ) : subtitle ? (
          <p className="text-text-muted text-xs">{subtitle}</p>
        ) : null}
      </div>
    </div>
  );
}
