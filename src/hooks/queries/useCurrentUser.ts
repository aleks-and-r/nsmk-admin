import { useQuery } from '@tanstack/react-query';
import { getMeApi } from '@/services/auth.service';

export function useCurrentUser(enabled = true) {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: getMeApi,
    staleTime: 1000 * 60 * 10,
    retry: false,
    enabled,
  });
}
