import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { ApiResponse, SlaConfig } from '@/types';

export function useSlaConfig() {
  return useQuery({
    queryKey: ['sla-config'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<SlaConfig[]>>('/sectors/sla-config');
      return data.data;
    },
    staleTime: 60_000,
  });
}

export function useUpsertSlaConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ sectorId, priority, hoursLimit }: { sectorId: string; priority: string; hoursLimit: number }) => {
      const { data } = await api.patch<ApiResponse<SlaConfig>>(`/sectors/${sectorId}/sla-config`, { priority, hoursLimit });
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sla-config'] }),
  });
}
