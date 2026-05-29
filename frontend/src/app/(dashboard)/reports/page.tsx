'use client';

import { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { useReports } from '@/hooks/use-reports';
import { MiniBarChart } from '@/components/dashboard/mini-bar-chart';

const PERIODS = [
  { value: 7,  label: '7 dias' },
  { value: 30, label: '30 dias' },
  { value: 90, label: '90 dias' },
];

const priorityLabel: Record<string, string> = {
  baixa: 'Baixa', media: 'Média', alta: 'Alta', critica: 'Crítica',
};

export default function ReportsPage() {
  const [period, setPeriod] = useState(30);
  const { data, isLoading } = useReports(period);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-text-primary">Relatórios</h1>
        <div className="flex gap-1 bg-surface border border-border rounded-lg p-1">
          {PERIODS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setPeriod(value)}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${period === value ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin-slow" />
        </div>
      )}

      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tickets por setor */}
          <div className="bg-surface border border-border rounded-lg p-5 space-y-4 animate-fade-in-up">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-accent" />
              </div>
              <h2 className="text-sm font-semibold text-text-primary">Tickets por Setor</h2>
            </div>
            <MiniBarChart
              bars={data.ticketsBySector.map(d => ({ label: d.sectorName.slice(0, 8), value: d.count }))}
              colorClass="bg-accent"
            />
            <div className="space-y-1.5 mt-2">
              {data.ticketsBySector.map(d => (
                <div key={d.sectorId} className="flex items-center justify-between text-xs">
                  <span className="text-text-secondary truncate">{d.sectorName}</span>
                  <span className="text-text-primary font-medium tabular-nums">{d.count}</span>
                </div>
              ))}
              {data.ticketsBySector.length === 0 && <p className="text-text-muted text-xs text-center py-2">Sem dados no período</p>}
            </div>
          </div>

          {/* Tempo médio por prioridade */}
          <div className="bg-surface border border-border rounded-lg p-5 space-y-4 animate-fade-in-up" style={{ animationDelay: '75ms' }}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-warning/10 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-warning" />
              </div>
              <h2 className="text-sm font-semibold text-text-primary">Tempo Médio de Resolução</h2>
            </div>
            <MiniBarChart
              bars={data.avgResolutionByPriority.map(d => ({ label: priorityLabel[d.priority] ?? d.priority, value: d.avgHours }))}
              colorClass="bg-warning"
            />
            <div className="space-y-1.5 mt-2">
              {data.avgResolutionByPriority.map(d => (
                <div key={d.priority} className="flex items-center justify-between text-xs">
                  <span className="text-text-secondary">{priorityLabel[d.priority] ?? d.priority}</span>
                  <span className="text-text-primary font-medium tabular-nums">{d.avgHours}h</span>
                </div>
              ))}
              {data.avgResolutionByPriority.length === 0 && <p className="text-text-muted text-xs text-center py-2">Sem dados no período</p>}
            </div>
          </div>

          {/* Conformidade SLA por setor */}
          <div className="bg-surface border border-border rounded-lg p-5 space-y-4 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-success/10 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-success" />
              </div>
              <h2 className="text-sm font-semibold text-text-primary">Conformidade SLA</h2>
            </div>
            <MiniBarChart
              bars={data.slaComplianceBySector.map(d => ({ label: d.sectorName.slice(0,8), value: d.compliance }))}
              colorClass="bg-success"
              maxValue={100}
            />
            <div className="space-y-1.5 mt-2">
              {data.slaComplianceBySector.map(d => (
                <div key={d.sectorId} className="flex items-center justify-between text-xs">
                  <span className="text-text-secondary truncate">{d.sectorName}</span>
                  <span className={`font-medium tabular-nums ${d.compliance >= 80 ? 'text-success' : d.compliance >= 60 ? 'text-warning' : 'text-danger'}`}>
                    {d.compliance}%
                  </span>
                </div>
              ))}
              {data.slaComplianceBySector.length === 0 && <p className="text-text-muted text-xs text-center py-2">Sem dados no período</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
