'use client';

import { TicketIcon, AlertCircle, Shield, Timer } from 'lucide-react';
import { Header } from '@/components/layout/header';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { useDashboard } from '@/hooks/use-dashboard';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { data, isLoading, error } = useDashboard();

  return (
    <div className="flex flex-col h-full">
      <Header title="Dashboard" />
      <div className="p-6 space-y-6">
        {isLoading && (
          <div className="flex items-center justify-center h-48">
            <p className="text-text-secondary text-sm">Carregando KPIs...</p>
          </div>
        )}

        {error && (
          <div className="bg-danger/10 border border-danger/30 rounded-lg p-4">
            <p className="text-danger text-sm">Erro ao carregar dados do dashboard.</p>
          </div>
        )}

        {!error && data && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <KpiCard
                label="Chamados Abertos"
                value={data.totalOpen}
                icon={TicketIcon}
                color="blue"
              />
              <KpiCard
                label="Atrasados"
                value={data.totalOverdue}
                icon={AlertCircle}
                color="red"
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
              />
              <KpiCard
                label="Tempo Médio (h)"
                value={data.avgResolutionHours.toFixed(1)}
                icon={Timer}
                color="blue"
              />
            </div>

            <div className="bg-card border border-border rounded-lg p-5">
              <h2 className="text-text-primary font-semibold mb-4 text-sm uppercase tracking-widest">
                Atividade Recente
              </h2>
              {data.recentActivity.length === 0 ? (
                <p className="text-text-muted text-sm">Nenhuma atividade recente.</p>
              ) : (
                <div className="space-y-0">
                  {data.recentActivity.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between py-3 border-b border-border last:border-0"
                    >
                      <div>
                        <p className="text-text-primary text-sm font-medium">{item.title}</p>
                        <p className="text-text-muted text-xs">{item.sector.name}</p>
                      </div>
                      <span
                        className={cn(
                          'text-xs px-2 py-1 rounded-full font-medium',
                          item.status === 'aberto' && 'bg-info/20 text-info',
                          item.status === 'em_andamento' && 'bg-success/20 text-success',
                          item.status === 'aguardando' && 'bg-warning/20 text-warning',
                          item.status === 'escalado' && 'bg-danger/20 text-danger',
                          item.status === 'finalizado' && 'bg-surface text-text-secondary',
                          item.status === 'cancelado' && 'bg-surface text-text-muted'
                        )}
                      >
                        {item.status.replaceAll('_', ' ')}
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
