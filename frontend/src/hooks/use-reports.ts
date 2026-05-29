import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { ApiResponse, ReportData } from '@/types';

export function useReports(period: number) {
  return useQuery({
    queryKey: ['reports', period],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<ReportData>>(`/dashboard/reports?period=${period}`);
      return data.data;
    },
    staleTime: 60_000,
  });
}
