import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { ApiResponse } from '@/types';

export function useUnreadCount(): number {
  const { data } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<number>>('/notifications/unread-count');
      return data.data;
    },
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
  return data ?? 0;
}
