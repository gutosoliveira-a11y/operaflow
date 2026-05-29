'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { cn } from '@/lib/utils';
import { TicketCard } from './ticket-card';
import type { KanbanColumns, Ticket } from '@/types';

type KanbanColId = keyof KanbanColumns;

const columnConfig: Record<KanbanColId, { label: string; topColor: string }> = {
  aberto:       { label: 'Aberto',       topColor: 'border-t-info' },
  em_andamento: { label: 'Em Andamento', topColor: 'border-t-success' },
  aguardando:   { label: 'Aguardando',   topColor: 'border-t-warning' },
  escalado:     { label: 'Escalado',     topColor: 'border-t-danger' },
};

interface KanbanColumnProps {
  id: KanbanColId;
  tickets: Ticket[];
}

export function KanbanColumn({ id, tickets }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const config = columnConfig[id];

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'bg-surface rounded-lg border-t-2 w-64 flex-shrink-0 flex flex-col',
        config.topColor,
        isOver && 'ring-1 ring-accent/50'
      )}
    >
      <div className="flex items-center justify-between px-3 py-3 border-b border-border">
        <span className="text-text-primary text-sm font-semibold">{config.label}</span>
        <span className="bg-surface border border-border text-text-secondary text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium tabular-nums">
          {tickets.length}
        </span>
      </div>

      <div className="p-2 space-y-2 flex-1 min-h-[400px]">
        <SortableContext items={tickets.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </SortableContext>
        {tickets.length === 0 && (
          <div className="flex items-center justify-center h-24 border-2 border-dashed border-border rounded-lg mx-1">
            <p className="text-text-muted text-xs">Nenhum chamado</p>
          </div>
        )}
      </div>
    </div>
  );
}
