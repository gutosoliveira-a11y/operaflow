'use client';

import { useState, useEffect, useRef } from 'react';
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
import { TicketCardContent } from './ticket-card';
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
  const isDraggingRef = useRef(false);
  const activeSourceCol = useRef<KanbanColId | null>(null);

  useEffect(() => {
    if (!isDraggingRef.current) setLocal(columns);
  }, [columns]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function isColId(value: string): value is KanbanColId {
    return (COLUMN_IDS as string[]).includes(value);
  }

  function findCol(ticketId: string): KanbanColId | null {
    for (const col of COLUMN_IDS) {
      if (local[col].find((t) => t.id === ticketId)) return col;
    }
    return null;
  }

  function handleDragStart({ active: a }: DragStartEvent) {
    isDraggingRef.current = true;
    const col = findCol(a.id as string);
    activeSourceCol.current = col;
    if (col) setActive(local[col].find((t) => t.id === a.id) ?? null);
  }

  function handleDragOver({ active: a, over }: DragOverEvent) {
    if (!over) return;
    const activeId = a.id as string;
    const overId = over.id as string;
    const fromCol = findCol(activeId);
    const toCol: KanbanColId | null = isColId(overId) ? overId : findCol(overId);
    if (!fromCol || !toCol || fromCol === toCol) return;
    setLocal((prev) => {
      const ticket = prev[fromCol].find((t) => t.id === activeId);
      if (!ticket) return prev; // already moved, prevent double-move crash
      return {
        ...prev,
        [fromCol]: prev[fromCol].filter((t) => t.id !== activeId),
        [toCol]: [...prev[toCol], ticket],
      };
    });
  }

  function handleDragEnd({ active: a, over }: DragEndEvent) {
    isDraggingRef.current = false;
    setActive(null);
    if (!over) {
      activeSourceCol.current = null;
      return;
    }
    const activeId = a.id as string;
    const overId = over.id as string;
    const currentCol = findCol(activeId); // destination col (post-dragOver moves)
    const sourceCol = activeSourceCol.current;
    activeSourceCol.current = null;

    if (!currentCol) return;

    if (sourceCol && sourceCol !== currentCol) {
      // Cross-column move — always fire status change regardless of what overId is
      onStatusChange(activeId, currentCol as TicketStatus);
    } else if (activeId !== overId && isColId(overId) && sourceCol === overId) {
      // Same-column drop on column droppable — no-op
    } else if (activeId !== overId && !isColId(overId)) {
      // Same-column reorder (overId is a sibling ticket)
      setLocal((prev) => {
        const items = prev[currentCol];
        const oldIdx = items.findIndex((t) => t.id === activeId);
        const newIdx = items.findIndex((t) => t.id === overId);
        if (oldIdx === -1 || newIdx === -1) return prev;
        return { ...prev, [currentCol]: arrayMove(items, oldIdx, newIdx) };
      });
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
        {active ? <TicketCardContent ticket={active} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}
