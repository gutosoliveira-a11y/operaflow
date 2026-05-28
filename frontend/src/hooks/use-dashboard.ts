import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { ApiResponse, KpiData } from '@/types';

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard', 'kpis'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<KpiData>>('/dashboard/kpis');
      return data.data;
    },
    refetchInterval: 30_000,
  });
}
