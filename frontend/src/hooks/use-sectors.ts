import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { ApiResponse, Sector } from '@/types';

export function useSectors() {
  return useQuery({
    queryKey: ['sectors'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Sector[]>>('/sectors');
      return data.data;
    },
    staleTime: 60_000,
  });
}

export function useCreateSector() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { name: string; slaDefaultHours: number; responsibleId?: string }) => {
      const { data } = await api.post<ApiResponse<Sector>>('/sectors', body);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sectors'] }),
  });
}

export function useUpdateSector(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: Partial<{ name: string; slaDefaultHours: number; responsibleId: string | null }>) => {
      const { data } = await api.patch<ApiResponse<Sector>>(`/sectors/${id}`, body);
      return data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sectors'] }),
  });
}
