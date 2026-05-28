'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Clock, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Ticket, Priority } from '@/types';

const priorityConfig: Record<Priority, { label: string; cls: string }> = {
  critica: { label: 'CRÍTICA', cls: 'bg-danger/20 text-danger border-danger/30' },
  alta:    { label: 'ALTA',    cls: 'bg-warning/20 text-warning border-warning/30' },
  media:   { label: 'MÉDIA',   cls: 'bg-info/20 text-info border-info/30' },
  baixa:   { label: 'BAIXA',   cls: 'bg-surface text-text-secondary border-border' },
};

function formatSla(slaDueDate: string | null): { text: string; overdue: boolean } {
  if (!slaDueDate) return { text: 'Sem SLA', overdue: false };
  const diffMs = new Date(slaDueDate).getTime() - Date.now();
  if (isNaN(diffMs)) return { text: 'Sem SLA', overdue: false };
  if (diffMs < 0) return { text: 'VENCIDO', overdue: true };
  const h = Math.floor(diffMs / 3_600_000);
  const m = Math.floor((diffMs % 3_600_000) / 60_000);
  return { text: h > 0 ? `${h}h ${m}m` : `${m}m`, overdue: false };
}

interface TicketCardContentProps {
  ticket: Ticket;
  isDragging?: boolean;
}

export function TicketCardContent({ ticket, isDragging }: TicketCardContentProps) {
  const p = priorityConfig[ticket.priority];
  const sla = formatSla(ticket.slaDueDate);

  return (
    <div
      className={cn(
        'bg-card border border-border rounded-lg p-3 select-none',
        isDragging && 'opacity-50 shadow-xl ring-1 ring-accent'
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <span className={cn('text-xs px-2 py-0.5 rounded border font-medium', p.cls)}>
          {p.label}
        </span>
        <span className="text-text-muted text-xs font-mono">
          #{ticket.id.slice(-4).toUpperCase()}
        </span>
      </div>

      <p className="text-text-primary text-sm font-medium mb-1 line-clamp-2 leading-snug">
        {ticket.title}
      </p>
      <p className="text-text-secondary text-xs mb-3">{ticket.sector.name}</p>

      <div className="flex items-center justify-between">
        <div className={cn('flex items-center gap-1 text-xs', sla.overdue ? 'text-danger font-semibold' : 'text-text-secondary')}>
          <Clock className="w-3 h-3" />
          <span>{sla.text}</span>
        </div>
        {ticket.responsible && (
          <div className="flex items-center gap-1 text-xs text-text-secondary">
            <User className="w-3 h-3" />
            <span>{ticket.responsible.name.split(' ')[0]}</span>
          </div>
        )}
      </div>
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
