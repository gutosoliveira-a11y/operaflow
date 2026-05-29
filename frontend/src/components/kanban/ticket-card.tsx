'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Clock, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Ticket, Priority } from '@/types';

const priorityConfig: Record<Priority, { label: string; cls: string; bar: string }> = {
  critica: { label: 'CRÍTICA', cls: 'bg-danger/15 text-danger border-danger/40',   bar: 'bg-danger' },
  alta:    { label: 'ALTA',    cls: 'bg-warning/15 text-warning border-warning/40', bar: 'bg-warning' },
  media:   { label: 'MÉDIA',   cls: 'bg-info/15 text-info border-info/40',           bar: 'bg-info' },
  baixa:   { label: 'BAIXA',   cls: 'bg-surface text-text-secondary border-border',  bar: 'bg-text-muted' },
};

interface SlaInfo {
  text: string;
  overdue: boolean;
  percent: number; // 0-100, how much SLA time remains
}

function formatSla(slaDueDate: string | null, createdAt: string): SlaInfo {
  if (!slaDueDate) return { text: 'Sem SLA', overdue: false, percent: 100 };
  const now = Date.now();
  const due = new Date(slaDueDate).getTime();
  const created = new Date(createdAt).getTime();
  const diffMs = due - now;

  if (isNaN(diffMs)) return { text: 'Sem SLA', overdue: false, percent: 100 };

  const total = due - created;
  const remaining = due - now;
  const percent = total > 0 ? Math.max(0, Math.min(100, (remaining / total) * 100)) : 0;

  if (diffMs < 0) {
    const overdueH = Math.floor(Math.abs(diffMs) / 3_600_000);
    const overdueM = Math.floor((Math.abs(diffMs) % 3_600_000) / 60_000);
    return {
      text: overdueH > 0 ? `+${overdueH}h ${overdueM}m vencido` : `+${overdueM}m vencido`,
      overdue: true,
      percent: 0,
    };
  }

  const h = Math.floor(diffMs / 3_600_000);
  const m = Math.floor((diffMs % 3_600_000) / 60_000);
  return { text: h > 0 ? `${h}h ${m}m` : `${m}m`, overdue: false, percent };
}

function SlaBar({ percent, overdue }: { percent: number; overdue: boolean }) {
  const barColor = overdue
    ? 'bg-danger'
    : percent > 50
    ? 'bg-success'
    : percent > 25
    ? 'bg-warning'
    : 'bg-danger';

  return (
    <div className="w-full h-0.5 bg-border rounded-full overflow-hidden mt-3">
      <div
        className={cn('h-full rounded-full transition-all duration-500', barColor, overdue && 'animate-sla-pulse')}
        style={{ width: `${overdue ? 100 : percent}%` }}
      />
    </div>
  );
}

interface TicketCardContentProps {
  ticket: Ticket;
  isDragging?: boolean;
}

export function TicketCardContent({ ticket, isDragging }: TicketCardContentProps) {
  const p = priorityConfig[ticket.priority];
  const sla = formatSla(ticket.slaDueDate, ticket.createdAt);

  return (
    <div
      className={cn(
        'bg-card border border-border rounded-lg p-3 select-none transition-all duration-150',
        'hover:border-accent/25 hover:shadow-lg',
        isDragging && 'opacity-50 shadow-xl ring-2 ring-accent shadow-accent/20'
      )}
      style={!isDragging ? undefined : undefined}
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-2.5">
        <span className={cn('text-[10px] px-2 py-0.5 rounded border font-bold tracking-wider', p.cls)}>
          {p.label}
        </span>
        <span className="text-text-muted text-[10px] font-mono">
          #{ticket.id.slice(-6).toUpperCase()}
        </span>
      </div>

      {/* Title */}
      <p className="text-text-primary text-sm font-medium mb-1 line-clamp-2 leading-snug">
        {ticket.title}
      </p>

      {/* Sector */}
      <p className="text-text-muted text-xs mb-3">{ticket.sector.name}</p>

      {/* Footer row */}
      <div className="flex items-center justify-between">
        <div
          className={cn(
            'flex items-center gap-1 text-xs',
            sla.overdue ? 'text-danger font-semibold animate-sla-pulse' : 'text-text-secondary'
          )}
        >
          <Clock className="w-3 h-3 shrink-0" />
          <span>{sla.text}</span>
        </div>
        {ticket.responsible && (
          <div className="flex items-center gap-1 text-xs text-text-muted">
            <User className="w-3 h-3" />
            <span>{ticket.responsible.name.split(' ')[0]}</span>
          </div>
        )}
      </div>

      {/* SLA progress bar */}
      <SlaBar percent={sla.percent} overdue={sla.overdue} />
    </div>
  );
}

export function TicketCard({ ticket }: { ticket: Ticket }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: ticket.id });

  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing"
    >
      <TicketCardContent ticket={ticket} isDragging={isDragging} />
    </div>
  );
}
