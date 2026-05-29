'use client';

interface Bar {
  label: string;
  value: number;
}

interface MiniBarChartProps {
  bars: Bar[];
  colorClass?: string;
  maxValue?: number;
}

export function MiniBarChart({ bars, colorClass = 'bg-accent', maxValue }: MiniBarChartProps) {
  const max = maxValue ?? Math.max(...bars.map((b) => b.value), 1);

  return (
    <div className="flex items-end gap-1.5 h-16">
      {bars.map((bar) => {
        const pct = max > 0 ? Math.round((bar.value / max) * 100) : 0;
        return (
          <div key={bar.label} className="flex flex-col items-center gap-1 flex-1 min-w-0">
            <div className="w-full flex items-end" style={{ height: '48px' }}>
              <div
                className={`w-full rounded-sm transition-all duration-300 ${colorClass}`}
                style={{ height: `${Math.max(pct, 4)}%`, opacity: 0.8 + pct * 0.002 }}
                title={`${bar.label}: ${bar.value}`}
              />
            </div>
            <span className="text-text-muted text-[9px] truncate w-full text-center leading-none">
              {bar.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
