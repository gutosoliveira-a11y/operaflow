'use client';

import { TicketIcon, AlertCircle, Shield, Timer, Activity } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { useDashboard } from '@/hooks/use-dashboard';
import { cn } from '@/lib/utils';
import type { KpiData, Priority, TicketStatus } from '@/types';

/* ─── Mini bar chart (no external library) ─── */
interface BarItem { label: string; value: number; color?: string }

function MiniBarChart({ data, title }: { data: BarItem[]; title: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="bg-card border border-border rounded-lg p-5">
      <h2 className="text-text-muted text-xs uppercase tracking-widest font-medium mb-4">{title}</h2>
      <div className="flex items-end gap-2 h-20">
        {data.map((d) => (
          <div key={d.label} className="flex-1 flex flex-col items-center gap-1.5">
            <span className="text-text-secondary text-[10px] font-medium tabular-nums">{d.value}</span>
            <div className="w-full rounded-t-sm overflow-hidden" style={{ height: '52px' }}>
              <div
                className="w-full rounded-t-sm transition-all duration-700"
                style={{
                  height: `${Math.max(4, (d.value / max) * 52)}px`,
                  background: d.color ?? 'rgba(79,110,247,0.7)',
                  marginTop: `${52 - Math.max(4, (d.value / max) * 52)}px`,
                  boxShadow: d.value > 0 ? `0 -2px 8px ${d.color ?? 'rgba(79,110,247,0.3)'}` : 'none',
                }}
              />
            </div>
            <span className="text-text-muted text-[9px] leading-tight text-center">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Helpers ─── */
const statusColor: Record<TicketStatus, string> = {
  aberto:       'bg-info/20 text-info border border-info/20',
  em_andamento: 'bg-success/20 text-success border border-success/20',
  aguardando:   'bg-warning/20 text-warning border border-warning/20',
  escalado:     'bg-danger/20 text-danger border border-danger/20',
  finalizado:   'bg-surface text-text-secondary border border-border',
  cancelado:    'bg-surface text-text-muted border border-border',
};

const statusLabel: Record<TicketStatus, string> = {
  aberto:       'Aberto',
  em_andamento: 'Em andamento',
  aguardando:   'Aguardando',
  escalado:     'Escalado',
  finalizado:   'Finalizado',
  cancelado:    'Cancelado',
};

const priorityColor: Record<Priority, string> = {
  critica: 'rgba(239,68,68,0.8)',
  alta:    'rgba(245,158,11,0.8)',
  media:   'rgba(59,130,246,0.8)',
  baixa:   'rgba(71,85,105,0.6)',
};

const priorityLabel: Record<Priority, string> = {
  critica: 'Crítica',
  alta:    'Alta',
  media:   'Média',
  baixa:   'Baixa',
};

function buildPriorityBars(data: KpiData['byPriority']): BarItem[] {
  const order: Priority[] = ['critica', 'alta', 'media', 'baixa'];
  return order.map((p) => ({
    label: priorityLabel[p],
    value: data.find((d) => d.priority === p)?.count ?? 0,
    color: priorityColor[p],
  }));
}

/* ─── Page ─── */
export default function DashboardPage() {
  const { data, isLoading, error } = useDashboard();

  return (
    <div className="flex flex-col h-full">
      <Header title="Dashboard" />

      <div className="p-6 space-y-5 animate-fade-in">
        {isLoading && (
          <div className="flex items-center justify-center h-48">
            <div className="flex flex-col items-center gap-3">
              <div className="w-6 h-6 border-2 border-accent/30 border-t-accent rounded-full animate-spin-slow" />
              <p className="text-text-secondary text-sm">Carregando KPIs...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="bg-danger/8 border border-danger/25 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
            <p className="text-danger text-sm">Erro ao carregar dados do dashboard.</p>
          </div>
        )}

        {!error && data && (
          <>
            {/* KPI grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                label="Chamados Abertos"
                value={data.totalOpen}
                icon={TicketIcon}
                color="blue"
                className="animate-fade-in-up delay-75"
              />
              <KpiCard
                label="Atrasados"
                value={data.totalOverdue}
                icon={AlertCircle}
                color="red"
                className="animate-fade-in-up delay-150"
              />
              <KpiCard
                label="Conformidade SLA"
                value={`${data.slaCompliance}%`}
                icon={Shield}
                color={
                  data.slaCompliance >= 80
                    ? 'green'
                    : data.slaCompliance >= 60
                    ? 'amber'
                    : 'red'
                }
                className="animate-fade-in-up delay-225"
              />
              <KpiCard
                label="Tempo Médio (h)"
                value={data.avgResolutionHours.toFixed(1)}
                icon={Timer}
                color="blue"
                className="animate-fade-in-up delay-300"
              />
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {data.byPriority.length > 0 && (
                <MiniBarChart
                  title="Chamados por Prioridade"
                  data={buildPriorityBars(data.byPriority)}
                />
              )}

              {data.bySector.length > 0 && (
                <MiniBarChart
                  title="Chamados por Setor"
                  data={data.bySector.slice(0, 6).map((s) => ({
                    label: s.sectorId.slice(0, 6),
                    value: s.count,
                    color: 'rgba(79,110,247,0.7)',
                  }))}
                />
              )}
            </div>

            {/* Recent activity */}
            <div className="bg-card border border-border rounded-lg p-5">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-4 h-4 text-text-muted" />
                <h2 className="text-text-muted text-xs uppercase tracking-widest font-medium">
                  Atividade Recente
                </h2>
              </div>

              {data.recentActivity.length === 0 ? (
                <p className="text-text-muted text-sm py-4 text-center">Nenhuma atividade recente.</p>
              ) : (
                <div className="space-y-0">
                  {data.recentActivity.map((item, idx) => (
                    <div
                      key={item.id}
                      className={cn(
                        'flex items-center justify-between py-3 border-b border-border last:border-0',
                        'hover:bg-surface/50 -mx-5 px-5 transition-colors duration-100 animate-slide-in-left'
                      )}
                      style={{ animationDelay: `${idx * 40}ms` }}
                    >
                      <div className="flex-1 min-w-0 mr-3">
                        <p className="text-text-primary text-sm font-medium truncate">{item.title}</p>
                        <p className="text-text-muted text-xs">{item.sector.name}</p>
                      </div>
                      <span
                        className={cn(
                          'text-[10px] px-2.5 py-1 rounded-full font-medium whitespace-nowrap shrink-0',
                          statusColor[item.status]
                        )}
                      >
                        {statusLabel[item.status]}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
