'use client';

import { Header } from '@/components/layout/header';
import { KanbanBoard } from '@/components/kanban/kanban-board';
import { useKanban } from '@/hooks/use-kanban';
import type { TicketStatus } from '@/types';

export default function KanbanPage() {
  const { data, isLoading, error, updateStatus } = useKanban();

  function handleStatusChange(ticketId: string, newStatus: TicketStatus) {
    updateStatus.mutate({ ticketId, status: newStatus });
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Kanban" />
      <div className="p-6">
        {isLoading && (
          <div className="flex items-center justify-center h-48">
            <p className="text-text-secondary text-sm">Carregando Kanban...</p>
          </div>
        )}
        {error && (
          <div className="bg-danger/10 border border-danger/30 rounded-lg p-4">
            <p className="text-danger text-sm">Erro ao carregar Kanban.</p>
          </div>
        )}
        {data && <KanbanBoard columns={data} onStatusChange={handleStatusChange} />}
      </div>
    </div>
  );
}
