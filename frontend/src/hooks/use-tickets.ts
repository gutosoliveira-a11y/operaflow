import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { ApiResponse, Ticket } from '@/types';

export interface TicketFilters {
  status?: string;
  priority?: string;
  sectorId?: string;
  search?: string;
}

export function useTickets(filters: TicketFilters = {}) {
  return useQuery({
    queryKey: ['tickets', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.priority) params.set('priority', filters.priority);
      if (filters.sectorId) params.set('sectorId', filters.sectorId);
      if (filters.search) params.set('search', filters.search);
      const { data } = await api.get<ApiResponse<Ticket[]>>(`/tickets?${params}`);
      return data.data;
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}

export function useCreateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: {
      title: string;
      description?: string;
      sectorId: string;
      priority: string;
    }) => {
      const { data } = await api.post<ApiResponse<Ticket>>('/tickets', body);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tickets'] }),
  });
}
