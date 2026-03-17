import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/axios';
import type { PaginatedResponse } from '@/types/api';

export function usePaginatedData<T>(baseUrl: string, page: number, search: string) {
  return useQuery<PaginatedResponse<T>>({
    queryKey: [baseUrl, page, search],
    queryFn: async () => {
      const params: Record<string, string | number> = { page };
      if (search) params.search = search;
      const { data } = await apiClient.get<PaginatedResponse<T>>(baseUrl, { params });
      return data;
    },
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });
}
