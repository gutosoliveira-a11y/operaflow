import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { ApiResponse, KanbanColumns, TicketStatus } from '@/types';

export function useKanban(sectorId?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['kanban', sectorId],
    queryFn: async () => {
      const params = sectorId ? `?sectorId=${sectorId}` : '';
      const { data } = await api.get<ApiResponse<KanbanColumns>>(`/tickets/kanban${params}`);
      return data.data;
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({
      ticketId,
      status,
      comment,
    }: {
      ticketId: string;
      status: TicketStatus;
      comment?: string;
    }) => {
      const { data } = await api.patch(`/tickets/${ticketId}/status`, { status, comment });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  return { ...query, updateStatus };
}
