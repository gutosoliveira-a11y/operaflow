'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { KanbanColumn } from './kanban-column';
import { TicketCard } from './ticket-card';
import type { KanbanColumns, Ticket, TicketStatus } from '@/types';

type KanbanColId = keyof KanbanColumns;

const COLUMN_IDS: KanbanColId[] = ['aberto', 'em_andamento', 'aguardando', 'escalado'];

interface KanbanBoardProps {
  columns: KanbanColumns;
  onStatusChange: (ticketId: string, newStatus: TicketStatus) => void;
}

export function KanbanBoard({ columns, onStatusChange }: KanbanBoardProps) {
  const [local, setLocal] = useState<KanbanColumns>(columns);
  const [active, setActive] = useState<Ticket | null>(null);

  useEffect(() => { setLocal(columns); }, [columns]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function isColId(value: string): value is KanbanColId {
    return (COLUMN_IDS as string[]).includes(value);
  }

  function findCol(ticketId: string): KanbanColId | null {
    for (const col of COLUMN_IDS) {
      if (local[col].find((t: Ticket) => t.id === ticketId)) return col;
    }
    return null;
  }

  function handleDragStart({ active: a }: DragStartEvent) {
    const col = findCol(a.id as string);
    if (col) setActive(local[col].find((t: Ticket) => t.id === a.id) ?? null);
  }

  function handleDragOver({ active: a, over }: DragOverEvent) {
    if (!over) return;
    const activeId = a.id as string;
    const overId = over.id as string;
    const fromCol = findCol(activeId);
    const toCol: KanbanColId | null = isColId(overId) ? overId : findCol(overId);
    if (!fromCol || !toCol || fromCol === toCol) return;
    setLocal((prev) => {
      const ticket = prev[fromCol].find((t: Ticket) => t.id === activeId)!;
      return {
        ...prev,
        [fromCol]: prev[fromCol].filter((t: Ticket) => t.id !== activeId),
        [toCol]: [...prev[toCol], ticket],
      };
    });
  }

  function handleDragEnd({ active: a, over }: DragEndEvent) {
    setActive(null);
    if (!over) return;
    const activeId = a.id as string;
    const overId = over.id as string;
    const col = findCol(activeId);
    if (!col) return;

    if (isColId(overId)) {
      onStatusChange(activeId, overId as TicketStatus);
    } else if (activeId !== overId) {
      setLocal((prev) => {
        const items = prev[col];
        const oldIdx = items.findIndex((t: Ticket) => t.id === activeId);
        const newIdx = items.findIndex((t: Ticket) => t.id === overId);
        if (oldIdx === -1 || newIdx === -1) return prev;
        return { ...prev, [col]: arrayMove(items, oldIdx, newIdx) };
      });
      const destCol = findCol(overId);
      if (destCol && destCol !== col) onStatusChange(activeId, destCol as TicketStatus);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLUMN_IDS.map((colId) => (
          <KanbanColumn key={colId} id={colId} tickets={local[colId]} />
        ))}
      </div>
      <DragOverlay dropAnimation={null}>
        {active ? <TicketCard ticket={active} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
